"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabasePage() {
  const [status, setStatus] = useState("Probando conexión...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("companies")
        .select("id")
        .limit(1);

      if (error) {
        setStatus(`Conexión realizada, pero Supabase respondió: ${error.message}`);
        return;
      }

      setStatus("✅ Project Logistics está conectado a Supabase correctamente.");
    }

    testConnection();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#111827",
          padding: "40px",
          borderRadius: "16px",
          width: "min(600px, 90%)",
          textAlign: "center",
        }}
      >
        <h1>Project Logistics</h1>
        <p style={{ marginTop: "20px", color: "#cbd5e1" }}>
          Supabase Connection Test
        </p>

        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            borderRadius: "10px",
            background: "#1f2937",
          }}
        >
          {status}
        </div>
      </div>
    </main>
  );
}