// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Budget from "./Budget";
import Reports from "./Reports";
import Login from "./Login";
import Signup from "./Signup";
import FinancialChatbot from "./components/FinancialChatbot";
import { getUser, setUser as saveUser, removeUser, removeToken } from "./utils/api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  // Check for existing user/token on mount
  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }

    // Listen for auth:logout event from API
    const handleAuthLogout = () => {
      handleLogout();
    };
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  // Handle login and save to localStorage
  const handleLogin = (userData) => {
    setUser(userData);
    saveUser(userData);
  };

  // Handle logout and clear localStorage
  const handleLogout = () => {
    setUser(null);
    removeUser();
    removeToken();
  };

  // Protect private routes - redirect to login if not authenticated
  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  // Protect public routes (login/signup) - redirect to dashboard if already authenticated
  const PublicRoute = ({ children }) => {
    return user ? <Navigate to="/dashboard" /> : children;
  };

  const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogoutClick = () => {
      handleLogout();
      navigate("/login");
    };

    return (
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("/dashboard")}>
          <span>💰</span> Expense Tracker
        </div>
        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/expenses"
            className={`nav-link ${location.pathname === "/expenses" ? "active" : ""}`}
          >
            💸 Expenses
          </Link>
          <Link
            to="/budget"
            className={`nav-link ${location.pathname === "/budget" ? "active" : ""}`}
          >
            💰 Budget
          </Link>
          <Link
            to="/reports"
            className={`nav-link ${location.pathname === "/reports" ? "active" : ""}`}
          >
            📈 Reports
          </Link>
          <button onClick={handleLogoutClick} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </nav>
    );
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <NavBar />
        <main className="main-content">
          {user && <FinancialChatbot />}
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div className="animate-fade-in">
                    <Login onLogin={handleLogin} />
                  </div>
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <div className="animate-fade-in">
                    <Signup />
                  </div>
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <div className="animate-fade-in">
                    <Dashboard user={user} />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <PrivateRoute>
                  <div className="animate-fade-in">
                    <Expenses user={user} />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <PrivateRoute>
                  <div className="animate-fade-in">
                    <Budget user={user} />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <div className="animate-fade-in">
                    <Reports user={user} />
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
