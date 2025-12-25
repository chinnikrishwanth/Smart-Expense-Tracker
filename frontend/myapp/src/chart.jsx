import React, { useEffect, useState, useCallback } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { apiRequest } from "./utils/api"; 

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Chart Component
const ChartComponent = ({ user }) => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to format the month name
  const formatMonth = (monthStr) => {
    const [year, m] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Data Fetching Logic
  const fetchReports = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      setError("");
      
      // API Call
      const response = await apiRequest(`/reports/monthly?user=${encodeURIComponent(user.email)}&month=${month}`);
      
      setData(response);

      // Process Data for Chart
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

  // Trigger Fetch on Change
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Calculate Total
  const total = data ? data.reduce((sum, item) => sum + item.total, 0) : 0;

  // Render
  return (
    <div className="chart-container animate-slide-in" style={{ marginTop: "2rem" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Expense Breakdown by Category</h3>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="auth-input"
          style={{ 
            padding: "0.6rem 0.9rem", 
            maxWidth: "180px",
            cursor: "pointer"
          }}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card-panel" style={{ 
          textAlign: "center", 
          padding: "2rem", 
          color: "var(--text-secondary)"
        }}>
          Loading chart data...
        </div>
      ) : chartData ? (
        <>
          {/* Summary Card */}
          <div className="animate-scale-in" style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "1.5rem",
            borderRadius: "12px",
            color: "white",
            marginBottom: "1.5rem",
            textAlign: "center",
            boxShadow: "var(--shadow-md)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          >
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Total for {formatMonth(month)}</div>
            <div style={{ fontSize: "2rem", fontWeight: "700" }}>₹{total.toLocaleString()}</div>
          </div>

          {/* Chart Area */}
          <div className="card-panel animate-slide-in" style={{ 
            maxWidth: "500px", 
            margin: "0 auto"
          }}>
            <Pie 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                  animateRotate: true,
                  animateScale: true,
                  duration: 1200,
                  easing: 'easeOutQuart'
                },
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      font: {
                        size: 13,
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
                      label: function(context) {
                        const value = context.parsed || 0;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return ` ${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </>
      ) : (
        <div className="card-panel" style={{ 
          textAlign: "center", 
          padding: "2rem", 
          color: "var(--text-secondary)" 
        }}>
          No expenses found for {formatMonth(month)}.
        </div>
      )}
    </div>
  );
};

export default ChartComponent;
