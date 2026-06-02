import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: T.card,
          border: `1px solid ${T.line}`,
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          margin: "20px"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <AlertTriangle size={28} color="#DC2626" />
          </div>
          
          <h2 style={{
            fontSize: "20px",
            fontFamily: "Fraunces, serif",
            color: T.ink,
            margin: "0 0 8px 0"
          }}>
            Something went wrong
          </h2>
          
          <p style={{
            fontSize: "14px",
            color: T.ink2,
            margin: "0 0 24px 0"
          }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          
          <button
            onClick={this.handleRetry}
            style={{
              background: T.green,
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "0 auto"
            }}
          >
            <RefreshCcw size={16} />
            Try Again
          </button>
          
          {process.env.NODE_ENV === "development" && (
            <details style={{ marginTop: "20px", textAlign: "left" }}>
              <summary style={{ cursor: "pointer", color: T.faint }}>
                Error Details (Development)
              </summary>
              <pre style={{
                background: T.paper,
                padding: "12px",
                borderRadius: "6px",
                fontSize: "12px",
                color: T.ink,
                overflow: "auto",
                marginTop: "8px"
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;