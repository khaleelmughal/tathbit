import React, { useState } from "react";
import { staffLogin, setToken } from "../lib/api";
import logoSquare from "@assets/login-page.png";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{
    background: T.card, border: `1px solid ${T.line}`,
    borderRadius: "12px", padding: "24px", ...style
  }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = "primary", type = "button", style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: variant === "primary" ? T.green : "transparent",
      color: variant === "primary" ? "white" : T.ink,
      border: variant === "primary" ? "none" : `1px solid ${T.line}`,
      padding: "12px 24px", borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px", fontWeight: "500", opacity: disabled ? 0.6 : 1,
      fontFamily: "Plus Jakarta Sans, sans-serif",
      ...style
    }}
  >
    {children}
  </button>
);

export default function StaffLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await staffLogin(email.trim(), password.trim());
      setToken(response.token);
      onSuccess(response.user);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${T.paper} 0%, ${T.paper2} 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Plus Jakarta Sans, sans-serif"
    }}>
      <Card style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src={logoSquare}
            alt="Tathbīt"
            style={{
              width: "375px",
              objectFit: "contain",
              margin: "0 auto 16px",
              display: "block",
            }}
          />
          <h1 style={{
            fontSize: "32px",
            fontFamily: "Fraunces, serif",
            color: T.ink,
            margin: 0,
            marginBottom: "1px"
          }}>
          Staff Login
          </h1>
          <p style={{ color: T.ink2, margin: 0, fontSize: "16px" }}>
            Admin and Teacher access
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: T.ink,
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px"
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${T.line}`,
                borderRadius: "8px",
                fontSize: "16px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                background: "white",
                color: T.ink
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              color: T.ink,
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px"
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${T.line}`,
                borderRadius: "8px",
                fontSize: "16px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                background: "white",
                color: T.ink
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEE2E2",
              color: "#DC2626",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              {error}
            </div>
          )}

          <Btn
            type="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Btn>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: `1px solid ${T.line}`
        }}>
          <p style={{ color: T.faint, fontSize: "14px", margin: 0 }}>
            Student? <a href="/" style={{ color: T.green, textDecoration: "none" }}>Login here</a>
          </p>
        </div>
      </Card>
      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: T.faint }}>
      Copyright &copy; 2026 Tathbīt
      </div>
    </div>
  );
}