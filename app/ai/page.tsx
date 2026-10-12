"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageProvider";

const recommendations = [
  {
    priority: "HIGH",
    titleEN: "Assign PL-1003 to Driver DRV-003",
    titleES: "Asignar PL-1003 al conductor DRV-003",
    reasonEN:
      "Driver is positioned 18 miles from pickup, has sufficient HOS and the truck matches the required equipment.",
    reasonES:
      "El conductor está a 18 millas del pickup, tiene HOS suficiente y el camión cumple con el equipo requerido.",
    impactEN: "+$286 estimated profit",
    impactES: "+$286 de ganancia estimada",
    categoryEN: "Dispatch",
    categoryES: "Despacho",
  },
  {
    priority: "HIGH",
    titleEN: "Review load LOAD-78142",
    titleES: "Revisar carga LOAD-78142",
    reasonEN:
      "Current offer is $5.21/mile and is significantly above the average rate for this lane.",
    reasonES:
      "La oferta actual es de $5.21/milla y está significativamente por encima de la tarifa promedio de esta ruta.",
    impactEN: "+$420 potential margin",
    impactES: "+$420 de margen potencial",
    categoryEN: "Loads",
    categoryES: "Cargas",
  },
  {
    priority: "MEDIUM",
    titleEN: "Schedule maintenance for TRK-104",
    titleES: "Programar mantenimiento para TRK-104",
    reasonEN:
      "Mileage and maintenance history indicate that preventive service is approaching.",
    reasonES:
      "El kilometraje y el historial de mantenimiento indican que se aproxima un servicio preventivo.",
    impactEN: "Reduce downtime risk",
    impactES: "Reduce el riesgo de tiempo fuera de servicio",
    categoryEN: "Fleet",
    categoryES: "Flota",
  },
  {
    priority: "MEDIUM",
    titleEN: "Resolve invoice document issue",
    titleES: "Resolver problema de documentos de factura",
    reasonEN:
      "Missing POD information could delay factoring approval.",
    reasonES:
      "La información faltante del POD podría retrasar la aprobación del factoring.",
    impactEN: "$1,425 funding at risk",
    impactES: "$1,425 de financiamiento en riesgo",
    categoryEN: "Factoring",
    categoryES: "Factoring",
  },
];

const modes = [
  {
    en: "Operations",
    es: "Operaciones",
  },
  {
    en: "Loads",
    es: "Cargas",
  },
  {
    en: "Fleet",
    es: "Flota",
  },
  {
    en: "Finance",
    es: "Finanzas",
  },
  {
    en: "Compliance",
    es: "Cumplimiento",
  },
];

