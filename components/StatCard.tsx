"use client";

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

export default function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px 20px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: "9px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "26px",
          lineHeight: 1.1,
          fontWeight: 800,
          color: "#0f172a",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>

      {description && (
        <div
          style={{
            marginTop: "7px",
            fontSize: "12px",
            color: "#64748b",
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}