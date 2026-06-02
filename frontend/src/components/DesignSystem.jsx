// Design System for Madrasah Tasheel App
// Consistent colors, typography, and components following the calm cream/green aesthetic

// Color Palette - Inspired by traditional Islamic manuscripts and child-friendly design
export const T = {
  // Primary Colors
  paper: "#FBF7EE",           // Warm cream background - main page background
  paper2: "#F3ECDD",          // Darker cream - secondary backgrounds
  card: "#FFFFFF",            // Pure white - card backgrounds
  ink: "#2B3A33",             // Dark sage - primary text
  ink2: "#5C6B62",            // Medium sage - secondary text
  faint: "#8A968D",           // Light sage - muted text
  line: "#E8E0CF",            // Cream border - subtle dividers
  green: "#1E7A57",           // Madrasah green - primary brand color
  greenSoft: "#E4F1E9",       // Soft green - success states, highlights
  gold: "#C99A2E",            // Islamic gold - accents, special elements

  // Status Colors
  success: "#10b981",         // Green success
  warning: "#f59e0b",         // Amber warning
  error: "#ef4444",           // Red error
  info: "#3b82f6",            // Blue info
};

// Typography Scale
export const Typography = {
  // Font Families
  heading: "Fraunces, serif",      // Elegant serif for headings
  body: "Plus Jakarta Sans, sans-serif",  // Clean sans for body text
  
  // Font Sizes (in pixels, can be converted to rem)
  xs: "12px",
  sm: "14px", 
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "30px",
  "4xl": "36px",
  
  // Font Weights
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Spacing Scale (consistent spacing throughout the app)
export const Spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "48px",
  "5xl": "64px",
};

// Border Radius Scale
export const Radius = {
  none: "0",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
};

