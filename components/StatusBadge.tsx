"use client";

type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let background = "#f1f5f9";
  let color = "#475569";

  if (
    normalized.includes("active") ||
    normalized.includes("approved") ||
    normalized.includes("delivered") ||
    normalized.includes("completed") ||
    normalized.includes("paid") ||
    normalized.includes("ready")
  ) {
    background = "#dcfce7";
    color = "#166534";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("submitted") ||
    normalized.includes("transit")
  ) {
    background = "#fef3c7";
    color = "#92400e";
  }

  if (
    normalized.includes("inactive") ||
    normalized.includes("blocked") ||
    normalized.includes("rejected") ||
    normalized.includes("failed") ||
    normalized.includes("cancelled")
  ) {
    background = "#fee2e2";
    color = "#991b1b";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5px 9px",
        borderRadius: "999px",
        background,
        color,
        fontSize: "11px",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}