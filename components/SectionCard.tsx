"use client";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export default function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      {(title || description) && (
        <div style={{ marginBottom: "18px" }}>
          {title && (
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {title}
            </h2>
          )}

          {description && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "13px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}