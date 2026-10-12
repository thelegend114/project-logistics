"use client";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "28px",
        flexWrap: "wrap",
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#2563eb",
              marginBottom: "7px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        )}

        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#0f172a",
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.5,
              maxWidth: "760px",
            }}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          style={{
            border: "none",
            borderRadius: "9px",
            padding: "11px 16px",
            background: "#0f172a",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}