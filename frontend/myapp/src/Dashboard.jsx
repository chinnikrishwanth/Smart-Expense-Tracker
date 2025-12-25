// Dashboard.js
import React, { useEffect, useState, useCallback } from "react";
import { apiRequest } from "./utils/api";
import ChartComponent from "./chart";

function Dashboard({ user }) {
  const [summary, setSummary] = useState({ totalExpense: 0, budget: 0, alert: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchSummary = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(`/dashboard-summary?user=${encodeURIComponent(user.email)}`);
      // Handle both response formats
      const summaryData = data.summary || data;
      setSummary({
        totalExpense: summaryData.totalExpenses || 0,
        budget: summaryData.budget || 0,
        alert: (summaryData.totalExpenses || 0) >= (summaryData.budget || 0),
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchSummary();
    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(() => {
      fetchSummary();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const remaining = summary.budget - summary.totalExpense;
  const percentage = summary.budget > 0 ? (summary.totalExpense / summary.budget) * 100 : 0;

  if (loading) {
    return (
      <div className="page-container">
        <h2 style={{ marginBottom: "2rem", color: "var(--text-primary)" }}>Dashboard</h2>
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 className="page-title" style={{ margin: 0 }}>Dashboard</h2>
        {!loading && (
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
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {summary.alert && (
        <div className="alert alert-error" style={{ 
          marginBottom: "1.5rem",
          animation: "pulse 2s ease-in-out infinite"
        }}>
          ⚠️ Budget exceeded! You've spent more than your monthly budget.
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
        marginBottom: "3rem"
      }}>
        {/* Total Expenses */}
        <div className="animate-scale-in" style={{
          background: "var(--card-gradient-1)",
          padding: "2rem",
          borderRadius: "var(--card-radius)",
          color: "white",
          boxShadow: "var(--shadow-card)",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          animationDelay: "0.1s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(99, 102, 241, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
        }}
        >
          <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "1rem", fontWeight: "500" }}>Total Expenses</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-0.5px", transition: "transform 0.3s ease" }}>₹{summary.totalExpense.toLocaleString()}</div>
        </div>

        {/* Budget */}
        <div className="animate-scale-in" style={{
          background: "var(--card-gradient-2)",
          padding: "2rem",
          borderRadius: "var(--card-radius)",
          color: "white",
          boxShadow: "var(--shadow-card)",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          animationDelay: "0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(219, 39, 119, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
        }}
        >
          <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "1rem", fontWeight: "500" }}>Monthly Budget</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-0.5px" }}>₹{summary.budget.toLocaleString()}</div>
        </div>

        {/* Remaining */}
        <div className="animate-scale-in" style={{
          background: "var(--card-gradient-3)",
          padding: "2rem",
          borderRadius: "var(--card-radius)",
          color: "white",
          boxShadow: "var(--shadow-card)",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          animationDelay: "0.3s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(6, 182, 212, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
        }}
        >
          <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "1rem", fontWeight: "500" }}>Remaining</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-0.5px" }}>₹{remaining.toLocaleString()}</div>
        </div>
      </div>

      {summary.budget > 0 && (
        <div className="card-panel animate-slide-in" style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "1rem" }}>Budget Usage</span>
            <span style={{ 
              color: percentage > 90 ? "#ef4444" : percentage > 75 ? "#f59e0b" : "var(--text-primary)", 
              fontWeight: "700",
              fontSize: "1.1rem",
              transition: "color 0.3s ease"
            }}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div style={{
            width: "100%",
            height: "16px",
            backgroundColor: "#f1f5f9",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              width: `${Math.min(percentage, 100)}%`,
              height: "100%",
              background: percentage > 90 
                ? "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                : percentage > 75
                ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                : "linear-gradient(90deg, #10b981 0%, #059669 100%)",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease",
              animation: "slideIn 0.8s ease-out"
            }} />
          </div>
        </div>
      )}

    

      {/* Expense Chart Component */}
      <ChartComponent user={user} />
    </div>
  );
}

export default Dashboard;
