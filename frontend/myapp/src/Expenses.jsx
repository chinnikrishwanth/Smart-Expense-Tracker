// Expenses.js
import React, { useEffect, useState, useCallback, useRef } from "react";
import { apiRequest } from "./utils/api";

function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ amount: "", date: "", category: "Food & Dining", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append('receipt', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/upload-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to parse receipt');

      const { amount, merchant } = result.data;

      setForm(prev => ({
        ...prev,
        amount: amount || prev.amount,
        description: merchant && merchant !== 'Unknown Merchant' ? `Receipt: ${merchant}` : prev.description
      }));

      // Success feedback
      const successMsg = document.createElement('div');
      successMsg.className = 'alert alert-success';
      successMsg.textContent = '✓ AI OCR extracted receipt data!';
      successMsg.style.position = 'fixed';
      successMsg.style.top = '20px';
      successMsg.style.right = '20px';
      successMsg.style.zIndex = '1000';
      successMsg.style.animation = 'slideIn 0.4s ease-out';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.remove();
      }, 3000);

      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      setError(err.message || 'Error processing receipt visually');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const fetchExpenses = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(`/expenses?user=${encodeURIComponent(user.email)}`);
      setExpenses(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to fetch expenses");
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchExpenses();
    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(() => {
      fetchExpenses();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchExpenses]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      setError("User not authenticated");
      return;
    }

    try {
      setError("");
      setAdding(true);
      await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify({ ...form, user: user.email }),
      });
      await fetchExpenses();
      setForm({ amount: "", date: "", category: "Food & Dining", description: "" });
      // Show success feedback
      const successMsg = document.createElement('div');
      successMsg.className = 'alert alert-success';
      successMsg.textContent = '✓ Expense added successfully!';
      successMsg.style.position = 'fixed';
      successMsg.style.top = '20px';
      successMsg.style.right = '20px';
      successMsg.style.zIndex = '1000';
      successMsg.style.animation = 'slideIn 0.4s ease-out';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => successMsg.remove(), 300);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to add expense");
      console.error("Error adding expense:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      setError("");
      await apiRequest(`/expenses/${id}`, {
        method: "DELETE"
      });
      await fetchExpenses();

      const successMsg = document.createElement('div');
      successMsg.className = 'alert alert-success';
      successMsg.textContent = '✓ Expense deleted successfully!';
      successMsg.style.position = 'fixed';
      successMsg.style.top = '20px';
      successMsg.style.right = '20px';
      successMsg.style.zIndex = '1000';
      successMsg.style.animation = 'slideIn 0.4s ease-out';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => successMsg.remove(), 300);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to delete expense");
      console.error("Error deleting expense:", err);
    }
  };

  const getCategoryColor = (category) => {
    // Map backend categories to colors
    const categoryKey = category.includes('Food') ? 'Food' :
      category.includes('Rent') || category.includes('Bills') ? 'Rent' :
        category === 'Travel' ? 'Travel' : 'Others';

    const colors = {
      Food: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      Rent: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      Travel: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      Others: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    };
    return colors[categoryKey] || colors.Others;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Expenses</h2>
        {!loading && expenses.length > 0 && (
          <div style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
              animation: "pulse 2s ease-in-out infinite"
            }}></span>
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card-panel animate-slide-in" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem", fontWeight: "700" }}>Add New Expense</h3>
          <div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {uploading ? "Analyzing..." : "📸 AI Scan Receipt"}
            </button>
          </div>
        </div>
        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#1e293b", fontWeight: "600", fontSize: "0.9rem" }}>
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#1e293b", fontWeight: "600", fontSize: "0.9rem" }}>
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#1e293b", fontWeight: "600", fontSize: "0.9rem" }}>
              Category
            </label>
            <select name="category" value={form.category} onChange={handleChange} className="auth-input">
              <option value="Food & Dining">Food</option>
              <option value="Bills & Utilities">Rent/Bills</option>
              <option value="Travel">Travel</option>
              <option value="Other">Others</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#1e293b", fontWeight: "600", fontSize: "0.9rem" }}>
              Description
            </label>
            <input
              name="description"
              placeholder="Enter description"
              value={form.description}
              onChange={handleChange}
              className="auth-input"
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn-primary" style={{ marginTop: 0 }} disabled={adding}>
              {adding ? "Adding..." : "+ Add Expense"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 style={{ marginBottom: "1.5rem", color: "#1e293b", fontSize: "1.25rem", fontWeight: "700" }}>Expense History</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b", background: "#f8fafc", borderRadius: "16px" }}>
            No expenses recorded yet. Add your first expense above!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {expenses.map((exp, index) => (
              <div
                key={exp._id || exp.id}
                className="list-item-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flex: 1 }}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: getCategoryColor(exp.category),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "1.5rem",
                    boxShadow: "0 8px 16px -4px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease",
                    cursor: "pointer"
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "rotate(5deg) scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "rotate(0) scale(1)"}
                  >
                    {exp.category.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "1.1rem", marginBottom: "0.2rem" }}>
                      {exp.category === 'Food & Dining' ? 'Food' :
                        exp.category === 'Bills & Utilities' ? 'Rent' :
                          exp.category === 'Other' ? 'Others' : exp.category}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                      {exp.description || "No description"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem", fontWeight: "500" }}>
                      {new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    background: "var(--bg-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}>
                    ₹{parseFloat(exp.amount).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDelete(exp._id || exp.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      padding: "0.5rem",
                      borderRadius: "50%",
                      transition: "background 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    title="Delete Expense"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;
