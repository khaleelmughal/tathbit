import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getToken, getCurrentUser, logout } from "./lib/api";
import ErrorBoundary from "./components/ErrorBoundary";

import StudentLogin from "./auth/StudentLogin";
import StaffLogin from "./auth/StaffLogin";
import StudentApp from "./screens/StudentApp";
import AdminDashboard from "./screens/AdminDashboard";
import TeacherDashboard from "./screens/TeacherDashboard";

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const initializeSession = async () => {
      const token = getToken();
      
      if (token) {
        try {
          const response = await getCurrentUser();
          setUser(response.user);
        } catch (error) {
          console.error("Session restore failed:", error);
          logout();
        }
      }
      
      setLoading(false);
      setInitializing(false);
    };

    initializeSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (initializing) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FBF7EE",
        fontFamily: "Plus Jakarta Sans, sans-serif"
      }}>
        <div style={{
          fontSize: "18px",
          color: "#2B3A33"
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user && user.role === "student" ? (
            <StudentApp user={user} onLogout={handleLogout} />
          ) : (
            <StudentLogin onSuccess={handleLogin} />
          )
        } 
      />
      <Route 
        path="/admin" 
        element={
          user && user.role === "admin" ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : user && user.role === "teacher" ? (
            <TeacherDashboard user={user} onLogout={handleLogout} />
          ) : (
            <StaffLogin onSuccess={handleLogin} />
          )
        } 
      />
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}