"use client";

type ActionButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export default function ActionButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
}: ActionButtonProps) {
  const styles = {
    primary: {
      background: "#0f172a",
      color: "#ffffff",
      border: "1px solid #0f172a",
    },
    secondary: {
      background: "#ffffff",
      color: "#334155",
      border: "1px solid #cbd5e1",
    },
    danger: {
      background: "#ffffff",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: "9px",
        padding: "10px 14px",
        fontSize: "12px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}