export default function AICopilotPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

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

  const currentMode = modes.find((item) => item.en === mode);

  const modeLabel = isES
    ? currentMode?.es ?? mode
    : currentMode?.en ?? mode;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              {isES ? "INTELIGENCIA ARTIFICIAL" : "PROJECT AI"}
            </div>

            <h1 style={styles.title}>
              {isES ? "Copiloto de IA" : "AI Copilot"}
            </h1>

            <p style={styles.subtitle}>
              {isES
                ? "Recomendaciones inteligentes para despacho, flota, cumplimiento, finanzas, cargas y factoring."
                : "Intelligent recommendations across dispatch, fleet, compliance, finance, loads and factoring."}
            </p>
          </div>

          <div style={styles.aiOnline}>
            <span style={styles.onlineDot} />
            {isES ? "MOTOR DE IA ACTIVO" : "AI ENGINE ONLINE"}
          </div>
        </header>

        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroIcon}>✦</div>

          <div style={{ flex: 1 }}>
            <div style={styles.heroLabel}>
              {isES
                ? "MOTOR DE INTELIGENCIA DE PROJECT LOGISTICS"
                : "PROJECT LOGISTICS INTELLIGENCE ENGINE"}
            </div>

            <h2 style={styles.heroTitle}>
              {isES
                ? "La IA analiza. El humano decide."
                : "AI analyzes. Human decides."}
            </h2>

            <p style={styles.heroText}>
              {isES
                ? "Project AI analiza continuamente los datos operativos y recomienda acciones diseñadas para mejorar ingresos, reducir millas vacías, proteger el cumplimiento y aumentar la rentabilidad de la flota."
                : "Project AI continuously analyzes your operational data and recommends actions designed to improve revenue, reduce deadhead, protect compliance and increase fleet profitability."}
            </p>

            <div style={styles.aiFlow}>
              <div>{isES ? "1. La IA analiza" : "1. AI analyzes"}</div>
              <span>→</span>
              <div>{isES ? "2. La IA recomienda" : "2. AI recommends"}</div>
              <span>→</span>
              <div>{isES ? "3. Humano revisa" : "3. Human reviews"}</div>
              <span>→</span>
              <div>{isES ? "4. Humano decide" : "4. Human decides"}</div>
              <span>→</span>
              <div>{isES ? "5. Sistema ejecuta" : "5. System executes"}</div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              {isES ? "RECOMENDACIONES DE IA" : "AI RECOMMENDATIONS"}
            </div>

            <div style={styles.statValue}>36</div>

            <div style={styles.statChange}>
              {isES ? "12 de alta prioridad" : "12 high-priority"}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              {isES ? "GANANCIA POTENCIAL" : "POTENTIAL PROFIT"}
            </div>

            <div style={styles.statValue}>+$4,820</div>

            <div style={styles.statChange}>
              {isES
                ? "Oportunidades identificadas"
                : "Identified opportunities"}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              {isES ? "AUTOMATIZACIÓN LISTA" : "AUTOMATION READY"}
            </div>

            <div style={styles.statValue}>18</div>

            <div style={styles.statChangeNeutral}>
              {isES
                ? "Esperando aprobación humana"
                : "Awaiting human approval"}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              {isES ? "DECISIONES REGISTRADAS" : "DECISIONS LOGGED"}
            </div>

            <div style={styles.statValue}>247</div>

            <div style={styles.statChange}>
              {isES ? "Auditoría completa" : "Full audit trail"}
            </div>
          </div>
        </div>

        {/* COMMAND CENTER */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {isES ? "Centro de Comando de IA" : "AI Command Center"}
              </h2>

              <p style={styles.cardSubtitle}>
                {isES
                  ? "Selecciona un área de inteligencia para un análisis enfocado."
                  : "Select an intelligence area for focused analysis."}
              </p>
            </div>

            <div style={styles.modeSelector}>
              {modes.map((item) => (
                <button
                  key={item.en}
                  onClick={() => setMode(item.en)}
                  style={
                    mode === item.en
                      ? styles.modeActive
                      : styles.modeButton
                  }
                >
                  {isES ? item.es : item.en}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.analysisBox}>
            <div style={styles.analysisIcon}>✦</div>

            <div>
              <div style={styles.analysisLabel}>
                {isES
                  ? `ANÁLISIS ACTUAL — ${modeLabel.toUpperCase()}`
                  : `CURRENT ANALYSIS — ${mode.toUpperCase()}`}
              </div>

              <h3 style={styles.analysisTitle}>
                {isES
                  ? `Project AI está analizando tus datos de ${modeLabel.toLowerCase()}.`
                  : `Project AI is analyzing your ${mode.toLowerCase()} data.`}
              </h3>

              <p style={styles.analysisText}>
                {isES
                  ? "El motor de inteligencia evalúa ubicación actual, disponibilidad, rendimiento histórico, costos, cumplimiento, tiempos y rentabilidad antes de generar recomendaciones."
                  : "The intelligence engine evaluates current location, availability, historical performance, costs, compliance, timing and profitability before generating recommendations."}
              </p>
            </div>
          </div>
        </section>

        {/* RECOMMENDATIONS */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {isES
                  ? "Recomendaciones Prioritarias"
                  : "Priority Recommendations"}
              </h2>

              <p style={styles.cardSubtitle}>
                {isES
                  ? "Acciones actualmente recomendadas por Project AI."
                  : "Actions currently recommended by Project AI."}
              </p>
            </div>

            <span style={styles.recommendationCount}>
              {recommendations.length}{" "}
              {isES ? "ACTIVAS" : "ACTIVE"}
            </span>
          </div>

          <div style={styles.recommendationList}>
            {recommendations.map((item) => {
              const title = isES ? item.titleES : item.titleEN;
              const reason = isES ? item.reasonES : item.reasonEN;
              const impact = isES ? item.impactES : item.impactEN;
              const category = isES
                ? item.categoryES
                : item.categoryEN;

              const isApproved = approved.includes(item.titleEN);
              const isDeclined = declined.includes(item.titleEN);

              return (
                <div
                  key={item.titleEN}
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
                    {item.priority === "HIGH"
                      ? isES
                        ? "ALTA"
                        : "HIGH"
                      : isES
                      ? "MEDIA"
                      : "MEDIUM"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={styles.category}>{category}</div>

                    <h3 style={styles.recommendationTitle}>
                      {title}
                    </h3>

                    <p style={styles.reason}>{reason}</p>

                    <div style={styles.impact}>{impact}</div>
                  </div>

                  <div>
                    {isApproved ? (
                      <span style={styles.approvedBadge}>
                        ✓ {isES ? "Aprobada" : "Approved"}
                      </span>
                    ) : isDeclined ? (
                      <span style={styles.declinedBadge}>
                        × {isES ? "Rechazada" : "Declined"}
                      </span>
                    ) : (
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.approveButton}
                          onClick={() =>
                            approveRecommendation(item.titleEN)
                          }
                        >
                          {isES ? "Aprobar" : "Approve"}
                        </button>

                        <button
                          style={styles.declineButton}
                          onClick={() =>
                            declineRecommendation(item.titleEN)
                          }
                        >
                          {isES ? "Rechazar" : "Decline"}
                        </button>

                        <button style={styles.reviewButton}>
                          {isES ? "Revisar" : "Review"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DATA + GUARDRAILS */}
        <div style={styles.twoColumn}>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  {isES ? "Fuentes de Datos" : "Data Sources"}
                </h2>

                <p style={styles.cardSubtitle}>
                  {isES
                    ? "Información utilizada por el motor de IA."
                    : "Information used by the AI engine."}
                </p>
              </div>
            </div>

            <div style={styles.sourceGrid}>
              {[
                isES ? "GPS / Ubicación" : "GPS / Location",
                isES ? "HOS / ELD" : "HOS / ELD",
                isES ? "Datos de Cargas" : "Load Data",
                isES ? "Datos de Flota" : "Fleet Data",
                isES ? "Datos de Combustible" : "Fuel Data",
                isES ? "Finanzas" : "Finance",
                "Factoring",
                isES ? "Datos de Brokers" : "Broker Data",
              ].map((source) => (
                <div key={source} style={styles.source}>
                  <span>{source}</span>
                  <strong>
                    {isES ? "Conectado" : "Connected"}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  {isES ? "Controles de IA" : "AI Guardrails"}
                </h2>

                <p style={styles.cardSubtitle}>
                  {isES
                    ? "El control humano permanece activo."
                    : "Human control remains active."}
                </p>
              </div>
            </div>

            <div style={styles.guardrailList}>
              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>
                    {isES ? "Aprobación humana" : "Human approval"}
                  </strong>

                  <p>
                    {isES
                      ? "Las acciones operativas y financieras críticas requieren confirmación humana."
                      : "Critical operational and financial actions require human confirmation."}
                  </p>
                </div>
              </div>

              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>
                    {isES
                      ? "Recomendaciones explicables"
                      : "Explainable recommendations"}
                  </strong>

                  <p>
                    {isES
                      ? "La IA muestra los datos y el razonamiento detrás de las recomendaciones importantes."
                      : "AI shows the data and reasoning behind important recommendations."}
                  </p>
                </div>
              </div>

              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>
                    {isES ? "Historial de auditoría" : "Audit history"}
                  </strong>

                  <p>
                    {isES
                      ? "Las recomendaciones de IA y las decisiones humanas quedan registradas."
                      : "AI recommendations and human decisions are recorded."}
                  </p>
                </div>
              </div>

              <div style={styles.guardrail}>
                <span style={styles.guardrailIcon}>✓</span>

                <div>
                  <strong>
                    {isES
                      ? "Controles de permisos"
                      : "Permission controls"}
                  </strong>

                  <p>
                    {isES
                      ? "Los usuarios solo reciben acciones de IA permitidas por su rol."
                      : "Users only receive AI actions allowed by their role."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* HISTORY */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {isES
                  ? "Historial de Decisiones de IA"
                  : "AI Decision History"}
              </h2>

              <p style={styles.cardSubtitle}>
                {isES
                  ? "Recomendaciones recientes y decisiones humanas."
                  : "Recent recommendations and human decisions."}
              </p>
            </div>
          </div>

          <div style={styles.historyTable}>
            <div style={styles.historyHeader}>
              <span>{isES ? "HORA" : "TIME"}</span>
              <span>
                {isES ? "RECOMENDACIÓN DE IA" : "AI RECOMMENDATION"}
              </span>
              <span>{isES ? "ACCIÓN" : "USER ACTION"}</span>
              <span>{isES ? "RESULTADO" : "RESULT"}</span>
            </div>

            <div style={styles.historyRow}>
              <span>09:42 AM</span>
              <strong>
                {isES
                  ? "Priorizar LOAD-78142"
                  : "Prioritize LOAD-78142"}
              </strong>
              <span>{isES ? "Aprobada" : "Approved"}</span>
              <span style={styles.successText}>
                {isES ? "Carga revisada" : "Load reviewed"}
              </span>
            </div>

            <div style={styles.historyRow}>
              <span>09:18 AM</span>
              <strong>
                {isES
                  ? "Programar servicio TRK-104"
                  : "Schedule TRK-104 service"}
              </strong>
              <span>{isES ? "Aprobada" : "Approved"}</span>
              <span style={styles.successText}>
                {isES
                  ? "Mantenimiento creado"
                  : "Maintenance created"}
              </span>
            </div>

            <div style={styles.historyRow}>
              <span>08:56 AM</span>
              <strong>
                {isES
                  ? "Asignar conductor a PL-1003"
                  : "Assign driver to PL-1003"}
              </strong>
              <span>{isES ? "Modificada" : "Modified"}</span>
              <span style={styles.infoText}>
                {isES
                  ? "Humano cambió conductor"
                  : "Human changed driver"}
              </span>
            </div>

            <div style={styles.historyRow}>
              <span>08:31 AM</span>
              <strong>
                {isES
                  ? "Enviar factura INV-2026-003"
                  : "Submit invoice INV-2026-003"}
              </strong>
              <span>{isES ? "Aprobada" : "Approved"}</span>
              <span style={styles.successText}>
                {isES
                  ? "Enviada al factor"
                  : "Submitted to factor"}
              </span>
            </div>
          </div>
        </section>

        {/* FINAL PRINCIPLE */}
        <section style={styles.finalCard}>
          <div style={styles.finalIcon}>✦</div>

          <div>
            <div style={styles.finalLabel}>
              {isES
                ? "PRINCIPIO DE PROJECT LOGISTICS"
                : "PROJECT LOGISTICS PRINCIPLE"}
            </div>

            <h2 style={styles.finalTitle}>
              {isES
                ? "La IA recomienda. El humano decide."
                : "AI recommends. Human decides."}
            </h2>

            <p style={styles.finalText}>
              {isES
                ? "Project AI está diseñado para hacer más inteligente la operación de transporte sin eliminar al propietario o administrador del proceso de toma de decisiones."
                : "Project AI is designed to make the trucking operation smarter without removing the owner or administrator from the decision-making process."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "28px 30px 50px",
    boxSizing: "border-box",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: 1700,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#2563eb",
    marginBottom: 6,
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: 14,
    maxWidth: 850,
    lineHeight: 1.5,
  },

  aiOnline: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#ecfdf3",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 10,
    fontWeight: 800,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
  },

  hero: {
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: 14,
    padding: 26,
    display: "flex",
    gap: 19,
    alignItems: "flex-start",
    marginBottom: 20,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    fontWeight: 800,
    flexShrink: 0,
  },

  heroLabel: {
    color: "#93c5fd",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "1px",
  },

  heroTitle: {
    margin: "7px 0",
    fontSize: 24,
    letterSpacing: "-0.5px",
  },

  heroText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.6,
    maxWidth: 900,
    margin: 0,
  },

  aiFlow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 18,
    fontSize: 10,
    color: "#d5dce7",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 15,
    marginBottom: 20,
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 2px 8px rgba(16,24,40,0.03)",
  },

  statLabel: {
    fontSize: 10,
    color: "#78859a",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  statValue: {
    fontSize: 25,
    fontWeight: 800,
    marginTop: 8,
  },

  statChange: {
    color: "#16a34a",
    fontSize: 11,
    marginTop: 6,
    fontWeight: 600,
  },

  statChangeNeutral: {
    color: "#7a879a",
    fontSize: 11,
    marginTop: 6,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 2px 8px rgba(16,24,40,0.03)",
    marginBottom: 20,
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 18,
  },

  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#7b8798",
    fontSize: 12,
  },

  modeSelector: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
  },

  modeButton: {
    border: "1px solid #dce2ea",
    background: "#ffffff",
    color: "#687589",
    borderRadius: 6,
    padding: "7px 9px",
    fontSize: 10,
    cursor: "pointer",
  },

  modeActive: {
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 6,
    padding: "7px 9px",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  analysisBox: {
    background: "#f8fafc",
    border: "1px solid #e7edf4",
    borderRadius: 10,
    padding: 18,
    display: "flex",
    gap: 13,
  },

  analysisIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0,
  },

  analysisLabel: {
    fontSize: 9,
    color: "#2563eb",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  analysisTitle: {
    margin: "6px 0",
    fontSize: 15,
  },

  analysisText: {
    margin: 0,
    color: "#718096",
    fontSize: 11,
    lineHeight: 1.6,
  },

  recommendationCount: {
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 9,
    fontWeight: 800,
  },

  recommendationList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  recommendationCard: {
    border: "1px solid #e4e9f0",
    borderRadius: 10,
    padding: 15,
    display: "flex",
    alignItems: "flex-start",
    gap: 13,
    background: "#ffffff",
  },

  recommendationApproved: {
    background: "#f7fdf9",
    border: "1px solid #bbf7d0",
  },

  recommendationDeclined: {
    background: "#fff7f7",
    border: "1px solid #fecaca",
  },

  priorityHigh: {
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 9,
    fontWeight: 800,
  },

  priorityMedium: {
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 9,
    fontWeight: 800,
  },

  category: {
    color: "#2563eb",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  recommendationTitle: {
    fontSize: 14,
    margin: "4px 0",
  },

  reason: {
    color: "#718096",
    fontSize: 11,
    lineHeight: 1.5,
    margin: 0,
    maxWidth: 720,
  },

  impact: {
    display: "inline-block",
    marginTop: 8,
    background: "#ecfdf3",
    color: "#15803d",
    borderRadius: 5,
    padding: "5px 7px",
    fontSize: 9,
    fontWeight: 700,
  },

  actionButtons: {
    display: "flex",
    gap: 6,
  },

  approveButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  declineButton: {
    background: "#ffffff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  reviewButton: {
    background: "#ffffff",
    color: "#344054",
    border: "1px solid #d9e0ea",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  approvedBadge: {
    background: "#ecfdf3",
    color: "#15803d",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 700,
  },

  declinedBadge: {
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 700,
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  sourceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 9,
  },

  source: {
    background: "#f8fafc",
    border: "1px solid #edf1f5",
    borderRadius: 8,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    color: "#596579",
  },

  guardrailList: {
    display: "flex",
    flexDirection: "column",
    gap: 13,
  },

  guardrail: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },

  guardrailIcon: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#ecfdf3",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 800,
    flexShrink: 0,
  },

  historyTable: {
    width: "100%",
    overflowX: "auto",
  },

  historyHeader: {
    display: "grid",
    gridTemplateColumns: "100px 1.7fr 130px 1fr",
    gap: 12,
    padding: "10px 8px",
    color: "#7a879a",
    fontSize: 9,
    fontWeight: 800,
    borderBottom: "1px solid #e7ebf0",
    minWidth: 700,
  },

  historyRow: {
    display: "grid",
    gridTemplateColumns: "100px 1.7fr 130px 1fr",
    gap: 12,
    padding: "13px 8px",
    color: "#667085",
    fontSize: 11,
    borderBottom: "1px solid #eef1f5",
    alignItems: "center",
    minWidth: 700,
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
    borderRadius: 14,
    padding: 22,
    display: "flex",
    gap: 15,
    alignItems: "flex-start",
  },

  finalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "1px",
  },

  finalTitle: {
    margin: "6px 0",
    fontSize: 19,
  },

  finalText: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 850,
  },
};