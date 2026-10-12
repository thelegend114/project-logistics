"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  name: string;
  legal_name: string;
  dot_number: string;
  mc_number: string;
  phone: string;
  email: string;
};

export default function CompanyPage() {
  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    dot_number: "",
    mc_number: "",
    phone: "",
    email: "",
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCompanies() {
    setLoading(true);

    const { data, error } = await supabase
      .from("companies")
      .select(
        "id, name, legal_name, dot_number, mc_number, phone, email"
      );

    if (error) {
      setMessage("❌ Error loading companies: " + error.message);
      setLoading(false);
      return;
    }

    setCompanies(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");

    const { error } = await supabase
      .from("companies")
      .insert([form]);

    if (error) {
      setMessage("❌ Error: " + error.message);
      return;
    }

    setForm({
      name: "",
      legal_name: "",
      dot_number: "",
      mc_number: "",
      phone: "",
      email: "",
    });

    setMessage("✅ Company saved successfully");

    await loadCompanies();
  }

  const inputStyle = {
    padding: "13px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              letterSpacing: "1px",
            }}
          >
            PROJECT LOGISTICS
          </div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "32px",
            }}
          >
            Company Setup
          </h1>

          <p style={{ color: "#94a3b8" }}>
            Manage your trucking company information.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "25px",
          }}
        >
          <section
            style={{
              background: "#1e293b",
              padding: "28px",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Company Information
            </h2>

            <form
              onSubmit={saveCompany}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <input
                name="name"
                placeholder="Company Name"
                value={form.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <input
                name="legal_name"
                placeholder="Legal Name"
                value={form.legal_name}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <input
                name="dot_number"
                placeholder="DOT Number"
                value={form.dot_number}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <input
                name="mc_number"
                placeholder="MC Number"
                value={form.mc_number}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
                style={inputStyle}
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
              />

              <button
                type="submit"
                style={{
                  marginTop: "5px",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Save Company
              </button>
            </form>

            {message && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  color: "#cbd5e1",
                }}
              >
                {message}
              </div>
            )}
          </section>

          <section
            style={{
              background: "#1e293b",
              padding: "28px",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Saved Companies
            </h2>

            {loading ? (
              <p style={{ color: "#94a3b8" }}>
                Loading companies...
              </p>
            ) : companies.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>
                No companies found.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {companies.map((company) => (
                  <div
                    key={company.id}
                    style={{
                      background: "#0f172a",
                      padding: "18px",
                      borderRadius: "10px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: "15px",
                      }}
                    >
                      {company.name}
                    </h3>

                    <p>
                      <strong>Legal:</strong>{" "}
                      {company.legal_name}
                    </p>

                    <p>
                      <strong>DOT:</strong>{" "}
                      {company.dot_number}
                    </p>

                    <p>
                      <strong>MC:</strong>{" "}
                      {company.mc_number}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {company.phone || "Not provided"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {company.email || "Not provided"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}