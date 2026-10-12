"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch (error) {
      console.error("SIGN OUT ERROR:", error);
    }

    window.location.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        width: "100%",
        border: "1px solid #334155",
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "12px",
        fontWeight: 800,
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {loading ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
