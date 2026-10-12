"use client";

import { useState } from "react";

const recommendations = [
  {
    priority: "HIGH",
    title: "Assign PL-1003 to Driver DRV-003",
    reason:
      "Driver is positioned 18 miles from pickup, has sufficient HOS and the truck matches the required equipment.",
    impact: "+$286 estimated profit",
    category: "Dispatch",
  },
  {
    priority: "HIGH",
    title: "Review load LOAD-78142",
    reason:
      "Current offer is $5.21/mile and is significantly above the average rate for this lane.",
    impact: "+$420 potential margin",
    category: "Loads",
  },
  {
    priority: "MEDIUM",
    title: "Schedule maintenance for TRK-104",
    reason:
      "Mileage and maintenance history indicate that preventive service is approaching.",
    impact: "Reduce downtime risk",
    category: "Fleet",
  },
  {
    priority: "MEDIUM",
    title: "Resolve invoice document issue",
    reason:
      "Missing POD information could delay factoring approval.",
    impact: "$1,425 funding at risk",
    category: "Factoring",
  },
];

export default function AICopilotPage() {
  const [mode, setMode] = useState("Operations");
  const [approved, setApproved] = useState<string[]>([]);
  const [declined, setDeclined] = useState<string[]>([]);

  const approveRecommendation = (title: string) => {
    if (!approved.includes(title)) {
      setApproved([...approved, title]);
      setDeclined(declined.filter((item) => item !== title));
    }
  };

  const declineRecommendation = (title: string) => {
    if (!declined.includes(title)) {
      setDeclined([...declined, title]);
      setApproved(approved.filter((item) => item !== title));
    }
  };

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>PL</div>

          <div>
            <div style={styles.logoTitle}>Project Logistics</div>
            <div style={styles.logoSub}>Project Command</div>
          </div>
        </div>

        <div style={styles.navSection}>MAIN</div>

        <a href="/" style={styles.navItem}>
          <span>⌂</span>
          Command
        </a>

        <a href="/operations" style={styles.navItem}>
          <span>◉</span>
          Operations
        </a>

        <a href="/loads" style={styles.navItem}>
          <span>▣</span>
          Loads
        </a>

        <a href="/drivers" style={styles.navItem}>
          <span>♙</span>
          Drivers
        </a>

        <a href="/fleet" style={styles.navItem}>
          <span>▤</span>
          Fleet
        </a>

        <a href="/compliance" style={styles.navItem}>
          <span>✓</span>
          Compliance
        </a>

        <a href="/ifta" style={styles.navItem}>
          <span>▥</span>
          IFTA
        </a>

        <a href="/finance" style={styles.navItem}>
          <span>$</span>
          Finance
        </a>

        <a href="/factoring" style={styles.navItem}>
          <span>◫</span>
          Factoring
        </a>

        <a href="/broker-hub" style={styles.navItem}>
          <span>⌘</span>
          Broker Hub
        </a>

        <a
          href="/ai-copilot"
          style={{ ...styles.navItem, ...styles.navActive }}
        >
          <span>✦</span>
          AI Copilot
        </a>

        <div style={styles.navSection}>SYSTEM</div>

        <a href="#" style={styles.navItem}>
          <span>⚙</span>
          Settings
        </a>

        <div style={styles.sidebarBottom}>
          <div style={styles.aiStatus}>
            <div style={styles.statusDot}></div>
            AI Systems Online
          </div>

          <div style={styles.version}>Project Logistics v0.1</div>
        </div>
      </aside>

      <section style={styles.content}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>PROJECT AI</div>

            <h1 style={styles.title}>AI Copilot</h1>

            <p style={styles.subtitle}>
              Intelligent recommendations across dispatch, fleet,
              compliance, finance, loads and factoring.
            </p>
          </div>

          <div style={styles.aiOnline}>
            <span style={styles.onlineDot}></span>
            AI ENGINE ONLINE
          </div>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>✦</div>

          <div style={{ flex: 1 }}>
            <div style={styles.heroLabel}>
              PROJECT LOGISTICS INTELLIGENCE ENGINE
            </div>

            <h2 style={styles.heroTitle}>
              AI analyzes. Human decides.
            </h2>

            <p style={styles.heroText}>
              Project AI continuously analyzes your operational data and
              recommends actions designed to improve revenue, reduce
              deadhead, protect compliance and increase fleet
              profitability.
            </p>

            <div style={styles.aiFlow}>
              <div>1. AI analyzes</div>
              <span>→</span>
              <div>2. AI recommends</div>
              <span>→</span>
              <div>3. Human reviews</div>
              <span>→</span>
              <div>4. Human decides</div>
              <span>→</span>
              <div>5. System executes</div>
            </div>
          </div>
        </section>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>AI RECOMMENDATIONS</div>
            <div style={styles.statValue}>36</div>
            <div style={styles.statChange}>
              12 high-priority
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>POTENTIAL PROFIT</div>
            <div style={styles.statValue}>+$4,820</div>
            <div style={styles.statChange}>
              Identified opportunities
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>AUTOMATION READY</div>
            <div style={styles.statValue}>18</div>
            <div style={styles.statChangeNeutral}>
              Awaiting human approval
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>DECISIONS LOGGED</div>
            <div style={styles.statValue}>247</div>
            <div style={styles.statChange}>
              Full audit trail
            </div>
          </div>
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>AI Command Center</h2>

              <p style={styles.cardSubtitle}>
                Select an intelligence area for focused analysis.
              </p>
            </div>

            <div style={styles.modeSelector}>
              {[
                "Operations",
                "Loads",
                "Fleet",
                "Finance",
                "Compliance",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  style={
                    mode === item
                      ? styles.modeActive
                      : styles.modeButton
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.analysisBox}>
            <div style={styles.analysisIcon}>✦</div>

            <div>
              <div style={styles.analysisLabel}>
                CURRENT ANALYSIS — {mode.toUpperCase()}
              </div>

              <h3 style={styles.analysisTitle}>
                Project AI is analyzing your {mode.toLowerCase()} data.
              </h3>

              <p style={styles.analysisText}>
                The intelligence engine evaluates current location,
                availability, historical performance, costs, compliance,
                timing and profitability before generating recommendations.
              </p>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Priority Recommendations</h2>

              <p style={styles.cardSubtitle}>
                Actions currently recommended by Project AI.
              </p>
            </div>

            <span style={styles.recommendationCount}>
              {recommendations.length} ACTIVE
            </span>
          </div>

          <div style={styles.recommendationList}>
            {recommendations.map((item) => {
              const isApproved = approved.includes(item.title);
              const isDeclined = declined.includes(item.title);

              return (
                <div
                  key={item.title}
                  style={{
                    ...styles.recommendationCard,
                    ...(isApproved
                      ? styles.recommendationApproved
                      : isDeclined
                      ? styles.recommendationDeclined
                      : {}),
                  }}
                >
                  <div
                    style={
                      item.priority === "HIGH"
                        ? styles.priorityHigh
                        : styles.priorityMedium
                    }
                  >
                    {item.priority}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={styles.category}>
                      {item.category}
                    </div>

                    <h3 style={styles.recommendationTitle}>
                      {item.title}
                    </h3>

                    <p style={styles.reason}>{item.reason}</p>

                    <div style={styles.impact}>{item.impact}</div>
                  </div>

                  <div>
                    {isApproved ? (
                      <span style={styles.approvedBadge}>
                        ✓ Approved
                      </span>
                    ) : isDeclined ? (
                      <span style={styles.declinedBadge}>
                        × Declined
                      </span>
                    ) : (
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.approveButton}
                          onClick={() =>
                            approveRecommendation(item.title)
                          }
                        >
                          Approve
                        </button>

                        <button
                          style={styles.declineButton}
                          onClick={() =>
                            declineRecommendation(item.title)
                          }
                        >
                          Decline
                        </button>

                        <button style={styles.reviewButton}>
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div style={styles.twoColumn}>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  Data Sources
                </h2>

                <p style={styles.cardSubtitle}>
                  Information used by the AI engine.
                </p>
              </div>
            </div>

            <div style={styles.sourceGrid}>
              <div style={styles.source}>
                <span>GPS / Location</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>HOS / ELD</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>Load Data</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>Fleet Data</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>Fuel Data</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>Finance</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>Factoring</span>
                <strong>Connected</strong>
              </div>

              <div style={styles.source}>
                <span>Broker Data</span>
                <strong>Connected</strong>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  AI Guardrails
                </h2>

                <p style={styles.cardSubtitle}>
                  Human control remains active.
                </p>
              </div>
            </div>

            <div style={styles.guardrailList}>
              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>Human approval</strong>
                  <p>
                    Critical operational and financial actions require
                    human confirmation.
                  </p>
                </div>
              </div>

              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>Explainable recommendations</strong>
                  <p>
                    AI shows the data and reasoning behind important
                    recommendations.
                  </p>
                </div>
              </div>

              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>Audit history</strong>
                  <p>
                    AI recommendations and human decisions are recorded.
                  </p>
                </div>
              </div>

              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>Permission controls</strong>
                  <p>
                    Users only receive AI actions allowed by their role.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                AI Decision History
              </h2>

              <p style={styles.cardSubtitle}>
                Recent recommendations and human decisions.
              </p>
            </div>
          </div>

          <div style={styles.historyTable}>
            <div style={styles.historyHeader}>
              <span>TIME</span>
              <span>AI RECOMMENDATION</span>
              <span>USER ACTION</span>
              <span>RESULT</span>
            </div>

            <div style={styles.historyRow}>
              <span>09:42 AM</span>
              <strong>Prioritize LOAD-78142</strong>
              <span>Approved</span>
              <span style={styles.successText}>
                Load reviewed
              </span>
            </div>

            <div style={styles.historyRow}>
              <span>09:18 AM</span>
              <strong>Schedule TRK-104 service</strong>
              <span>Approved</span>
              <span style={styles.successText}>
                Maintenance created
              </span>
            </div>

            <div style={styles.historyRow}>
              <span>08:56 AM</span>
              <strong>Assign driver to PL-1003</strong>
              <span>Modified</span>
              <span style={styles.infoText}>
                Human changed driver
              </span>
            </div>

            <div style={styles.historyRow}>
              <span>08:31 AM</span>
              <strong>Submit invoice INV-2026-003</strong>
              <span>Approved</span>
              <span style={styles.successText}>
                Submitted to factor
              </span>
            </div>
          </div>
        </section>

        <section style={styles.finalCard}>
          <div style={styles.finalIcon}>✦</div>

          <div>
            <div style={styles.finalLabel}>
              PROJECT LOGISTICS PRINCIPLE
            </div>

            <h2 style={styles.finalTitle}>
              AI recommends. Human decides.
            </h2>

            <p style={styles.finalText}>
              Project AI is designed to make the trucking operation
              smarter without removing the owner or administrator from
              the decision-making process.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  sidebar: {
    width: "245px",
    background: "#101827",
    color: "#d7deea",
    padding: "22px 14px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "4px 10px 28px",
  },

  logo: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "14px",
  },

  logoTitle: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
  },

  logoSub: {
    color: "#8490a5",
    fontSize: "11px",
    marginTop: "2px",
  },

  navSection: {
    color: "#657188",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    padding: "13px 12px 8px",
  },

  navItem: {
    textDecoration: "none",
    color: "#aeb8c9",
    padding: "10px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    fontSize: "13px",
    marginBottom: "2px",
  },

  navActive: {
    background: "#1d4ed8",
    color: "#ffffff",
    fontWeight: 700,
  },

  sidebarBottom: {
    marginTop: "auto",
    padding: "14px 10px 2px",
    borderTop: "1px solid #263247",
  },

  aiStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    color: "#9eabc0",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  version: {
    fontSize: "10px",
    color: "#59657a",
    marginTop: "8px",
  },

  content: {
    marginLeft: "245px",
    padding: "34px 38px 60px",
    width: "calc(100% - 245px)",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    gap: "20px",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#2563eb",
    marginBottom: "6px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#718096",
    fontSize: "14px",
    maxWidth: "800px",
  },

  aiOnline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#ecfdf3",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "9px 11px",
    fontSize: "10px",
    fontWeight: 800,
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  hero: {
    background: "#111827",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "26px",
    display: "flex",
    gap: "19px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  heroIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: 800,
    flexShrink: 0,
  },

  heroLabel: {
    color: "#93c5fd",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  heroTitle: {
    margin: "7px 0",
    fontSize: "24px",
    letterSpacing: "-0.5px",
  },

  heroText: {
    color: "#aeb8c9",
    fontSize: "12px",
    lineHeight: 1.6,
    maxWidth: "900px",
    margin: 0,
  },

  aiFlow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "18px",
    fontSize: "10px",
    color: "#d5dce7",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(16,24,40,0.03)",
  },

  statLabel: {
    fontSize: "10px",
    color: "#78859a",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  statValue: {
    fontSize: "25px",
    fontWeight: 800,
    marginTop: "8px",
  },

  statChange: {
    color: "#16a34a",
    fontSize: "11px",
    marginTop: "6px",
    fontWeight: 600,
  },

  statChangeNeutral: {
    color: "#7a879a",
    fontSize: "11px",
    marginTop: "6px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(16,24,40,0.03)",
    marginBottom: "20px",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "18px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "16px",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#7b8798",
    fontSize: "12px",
  },

  modeSelector: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
  },

  modeButton: {
    border: "1px solid #dce2ea",
    background: "#ffffff",
    color: "#687589",
    borderRadius: "6px",
    padding: "7px 9px",
    fontSize: "10px",
    cursor: "pointer",
  },

  modeActive: {
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "7px 9px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  analysisBox: {
    background: "#f8fafc",
    border: "1px solid #e7edf4",
    borderRadius: "10px",
    padding: "18px",
    display: "flex",
    gap: "13px",
  },

  analysisIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0,
  },

  analysisLabel: {
    fontSize: "9px",
    color: "#2563eb",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  analysisTitle: {
    margin: "6px 0",
    fontSize: "15px",
  },

  analysisText: {
    margin: 0,
    color: "#718096",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  recommendationCount: {
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "9px",
    fontWeight: 800,
  },

  recommendationList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  recommendationCard: {
    border: "1px solid #e4e9f0",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    background: "#ffffff",
  },

  recommendationApproved: {
    background: "#f7fdf9",
    border: "1px solid #bbf7d0",
  },

  priorityHigh: {
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "9px",
    fontWeight: 800,
  },

  priorityMedium: {
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "9px",
    fontWeight: 800,
  },

  category: {
    color: "#2563eb",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  recommendationTitle: {
    fontSize: "14px",
    margin: "4px 0",
  },

  reason: {
    color: "#718096",
    fontSize: "11px",
    lineHeight: 1.5,
    margin: 0,
    maxWidth: "720px",
  },

  impact: {
    display: "inline-block",
    marginTop: "8px",
    background: "#ecfdf3",
    color: "#15803d",
    borderRadius: "5px",
    padding: "5px 7px",
    fontSize: "9px",
    fontWeight: 700,
  },

  actionButtons: {
    display: "flex",
    gap: "6px",
  },

  approveButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  reviewButton: {
    background: "#ffffff",
    color: "#344054",
    border: "1px solid #d9e0ea",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  declineButton: {
    background: "#ffffff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  approvedBadge: {
    background: "#ecfdf3",
    color: "#15803d",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "10px",
    fontWeight: 700,
  },

  recommendationDeclined: {
    background: "#fff7f7",
    border: "1px solid #fecaca",
  },

  declinedBadge: {
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "10px",
    fontWeight: 700,
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  sourceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
  },

  source: {
    background: "#f8fafc",
    border: "1px solid #edf1f5",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    fontSize: "10px",
    color: "#596579",
  },

  guardrailList: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },

  guardrail: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },

  guardrailIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#ecfdf3",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 800,
    flexShrink: 0,
  },

  historyTable: {
    width: "100%",
  },

  historyHeader: {
    display: "grid",
    gridTemplateColumns: "100px 1.7fr 130px 1fr",
    gap: "12px",
    padding: "10px 8px",
    color: "#7a879a",
    fontSize: "9px",
    fontWeight: 800,
    borderBottom: "1px solid #e7ebf0",
  },

  historyRow: {
    display: "grid",
    gridTemplateColumns: "100px 1.7fr 130px 1fr",
    gap: "12px",
    padding: "13px 8px",
    color: "#667085",
    fontSize: "11px",
    borderBottom: "1px solid #eef1f5",
    alignItems: "center",
  },

  successText: {
    color: "#15803d",
    fontWeight: 700,
  },

  infoText: {
    color: "#2563eb",
    fontWeight: 700,
  },

  finalCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "22px",
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
  },

  finalIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0,
  },

  finalLabel: {
    color: "#2563eb",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  finalTitle: {
    margin: "6px 0",
    fontSize: "19px",
  },

  finalText: {
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: "850px",
  },
};