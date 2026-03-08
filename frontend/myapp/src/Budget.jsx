// Budget.js
import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "./utils/api";

function Budget({ user }) {
  const [budget, setBudget] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM format
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState(null);
  const [fetchingForecast, setFetchingForecast] = useState(false);

  const fetchBudget = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(`/budget?user=${encodeURIComponent(user.email)}&month=${month}`);
      // Handle both response formats
      const budgetData = data.budget || data;
      setBudget(budgetData.amount || "");
      setSaved(false);
    } catch (err) {
      setError(err.message || "Failed to fetch budget");
      console.error("Error fetching budget:", err);
    } finally {
      setLoading(false);
    }
  }, [month, user?.email]);

  useEffect(() => {
    fetchBudget();

    // Fetch AI forecast
    const fetchForecast = async () => {
      if (!user?.email) return;
      try {
        setFetchingForecast(true);
        const data = await apiRequest('/ai/forecast');
        if (data && data.forecast !== undefined) {
          setForecast(data);
        }
      } catch (err) {
        console.error("Error fetching AI forecast:", err);
      } finally {
        setFetchingForecast(false);
      }
    };
    fetchForecast();
  }, [fetchBudget, user?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      setError("User not authenticated");
      return;
    }

    try {
      setError("");
      await apiRequest("/budget", {
        method: "POST",
        body: JSON.stringify({ user: user.email, month, amount: Number(budget) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save budget");
      console.error("Error saving budget:", err);
    }
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Set Monthly Budget</h2>
      </div>

      <div className="card-panel animate-slide-in" style={{ marginBottom: "2rem", background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", borderLeft: "4px solid #8b5cf6" }}>
        <h3 style={{ marginBottom: "1rem", color: "#1e293b", fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🤖 AI Budget Forecast
        </h3>
        {fetchingForecast ? (
          <div style={{ color: "#64748b", fontStyle: "italic" }}>Analyzing your spending patterns...</div>
        ) : forecast ? (
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#8b5cf6", marginBottom: "0.5rem" }}>
              ₹{parseFloat(forecast.forecast).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
              {forecast.message}
            </div>
          </div>
        ) : (
          <div style={{ color: "#64748b" }}>Not enough data to generate forecast.</div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="animate-scale-in" style={{
        background: "var(--card-gradient-1)",
        padding: "2.5rem",
        borderRadius: "24px",
        color: "white",
        marginBottom: "2.5rem",
        boxShadow: "0 20px 40px rgba(99, 102, 241, 0.25)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer"
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 25px 50px rgba(99, 102, 241, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(99, 102, 241, 0.25)";
        }}
      >
        <div style={{ fontSize: "1rem", opacity: 0.9, marginBottom: "0.5rem", fontWeight: "500" }}>
          Budget for {formatMonth(month)}
        </div>
        {budget && (
          <div style={{
            fontSize: "3rem",
            fontWeight: "800",
            letterSpacing: "-1px",
            transition: "transform 0.3s ease"
          }}>
            ₹{parseFloat(budget).toLocaleString()}
          </div>
        )}
      </div>

      <div className="card-panel animate-slide-in">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#1e293b",
              fontWeight: "600",
              fontSize: "0.9rem"
            }}>
              Select Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#1e293b",
              fontWeight: "600",
              fontSize: "0.9rem"
            }}>
              Budget Amount (₹)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter your monthly budget"
              required
              min="0"
              step="0.01"
              className="auth-input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 0 }}>
            {loading ? "Saving..." : saved ? "✓ Saved!" : "Save Budget"}
          </button>
        </form>

        {saved && (
          <div className="alert alert-success animate-slide-in" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
            ✓ Budget saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default Budget;
