// Reports.js
import React, { useEffect, useState, useCallback } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { apiRequest } from "./utils/api";

// Register required chart.js components once for the whole app.
ChartJS.register(ArcElement, Tooltip, Legend);

function Reports({ user }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError("");
      const response = await apiRequest(`/reports/monthly?user=${encodeURIComponent(user.email)}&month=${month}`);
      setData(response);
      // Assume response format: [{category: 'Food', total: 500}, ...]
      if (response && response.length > 0) {
        const colors = [
          "rgba(99, 102, 241, 0.8)",   // Indigo
          "rgba(139, 92, 246, 0.8)",   // Purple
          "rgba(6, 182, 212, 0.8)",    // Cyan
          "rgba(16, 185, 129, 0.8)",   // Green
          "rgba(245, 158, 11, 0.8)",   // Amber
          "rgba(239, 68, 68, 0.8)",    // Red
          "rgba(236, 72, 153, 0.8)",   // Pink
          "rgba(251, 146, 60, 0.8)"    // Orange
        ];

        setChartData({
          labels: response.map((item) => item.category),
          datasets: [
            {
              data: response.map((item) => item.total),
              backgroundColor: colors.slice(0, response.length),
              borderColor: colors.slice(0, response.length).map(c => c.replace('0.8', '1')),
              borderWidth: 2,
            },
          ],
        });
      } else {
        setChartData(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch reports");
      console.error("Error fetching reports:", err);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  }, [month, user?.email]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const total = data ? data.reduce((sum, item) => sum + item.total, 0) : 0;

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 className="page-title" style={{ margin: 0 }}>Expense Reports</h2>
        <div className="input-wrapper" style={{ minWidth: "200px" }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="auth-input"
            style={{ paddingLeft: "1rem" }}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading reports...
        </div>
      ) : chartData ? (
        <>
          <div className="animate-scale-in" style={{
            background: "var(--card-gradient-1)",
            padding: "2.5rem",
            borderRadius: "24px",
            color: "white",
            marginBottom: "2.5rem",
            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.25)",
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
              Total Expenses for {formatMonth(month)}
            </div>
            <div style={{ fontSize: "3rem", fontWeight: "800", letterSpacing: "-1px" }}>₹{total.toLocaleString()}</div>
          </div>

          <div className="card-panel animate-slide-in" style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem", color: "#1e293b", fontSize: "1.25rem", fontWeight: "700" }}>Category Breakdown</h3>
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                  },
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        font: {
                          size: 14,
                          family: "'Outfit', sans-serif"
                        },
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: {
                        size: 15,
                        weight: 'bold'
                      },
                      bodyFont: {
                        size: 13
                      },
                      callbacks: {
                        label: function (context) {
                          const label = context.label || '';
                          const value = context.parsed || 0;
                          const percentage = ((value / total) * 100).toFixed(1);
                          return ` ${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: "1.5rem", color: "#1e293b", fontSize: "1.25rem", fontWeight: "700" }}>Detailed Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.map((item, index) => {
                const percentage = ((item.total / total) * 100).toFixed(1);
                const colors = [
                  "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                ];

                return (
                  <div 
                    key={item.category} 
                    className="list-item-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flex: 1 }}>
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        background: colors[index % colors.length],
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
                        {item.category.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "1.1rem", marginBottom: "0.2rem" }}>
                          {item.category}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                          {percentage}% of total expenses
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: "1.5rem",
                      fontWeight: "800",
                      background: "var(--bg-gradient)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}>
                      ₹{parseFloat(item.total).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="card-panel" style={{ textAlign: "center", padding: "4rem" }}>
          {data && data.length === 0
            ? `No expenses recorded for ${formatMonth(month)}. Start adding expenses to see reports!`
            : "Loading chart..."
          }
        </div>
      )}
    </div>
  );
}

export default Reports;
