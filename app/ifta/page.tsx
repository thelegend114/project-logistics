"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

type Row = Record<string, unknown>;

function text(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }

  return "";
}

function num(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function formatNumber(
  value: number,
  decimals = 2
) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateValue(row: Row) {
  return text(row, [
    "transaction_date",
    "fuel_date",
    "date",
    "reporting_period",
    "period",
    "created_at",
  ]);
}

function sortRows(rows: Row[]) {
  return [...rows].sort((a, b) => {
    const aValue = dateValue(a);
    const bValue = dateValue(b);

    return bValue.localeCompare(aValue);
  });
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (error as { message?: unknown }).message ||
        "Unknown error"
    );
  }

  return "Unknown database error";
}

export default function IftaPage() {
  const [fuelRows, setFuelRows] = useState<Row[]>([]);
  const [iftaRows, setIftaRows] = useState<Row[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [section, setSection] =
    useState<"fuel" | "ifta">("fuel");

  async function loadData() {
    setError("");

    if (!loading) {
      setRefreshing(true);
    }

    try {
      const [fuelResult, iftaResult] =
        await Promise.all([
          supabase
            .from("fuel_transactions")
            .select("*"),

          supabase
            .from("ifta_jurisdictions")
            .select("*"),
        ]);

      const errors: string[] = [];

      if (fuelResult.error) {
        console.error(
          "IFTA fuel error:",
          fuelResult.error
        );

        errors.push(
          `Fuel transactions: ${getErrorMessage(
            fuelResult.error
          )}`
        );
      } else {
        setFuelRows(
          sortRows(
            (fuelResult.data || []) as Row[]
          )
        );
      }

      if (iftaResult.error) {
        console.error(
          "IFTA jurisdiction error:",
          iftaResult.error
        );

        errors.push(
          `IFTA records: ${getErrorMessage(
            iftaResult.error
          )}`
        );
      } else {
        setIftaRows(
          sortRows(
            (iftaResult.data || []) as Row[]
          )
        );
      }

      if (errors.length > 0) {
        setError(errors.join(" | "));
      }
    } catch (caught) {
      console.error(
        "IFTA load error:",
        caught
      );

      setError(
        `Unable to load IFTA data: ${getErrorMessage(
          caught
        )}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();

    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const filteredFuel = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return fuelRows;
    }

    return fuelRows.filter((row) =>
      Object.values(row)
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [fuelRows, search]);

  const filteredIfta = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return iftaRows;
    }

    return iftaRows.filter((row) =>
      Object.values(row)
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [iftaRows, search]);

  const stats = useMemo(() => {
    const gallons = fuelRows.reduce(
      (sum, row) =>
        sum +
        num(row, [
          "gallons",
          "fuel_gallons",
          "total_gallons",
        ]),
      0
    );

    const spend = fuelRows.reduce(
      (sum, row) =>
        sum +
        num(row, [
          "total_amount",
          "amount",
          "fuel_cost",
          "total_cost",
        ]),
      0
    );

    const miles = iftaRows.reduce(
      (sum, row) =>
        sum +
        num(row, [
          "miles",
          "total_miles",
          "jurisdiction_miles",
          "mileage",
        ]),
      0
    );

    const taxableGallons = iftaRows.reduce(
      (sum, row) =>
        sum +
        num(row, [
          "taxable_gallons",
          "taxable_fuel_gallons",
        ]),
      0
    );

    const taxDue = iftaRows.reduce(
      (sum, row) =>
        sum +
        num(row, [
          "tax_due",
          "tax_amount",
          "amount_due",
          "tax",
        ]),
      0
    );

    return {
      gallons,
      spend,
      miles,
      taxableGallons,
      taxDue,
      fuelRecords: fuelRows.length,
      jurisdictionRecords:
        iftaRows.length,
      costPerGallon:
        gallons > 0
          ? spend / gallons
          : 0,
      mpg:
        gallons > 0 && miles > 0
          ? miles / gallons
          : 0,
    };
  }, [fuelRows, iftaRows]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              PROJECT IFTA
            </div>

            <h1 style={styles.title}>
              Fuel & IFTA
            </h1>

            <p style={styles.subtitle}>
              Centralized fuel activity,
              jurisdiction reporting,
              mileage and tax exposure
              for the fleet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            <span
              style={styles.refreshIcon}
            >
              ↻
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </header>

        {error && (
          <div style={styles.errorBanner}>
            <div style={styles.errorTitle}>
              IFTA data warning
            </div>

            <div style={styles.errorText}>
              {error}
            </div>
          </div>
        )}

        <section style={styles.kpiGrid}>
          <StatCard
            label="Fuel Gallons"
            value={formatNumber(
              stats.gallons,
              1
            )}
            detail="Recorded fuel volume"
            icon="⛽"
          />

          <StatCard
            label="Fuel Spend"
            value={money(stats.spend)}
            detail="Recorded purchases"
            icon="💳"
          />

          <StatCard
            label="Taxable Gallons"
            value={formatNumber(
              stats.taxableGallons,
              2
            )}
            detail="IFTA taxable volume"
            icon="◈"
          />

          <StatCard
            label="Cost / Gallon"
            value={money(
              stats.costPerGallon
            )}
            detail="Average purchase cost"
            icon="📈"
          />

          <StatCard
            label="Tax Exposure"
            value={money(stats.taxDue)}
            detail="Recorded tax due"
            icon="⚠️"
            valueColor={
              stats.taxDue > 0
                ? "#b91c1c"
                : "#166534"
            }
          />
        </section>

        <section
          style={styles.secondaryGrid}
        >
          <Metric
            label="Fuel Records"
            value={String(
              stats.fuelRecords
            )}
          />

          <Metric
            label="IFTA Records"
            value={String(
              stats.jurisdictionRecords
            )}
          />

          <Metric
            label="Mileage"
            value={formatNumber(
              stats.miles,
              0
            )}
          />

          <Metric
            label="Fuel Efficiency"
            value={
              stats.mpg > 0
                ? `${formatNumber(
                    stats.mpg,
                    2
                  )} MPG`
                : "Not available"
            }
          />
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div
                style={styles.panelEyebrow}
              >
                PROJECT COMPLIANCE
              </div>

              <h2
                style={styles.panelTitle}
              >
                IFTA Command Center
              </h2>

              <p
                style={styles.panelSubtitle}
              >
                Review the actual records
                available in your Supabase
                database without assuming
                fixed column names.
              </p>
            </div>

            <div style={styles.tabs}>
              <button
                type="button"
                onClick={() => {
                  setSection("fuel");
                  setSearch("");
                }}
                style={{
                  ...styles.tab,
                  ...(section === "fuel"
                    ? styles.tabActive
                    : {}),
                }}
              >
                Fuel Transactions

                <span
                  style={styles.tabCount}
                >
                  {fuelRows.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSection("ifta");
                  setSearch("");
                }}
                style={{
                  ...styles.tab,
                  ...(section === "ifta"
                    ? styles.tabActive
                    : {}),
                }}
              >
                IFTA Records

                <span
                  style={styles.tabCount}
                >
                  {iftaRows.length}
                </span>
              </button>
            </div>
          </div>

          <div style={styles.toolbar}>
            <div style={styles.searchBox}>
              <span
                style={styles.searchIcon}
              >
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  section === "fuel"
                    ? "Search fuel records..."
                    : "Search IFTA records..."
                }
                style={styles.searchInput}
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  style={styles.clearButton}
                >
                  ×
                </button>
              )}
            </div>

            <div
              style={styles.resultCount}
            >
              {section === "fuel"
                ? `${filteredFuel.length} records`
                : `${filteredIfta.length} records`}
            </div>
          </div>

          {section === "fuel" ? (
            <FuelTable
              rows={filteredFuel}
              loading={loading}
            />
          ) : (
            <IftaTable
              rows={filteredIfta}
              loading={loading}
            />
          )}
        </section>

        <section style={styles.infoGrid}>
          <InfoCard
            icon="⛽"
            title="Fuel Tracking"
            text="Fuel purchases are read directly from the existing fuel_transactions table."
            tag="FUEL DATA"
          />

          <InfoCard
            icon="▣"
            title="IFTA Records"
            text="The page reads the actual columns returned by your IFTA table instead of assuming a fixed schema."
            tag="COMPLIANCE"
          />

          <InfoCard
            icon="✦"
            title="AI IFTA Layer"
            text="Project AI can later detect missing fuel, unusual mileage and reporting anomalies while the human remains in control."
            tag="PROJECT AI"
          />
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  valueColor = "#0f172a",
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  valueColor?: string;
}) {
  return (
    <div style={styles.card}>
      <div style={styles.statTop}>
        <div style={styles.statLabel}>
          {label}
        </div>

        <div style={styles.statIcon}>
          {icon}
        </div>
      </div>

      <div
        style={{
          ...styles.statValue,
          color: valueColor,
        }}
      >
        {value}
      </div>

      <div style={styles.statDetail}>
        {detail}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>
        {label}
      </div>

      <div style={styles.metricValue}>
        {value}
      </div>
    </div>
  );
}

function FuelTable({
  rows,
  loading,
}: {
  rows: Row[];
  loading: boolean;
}) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>
              Date
            </th>

            <th style={styles.th}>
              Vendor
            </th>

            <th style={styles.th}>
              Location
            </th>

            <th style={styles.th}>
              Gallons
            </th>

            <th style={styles.th}>
              Amount
            </th>

            <th style={styles.th}>
              Fuel Type
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow
              colSpan={6}
              text="Loading fuel transactions..."
            />
          ) : rows.length === 0 ? (
            <EmptyRow
              colSpan={6}
              text="No fuel transactions found."
            />
          ) : (
            rows.map((row, index) => {
              const gallons = num(row, [
                "gallons",
                "fuel_gallons",
                "total_gallons",
              ]);

              const amount = num(row, [
                "total_amount",
                "amount",
                "fuel_cost",
                "total_cost",
              ]);

              const date = text(row, [
                "transaction_date",
                "fuel_date",
                "date",
                "created_at",
              ]);

              const vendor = text(row, [
                "vendor",
                "fuel_vendor",
                "merchant",
                "location_name",
              ]);

              const city = text(row, [
                "city",
                "fuel_city",
              ]);

              const state = text(row, [
                "state",
                "fuel_state",
              ]);

              const fuelType = text(row, [
                "fuel_type",
                "type",
              ]);

              const rowId = text(row, [
                "id",
              ]);

              return (
                <tr
                  key={
                    `${rowId || "fuel"}-${index}`
                  }
                  style={styles.tr}
                >
                  <td style={styles.td}>
                    {formatDate(date)}
                  </td>

                  <td style={styles.td}>
                    <div
                      style={
                        styles.primaryText
                      }
                    >
                      {vendor || "—"}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.secondaryText
                      }
                    >
                      {[
                        city,
                        state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.amountText
                      }
                    >
                      {formatNumber(
                        gallons,
                        2
                      )}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.amountText
                      }
                    >
                      {money(amount)}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={styles.badge}
                    >
                      {fuelType || "Fuel"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function IftaTable({
  rows,
  loading,
}: {
  rows: Row[];
  loading: boolean;
}) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>
              Jurisdiction
            </th>

            <th style={styles.th}>
              Reporting Period
            </th>

            <th style={styles.th}>
              Miles
            </th>

            <th style={styles.th}>
              Gallons
            </th>

            <th style={styles.th}>
              Taxable Gallons
            </th>

            <th style={styles.th}>
              Tax Rate
            </th>

            <th style={styles.th}>
              Tax Due
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow
              colSpan={7}
              text="Loading IFTA records..."
            />
          ) : rows.length === 0 ? (
            <EmptyRow
              colSpan={7}
              text="No IFTA records found."
            />
          ) : (
            rows.map((row, index) => {
              const jurisdiction = text(
                row,
                [
                  "jurisdiction",
                  "state",
                  "state_code",
                  "jurisdiction_code",
                  "location",
                ]
              );

              const period = text(row, [
                "reporting_period",
                "period",
                "report_period",
                "quarter",
              ]);

              const miles = num(row, [
                "miles",
                "total_miles",
                "jurisdiction_miles",
                "mileage",
              ]);

              const gallons = num(row, [
                "gallons",
                "fuel_gallons",
                "total_gallons",
              ]);

              const taxableGallons = num(
                row,
                [
                  "taxable_gallons",
                  "taxable_fuel_gallons",
                ]
              );

              const rate = num(row, [
                "tax_rate",
                "rate",
              ]);

              const taxDue = num(row, [
                "tax_due",
                "tax_amount",
                "amount_due",
                "tax",
              ]);

              const rowId = text(row, [
                "id",
              ]);

              return (
                <tr
                  key={
                    `${rowId || "ifta"}-${index}`
                  }
                  style={styles.tr}
                >
                  <td style={styles.td}>
                    <span
                      style={
                        styles.primaryText
                      }
                    >
                      {jurisdiction || "—"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.secondaryText
                      }
                    >
                      {period || "—"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.amountText
                      }
                    >
                      {formatNumber(
                        miles,
                        0
                      )}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.amountText
                      }
                    >
                      {formatNumber(
                        gallons,
                        2
                      )}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.amountText
                      }
                    >
                      {formatNumber(
                        taxableGallons,
                        2
                      )}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        styles.secondaryText
                      }
                    >
                      {money(rate)}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.taxBadge,
                        ...(taxDue > 0
                          ? styles.taxDue
                          : styles.taxClear),
                      }}
                    >
                      {money(taxDue)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRow({
  colSpan,
  text,
}: {
  colSpan: number;
  text: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={styles.emptyCell}
      >
        <div style={styles.emptyIcon}>
          ◌
        </div>

        <div style={styles.emptyTitle}>
          {text}
        </div>
      </td>
    </tr>
  );
}

function InfoCard({
  icon,
  title,
  text,
  tag,
}: {
  icon: string;
  title: string;
  text: string;
  tag: string;
}) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoTop}>
        <div style={styles.infoIcon}>
          {icon}
        </div>

        <span style={styles.infoTag}>
          {tag}
        </span>
      </div>

      <h3 style={styles.infoTitle}>
        {title}
      </h3>

      <p style={styles.infoText}>
        {text}
      </p>
    </div>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "32px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "24px",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: 850,
    color: "#64748b",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.05,
    fontWeight: 850,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "9px 0 0",
    maxWidth: "760px",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#64748b",
  },

  refreshButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "10px",
    padding: "11px 15px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  refreshIcon: {
    fontSize: "17px",
  },

  errorBanner: {
    marginBottom: "18px",
    padding: "14px 16px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    borderRadius: "12px",
  },

  errorTitle: {
    fontSize: "12px",
    fontWeight: 850,
    color: "#991b1b",
  },

  errorText: {
    marginTop: "4px",
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#b91c1c",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "14px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
    boxShadow:
      "0 4px 18px rgba(15,23,42,.04)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statLabel: {
    fontSize: "10px",
    fontWeight: 850,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  statIcon: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#f1f5f9",
    fontSize: "15px",
  },

  statValue: {
    marginTop: "13px",
    fontSize: "24px",
    lineHeight: 1.1,
    fontWeight: 850,
    letterSpacing: "-0.03em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statDetail: {
    marginTop: "6px",
    fontSize: "11px",
    color: "#94a3b8",
  },

  secondaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "24px",
  },

  metric: {
    padding: "14px 17px",
    borderRight:
      "1px solid #eef2f7",
  },

  metricLabel: {
    fontSize: "9px",
    fontWeight: 850,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },

  metricValue: {
    marginTop: "5px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow:
      "0 4px 18px rgba(15,23,42,.04)",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    flexWrap: "wrap",
    borderBottom:
      "1px solid #e2e8f0",
  },

  panelEyebrow: {
    fontSize: "10px",
    fontWeight: 850,
    color: "#2563eb",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "6px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 850,
    letterSpacing: "-0.02em",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    maxWidth: "700px",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  tabs: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "#f1f5f9",
    borderRadius: "10px",
  },

  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    borderRadius: "7px",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  tabActive: {
    background: "#ffffff",
    color: "#0f172a",
    boxShadow:
      "0 1px 4px rgba(15,23,42,.08)",
  },

  tabCount: {
    minWidth: "19px",
    height: "19px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "9px",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "15px 22px",
    borderBottom:
      "1px solid #e2e8f0",
  },

  searchBox: {
    position: "relative",
    flex: 1,
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "17px",
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#0f172a",
    padding:
      "10px 36px 10px 34px",
    fontSize: "12px",
    outline: "none",
  },

  clearButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "24px",
    height: "24px",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
  },

  resultCount: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },

  tableWrap: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "900px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "12px 16px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: 850,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    textAlign: "left",
    borderBottom:
      "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  tr: {
    borderBottom:
      "1px solid #f1f5f9",
  },

  td: {
    padding: "14px 16px",
    verticalAlign: "middle",
  },

  primaryText: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#0f172a",
  },

  secondaryText: {
    fontSize: "11px",
    color: "#475569",
  },

  amountText: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "5px 8px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "9px",
    fontWeight: 850,
  },

  taxBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "10px",
    fontWeight: 850,
  },

  taxDue: {
    background: "#fee2e2",
    color: "#b91c1c",
  },

  taxClear: {
    background: "#dcfce7",
    color: "#166534",
  },

  emptyCell: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#64748b",
  },

  emptyIcon: {
    marginBottom: "8px",
    fontSize: "28px",
    color: "#94a3b8",
  },

  emptyTitle: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "19px",
    boxShadow:
      "0 4px 18px rgba(15,23,42,.04)",
  },

  infoTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoIcon: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#f1f5f9",
    fontSize: "16px",
  },

  infoTag: {
    fontSize: "8px",
    fontWeight: 850,
    letterSpacing: "0.08em",
    color: "#94a3b8",
  },

  infoTitle: {
    margin: "14px 0 0",
    fontSize: "13px",
    fontWeight: 850,
  },

  infoText: {
    margin: "7px 0 0",
    fontSize: "11px",
    lineHeight: 1.6,
    color: "#64748b",
  },
};