// Shadow Scale
export const Shadow = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// Component Base Styles
export const BaseStyles = {
  card: {
    background: T.card,
    border: `1px solid ${T.line}`,
    borderRadius: Radius.xl,
    padding: Spacing["3xl"],
    boxShadow: Shadow.sm,
  },
  
  input: {
    width: "100%",
    padding: `${Spacing.md} ${Spacing.lg}`,
    border: `1px solid ${T.line}`,
    borderRadius: Radius.md,
    fontSize: Typography.sm,
    fontFamily: Typography.body,
    backgroundColor: T.card,
    color: T.ink,
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  
  inputFocus: {
    borderColor: T.green,
    boxShadow: `0 0 0 3px ${T.greenSoft}`,
  },
  
  button: {
    padding: `${Spacing.md} ${Spacing.lg}`,
    borderRadius: Radius.md,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    fontFamily: Typography.body,
    cursor: "pointer",
    border: "none",
    outline: "none",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: Spacing.sm,
    textDecoration: "none",
  },
};

// Reusable Components

// Main Card Component
export const Card = ({ children, className = "", style = {}, ...props }) => (
  <div 
    style={{
      ...BaseStyles.card,
      ...style
    }}
    className={className}
    {...props}
  >
    {children}
  </div>
);

// Button Component with Multiple Variants
export const Button = ({ 
  children, 
  variant = "outline", 
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  style = {},
  ...props 
}) => {
  const variants = {
    primary: {
      background: T.green,
      color: "white",
      border: "none",
    },
    secondary: {
      background: T.paper2,
      color: T.ink,
      border: `1px solid ${T.line}`,
    },
    outline: {
      background: "transparent",
      color: T.ink,
      border: `1px solid ${T.line}`,
    },
    ghost: {
      background: "transparent",
      color: T.ink2,
      border: "none",
    },
    danger: {
      background: T.error,
      color: "white",
      border: "none",
    },
    success: {
      background: T.success,
      color: "white", 
      border: "none",
    },
    warning: {
      background: T.warning,
      color: "white",
      border: "none",
    },
  };

  const sizes = {
    xs: {
      padding: `${Spacing.xs} ${Spacing.sm}`,
      fontSize: Typography.xs,
    },
    sm: {
      padding: `${Spacing.sm} ${Spacing.md}`,
      fontSize: Typography.xs,
    },
    md: {
      padding: `${Spacing.md} ${Spacing.lg}`,
      fontSize: Typography.sm,
    },
    lg: {
      padding: `${Spacing.lg} ${Spacing.xl}`,
      fontSize: Typography.base,
    },
  };

  const hoverStyles = {
    primary: { background: "#196f4a" },
    secondary: { background: T.line },
    outline: { background: T.paper },
    ghost: { background: T.paper2 },
    danger: { background: "#dc2626" },
    success: { background: "#059669" },
    warning: { background: "#d97706" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...BaseStyles.button,
        ...variants[variant],
        ...sizes[size],
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.target.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.target.style, variants[variant]);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = ({ 
  className = "", 
  style = {},
  error = false,
  ...props 
}) => (
  <input
    style={{
      ...BaseStyles.input,
      ...(error ? { 
        borderColor: T.error,
        boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`
      } : {}),
      ...style
    }}
    className={className}
    onFocus={(e) => {
      if (!error) {
        Object.assign(e.target.style, BaseStyles.inputFocus);
      }
    }}
    onBlur={(e) => {
      Object.assign(e.target.style, {
        borderColor: error ? T.error : T.line,
        boxShadow: error ? `0 0 0 3px rgba(239, 68, 68, 0.1)` : "none"
      });
    }}
    {...props}
  />
);

// Textarea Component
export const Textarea = ({ 
  className = "", 
  style = {},
  error = false,
  rows = 3,
  ...props 
}) => (
  <textarea
    rows={rows}
    style={{
      ...BaseStyles.input,
      minHeight: "80px",
      resize: "vertical",
      ...(error ? { 
        borderColor: T.error,
        boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`
      } : {}),
      ...style
    }}
    className={className}
    onFocus={(e) => {
      if (!error) {
        Object.assign(e.target.style, BaseStyles.inputFocus);
      }
    }}
    onBlur={(e) => {
      Object.assign(e.target.style, {
        borderColor: error ? T.error : T.line,
        boxShadow: error ? `0 0 0 3px rgba(239, 68, 68, 0.1)` : "none"
      });
    }}
    {...props}
  />
);

// Select Component
export const Select = ({ 
  className = "", 
  style = {},
  error = false,
  children,
  ...props 
}) => (
  <select
    style={{
      ...BaseStyles.input,
      cursor: "pointer",
      ...(error ? { 
        borderColor: T.error,
        boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`
      } : {}),
      ...style
    }}
    className={className}
    onFocus={(e) => {
      if (!error) {
        Object.assign(e.target.style, BaseStyles.inputFocus);
      }
    }}
    onBlur={(e) => {
      Object.assign(e.target.style, {
        borderColor: error ? T.error : T.line,
        boxShadow: error ? `0 0 0 3px rgba(239, 68, 68, 0.1)` : "none"
      });
    }}
    {...props}
  >
    {children}
  </select>
);

// Label Component
export const Label = ({ 
  children, 
  required = false,
  className = "", 
  style = {},
  ...props 
}) => (
  <label
    style={{
      display: "block",
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: T.ink,
      marginBottom: Spacing.xs,
      fontFamily: Typography.body,
      ...style
    }}
    className={className}
    {...props}
  >
    {children}
    {required && (
      <span style={{ color: T.error, marginLeft: "2px" }}>*</span>
    )}
  </label>
);

// Badge Component
export const Badge = ({ 
  children, 
  variant = "default",
  size = "sm",
  className = "", 
  style = {},
  ...props 
}) => {
  const variants = {
    default: {
      background: T.paper2,
      color: T.ink,
    },
    primary: {
      background: T.green,
      color: "white",
    },
    success: {
      background: T.success,
      color: "white",
    },
    warning: {
      background: T.warning,
      color: "white",
    },
    error: {
      background: T.error,
      color: "white",
    },
    info: {
      background: T.info,
      color: "white",
    },
  };

  const sizes = {
    xs: {
      padding: `${Spacing.xs} ${Spacing.sm}`,
      fontSize: "10px",
    },
    sm: {
      padding: `2px ${Spacing.sm}`,
      fontSize: Typography.xs,
    },
    md: {
      padding: `${Spacing.xs} ${Spacing.md}`,
      fontSize: Typography.sm,
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: Radius.full,
        fontWeight: Typography.medium,
        fontFamily: Typography.body,
        textTransform: "capitalize",
        ...variants[variant],
        ...sizes[size],
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
};

// Progress Bar Component
export const ProgressBar = ({ 
  percentage = 0,
  color = T.green,
  backgroundColor = T.line,
  height = "8px",
  showLabel = false,
  className = "",
  style = {},
  ...props
}) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height,
      backgroundColor,
      borderRadius: Radius.full,
      overflow: "hidden",
      ...style
    }}
    className={className}
    {...props}
  >
    <div
      style={{
        height: "100%",
        backgroundColor: color,
        width: `${Math.min(100, Math.max(0, percentage))}%`,
        transition: "width 0.3s ease",
        borderRadius: Radius.full,
      }}
    />
    {showLabel && (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: Typography.xs,
          fontWeight: Typography.medium,
          color: percentage > 50 ? "white" : T.ink,
        }}
      >
        {Math.round(percentage)}%
      </div>
    )}
  </div>
);

// Modal Component
export const Modal = ({ 
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  className = "",
  style = {},
  ...props
}) => {
  const maxWidths = {
    sm: "400px",
    md: "500px", 
    lg: "600px",
    xl: "800px",
    "2xl": "1000px",
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: Spacing.lg,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: T.card,
          borderRadius: Radius.xl,
          boxShadow: Shadow.xl,
          width: "100%",
          maxWidth: maxWidths[maxWidth],
          maxHeight: "90vh",
          overflow: "hidden",
          ...style
        }}
        className={className}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div
            style={{
              padding: `${Spacing["2xl"]} ${Spacing["2xl"]} 0`,
              borderBottom: `1px solid ${T.line}`,
              marginBottom: Spacing["2xl"],
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2
                style={{
                  fontSize: Typography.xl,
                  fontWeight: Typography.medium,
                  color: T.ink,
                  fontFamily: Typography.heading,
                  margin: 0,
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: Typography["2xl"],
                  color: T.faint,
                  cursor: "pointer",
                  padding: Spacing.sm,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div style={{ 
          padding: title ? `0 ${Spacing["2xl"]} ${Spacing["2xl"]}` : Spacing["2xl"],
          overflowY: "auto",
          maxHeight: title ? "calc(90vh - 100px)" : "calc(90vh - 48px)",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Alert Component
export const Alert = ({ 
  children,
  variant = "info",
  icon,
  className = "",
  style = {},
  ...props
}) => {
  const variants = {
    success: {
      backgroundColor: "#f0fdf4",
      borderColor: T.success,
      color: "#166534",
    },
    warning: {
      backgroundColor: "#fffbeb", 
      borderColor: T.warning,
      color: "#92400e",
    },
    error: {
      backgroundColor: "#fef2f2",
      borderColor: T.error,
      color: "#991b1b",
    },
    info: {
      backgroundColor: "#eff6ff",
      borderColor: T.info,
      color: "#1e40af",
    },
  };

  return (
    <div
      style={{
        padding: Spacing.lg,
        borderRadius: Radius.md,
        border: "1px solid",
        display: "flex",
        alignItems: "flex-start",
        gap: Spacing.md,
        fontSize: Typography.sm,
        fontFamily: Typography.body,
        ...variants[variant],
        ...style
      }}
      className={className}
      {...props}
    >
      {icon && (
        <div style={{ flexShrink: 0, marginTop: "2px" }}>
          {icon}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ 
  size = "md",
  color = T.green,
  className = "",
  style = {},
  ...props
}) => {
  const sizes = {
    sm: "16px",
    md: "24px",
    lg: "32px",
    xl: "48px",
  };

  return (
    <div
      style={{
        width: sizes[size],
        height: sizes[size],
        border: `2px solid ${T.line}`,
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        ...style
      }}
      className={className}
      {...props}
    />
  );
};

// Utility function for consistent spacing
export const spacing = (scale) => Spacing[scale] || scale;

// Utility function for consistent colors
export const color = (name) => T[name] || name;

// Export everything as default for easy importing
export default {
  T,
  Typography,
  Spacing,
  Radius,
  Shadow,
  BaseStyles,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Label,
  Badge,
  ProgressBar,
  Modal,
  Alert,
  LoadingSpinner,
  spacing,
  color,
};