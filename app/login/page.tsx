"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  console.log("LOGIN PAGE RENDER");
  
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    console.log("LOGIN: SIGN IN START");

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1e293b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
            color: "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            PROJECT LOGISTICS
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 850,
            }}
          >
            Project Command
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#cbd5e1",
              fontSize: 14,
            }}
          >
            AI-Powered Trucking Operating System
          </p>
        </div>

        <section
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: 30,
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#172033",
              }}
            >
              Sign in
            </h2>

            <p
              style={{
                margin: "7px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Access your Project Logistics account.
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                marginBottom: 18,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 800,
                color: "#374151",
                marginBottom: 7,
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 13px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: 14,
                marginBottom: 18,
                color: "#111827",
                background: "#ffffff",
              }}
            />

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 800,
                color: "#374151",
                marginBottom: 7,
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 13px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: 14,
                marginBottom: 22,
                color: "#111827",
                background: "#ffffff",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 10,
                padding: "13px 16px",
                background: loading ? "#64748b" : "#111827",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 11,
            }}
          >
            Project Logistics
            <br />
            AI recommends. Human decides.
          </div>
        </section>
      </div>
    </main>
  );
}