"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageProvider";

export default function SettingsPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const [saved, setSaved] = useState(false);

  // Operations
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [automaticLoadRefresh, setAutomaticLoadRefresh] =
    useState(true);
  const [humanApproval, setHumanApproval] =
    useState(true);

  // AI
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiLoadRecommendations, setAiLoadRecommendations] =
    useState(true);
  const [aiComplianceRecommendations, setAiComplianceRecommendations] =
    useState(true);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);
  const [complianceAlerts, setComplianceAlerts] =
    useState(true);
  const [loadAlerts, setLoadAlerts] = useState(true);
  const [factoringAlerts, setFactoringAlerts] =
    useState(true);

  const text = {
    brand: isES
      ? "LOGÍSTICA DEL PROYECTO"
      : "PROJECT LOGISTICS",

    title: isES ? "Configuración" : "Settings",

    subtitle: isES
      ? "Configura tu sistema operativo de transporte."
      : "Configure your trucking operating system.",

    saveChanges: isES
      ? "Guardar cambios"
      : "Save Changes",

    saved: isES
      ? "✓ Configuración guardada correctamente."
      : "✓ Settings saved successfully.",

    general: isES ? "General" : "General",
    generalDescription: isES
      ? "Configuración de la empresa"
      : "Company settings",

    operations: isES
      ? "Operaciones"
      : "Operations",

    operationsDescription: isES
      ? "Preferencias de despacho"
      : "Dispatch preferences",

    ai: "AI",

    aiDescription: isES
      ? "Controles del copiloto"
      : "Copilot controls",

    notifications: isES
      ? "Notificaciones"
      : "Notifications",

    notificationsDescription: isES
      ? "Alertas y mensajes"
      : "Alerts and messages",

    security: isES
      ? "Seguridad"
      : "Security",

    securityDescription: isES
      ? "Acceso y auditoría"
      : "Access and audit",

    integrations: isES
      ? "Integraciones"
      : "Integrations",

    integrationsDescription: isES
      ? "Servicios conectados"
      : "Connected services",

    company: isES ? "Empresa" : "Company",

    companyDescription: isES
      ? "Configuración básica de la empresa Project Logistics."
      : "Basic Project Logistics company configuration.",

    companyName: isES
      ? "Nombre de la empresa"
      : "Company Name",

    operatingCountry: isES
      ? "País de operación"
      : "Operating Country",

    primaryTimeZone: isES
      ? "Zona horaria principal"
      : "Primary Time Zone",

    currency: isES ? "Moneda" : "Currency",

    operationsTitle: isES
      ? "Operaciones"
      : "Operations",

    operationsDescriptionFull: isES
      ? "Controla cómo la plataforma administra las operaciones de transporte."
      : "Control how the platform handles trucking operations.",

    gpsMonitoring: isES
      ? "Monitoreo GPS"
      : "GPS Monitoring",

    gpsMonitoringDescription: isES
      ? "Rastrea vehículos autorizados durante las operaciones activas."
      : "Track authorized vehicles during active operations.",

    automaticLoadRefresh: isES
      ? "Actualización automática de cargas"
      : "Automatic Load Refresh",

    automaticLoadRefreshDescription: isES
      ? "Mantén actualizada automáticamente la información de cargas y despacho."
      : "Keep load and dispatch information updated automatically.",

    humanApproval: isES
      ? "Aprobación humana requerida"
      : "Human Approval Required",

    humanApprovalDescription: isES
      ? "Requiere una decisión humana antes de acciones operativas importantes de IA."
      : "Require a human decision before important AI operational actions.",

    aiCopilot: isES
      ? "Copiloto de IA"
      : "AI Copilot",

    aiCopilotDescription: isES
      ? "Configura la capa de apoyo a las decisiones de Project Logistics."
      : "Configure the decision-support layer of Project Logistics.",

    aiCopilotEnabled: isES
      ? "Copiloto de IA habilitado"
      : "AI Copilot Enabled",

    aiCopilotEnabledDescription: isES
      ? "Permite que la IA analice operaciones y genere recomendaciones."
      : "Allow AI to analyze operations and generate recommendations.",

    aiLoadRecommendations: isES
      ? "Recomendaciones de IA para cargas"
      : "AI Load Recommendations",

    aiLoadRecommendationsDescription: isES
      ? "Analiza cargas, millas vacías, HOS, ingresos y posicionamiento."
      : "Analyze loads, deadhead, HOS, revenue and positioning.",

    aiComplianceRecommendations: isES
      ? "Recomendaciones de IA para cumplimiento"
      : "AI Compliance Recommendations",

    aiComplianceRecommendationsDescription: isES
      ? "Identifica posibles riesgos de cumplimiento y recomienda acciones."
      : "Identify potential compliance risks and recommend actions.",

    aiDecisionPolicy: isES
      ? "Política de decisiones de IA"
      : "AI Decision Policy",

    aiDecisionPolicyDescription: isES
      ? "La IA analiza los datos y recomienda acciones. El propietario o usuario autorizado sigue siendo quien toma la decisión final."
      : "AI analyzes data and recommends actions. The owner or authorized user remains the final decision maker.",

    notificationsTitle: isES
      ? "Notificaciones"
      : "Notifications",

    notificationsDescriptionFull: isES
      ? "Configura las alertas operativas."
      : "Configure operational alerts.",

    notificationsEnabled: isES
      ? "Notificaciones habilitadas"
      : "Notifications Enabled",

    notificationsEnabledDescription: isES
      ? "Recibe alertas importantes de Project Logistics."
      : "Receive important Project Logistics alerts.",

    complianceAlerts: isES
      ? "Alertas de cumplimiento"
      : "Compliance Alerts",

    complianceAlertsDescription: isES
      ? "Recibe alertas sobre inspecciones, HOS y documentos próximos a vencer."
      : "Receive alerts for inspections, HOS and expiring documents.",

    loadAlerts: isES
      ? "Alertas de cargas"
      : "Load Alerts",

    loadAlertsDescription: isES
      ? "Recibe notificaciones de recogida, entrega y retrasos."
      : "Receive pickup, delivery and delay notifications.",

    factoringAlerts: isES
      ? "Alertas de factoring"
      : "Factoring Alerts",

    factoringAlertsDescription: isES
      ? "Recibe notificaciones sobre envíos de facturas y estados de financiamiento."
      : "Receive invoice submission and funding status notifications.",

    securityAudit: isES
      ? "Seguridad y auditoría"
      : "Security & Audit",

    securityAuditDescription: isES
      ? "Controles para la responsabilidad operativa."
      : "Controls for operational accountability.",

    auditLog: isES
      ? "Registro de auditoría"
      : "Audit Log",

    auditLogDescription: isES
      ? "Registra acciones importantes del sistema."
      : "Records important system actions.",

    humanDecisionTracking: isES
      ? "Seguimiento de decisiones humanas"
      : "Human Decision Tracking",

    humanDecisionTrackingDescription: isES
      ? "Registra decisiones relacionadas con recomendaciones de IA."
      : "Records decisions involving AI recommendations.",

    roleBasedAccess: isES
      ? "Acceso basado en roles"
      : "Role-Based Access",

    roleBasedAccessDescription: isES
      ? "Los usuarios reciben permisos según su rol."
      : "Users receive permissions based on their role.",

    dataProtection: isES
      ? "Protección de datos"
      : "Data Protection",

    dataProtectionDescription: isES
      ? "El backend de Supabase y las políticas de acceso están activas."
      : "Supabase backend and access policies are active.",

    integrationsTitle: isES
      ? "Integraciones"
      : "Integrations",

    integrationsDescriptionFull: isES
      ? "Servicios externos que se conectarán con Project Logistics."
      : "External services that will connect to Project Logistics.",

    connected: isES
      ? "Conectado"
      : "Connected",

    planned: isES
      ? "Planificado"
      : "Planned",

    supabaseDescription: isES
      ? "Base de datos, autenticación, almacenamiento y tiempo real."
      : "Database, authentication, storage and realtime.",

    mapboxDescription: isES
      ? "Mapas, rutas y operaciones geoespaciales."
      : "Maps, routing and geospatial operations.",

    eldGpsDescription: isES
      ? "Ubicación de vehículos y datos de Horas de Servicio."
      : "Vehicle location and Hours of Service data.",

    backgroundCheckDescription: isES
      ? "Proveedor para incorporación y evaluación de conductores."
      : "Driver onboarding and screening provider.",

    factoringProvidersDescription: isES
      ? "Envío de facturas, financiamiento y conciliación."
      : "Invoice submission, funding and reconciliation.",

    brokerConnectionsDescription: isES
      ? "Integraciones autorizadas con brokers y fuentes de cargas."
      : "Authorized broker and load-source integrations.",

    footerPolicy: isES
      ? "La IA recomienda. El humano decide."
      : "AI recommends. Human decides.",
  };

  function saveSettings() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              {text.brand}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {text.title}
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              {text.subtitle}
            </p>
          </div>

          <button
            onClick={saveSettings}
            style={{
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "11px 18px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {text.saveChanges}
          </button>
        </div>

        {saved && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "13px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {text.saved}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "8px",
            }}
          >
            <SettingNav
              active
              title={text.general}
              description={text.generalDescription}
            />

            <SettingNav
              title={text.operations}
              description={text.operationsDescription}
            />

            <SettingNav
              title={text.ai}
              description={text.aiDescription}
            />

            <SettingNav
              title={text.notifications}
              description={text.notificationsDescription}
            />

            <SettingNav
              title={text.security}
              description={text.securityDescription}
            />

            <SettingNav
              title={text.integrations}
              description={text.integrationsDescription}
            />
          </aside>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <section style={sectionStyle}>
              <SectionHeader
                title={text.company}
                description={text.companyDescription}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <InputField
                  label={text.companyName}
                  value="Project Logistics"
                />

                <InputField
                  label={text.operatingCountry}
                  value="United States"
                />

                <InputField
                  label={text.primaryTimeZone}
                  value="America/New_York"
                />

                <InputField
                  label={text.currency}
                  value="USD"
                />
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionHeader
                title={text.operationsTitle}
                description={text.operationsDescriptionFull}
              />

              <ToggleRow
                title={text.gpsMonitoring}
                description={text.gpsMonitoringDescription}
                enabled={gpsEnabled}
                onChange={setGpsEnabled}
              />

              <ToggleRow
                title={text.automaticLoadRefresh}
                description={text.automaticLoadRefreshDescription}
                enabled={automaticLoadRefresh}
                onChange={setAutomaticLoadRefresh}
              />

              <ToggleRow
                title={text.humanApproval}
                description={text.humanApprovalDescription}
                enabled={humanApproval}
                onChange={setHumanApproval}
              />
            </section>

            <section style={sectionStyle}>
              <SectionHeader
                title={text.aiCopilot}
                description={text.aiCopilotDescription}
              />

              <ToggleRow
                title={text.aiCopilotEnabled}
                description={text.aiCopilotEnabledDescription}
                enabled={aiEnabled}
                onChange={setAiEnabled}
              />

              <ToggleRow
                title={text.aiLoadRecommendations}
                description={
                  text.aiLoadRecommendationsDescription
                }
                enabled={aiLoadRecommendations}
                onChange={setAiLoadRecommendations}
              />

              <ToggleRow
                title={text.aiComplianceRecommendations}
                description={
                  text.aiComplianceRecommendationsDescription
                }
                enabled={aiComplianceRecommendations}
                onChange={setAiComplianceRecommendations}
              />

              <div
                style={{
                  marginTop: "16px",
                  padding: "15px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  {text.aiDecisionPolicy}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    lineHeight: 1.6,
                  }}
                >
                  {text.aiDecisionPolicyDescription}
                </div>
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionHeader
                title={text.notificationsTitle}
                description={text.notificationsDescriptionFull}
              />

              <ToggleRow
                title={text.notificationsEnabled}
                description={text.notificationsEnabledDescription}
                enabled={notificationsEnabled}
                onChange={setNotificationsEnabled}
              />

              <ToggleRow
                title={text.complianceAlerts}
                description={text.complianceAlertsDescription}
                enabled={complianceAlerts}
                onChange={setComplianceAlerts}
              />

              <ToggleRow
                title={text.loadAlerts}
                description={text.loadAlertsDescription}
                enabled={loadAlerts}
                onChange={setLoadAlerts}
              />

              <ToggleRow
                title={text.factoringAlerts}
                description={text.factoringAlertsDescription}
                enabled={factoringAlerts}
                onChange={setFactoringAlerts}
              />
            </section>

            <section style={sectionStyle}>
              <SectionHeader
                title={text.securityAudit}
                description={text.securityAuditDescription}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <SecurityCard
                  title={text.auditLog}
                  status={text.connected}
                  description={text.auditLogDescription}
                />

                <SecurityCard
                  title={text.humanDecisionTracking}
                  status={text.connected}
                  description={
                    text.humanDecisionTrackingDescription
                  }
                />

                <SecurityCard
                  title={text.roleBasedAccess}
                  status={text.connected}
                  description={text.roleBasedAccessDescription}
                />

                <SecurityCard
                  title={text.dataProtection}
                  status={text.connected}
                  description={text.dataProtectionDescription}
                />
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionHeader
                title={text.integrationsTitle}
                description={text.integrationsDescriptionFull}
              />

              <IntegrationRow
                name="Supabase"
                description={text.supabaseDescription}
                status={text.connected}
              />

              <IntegrationRow
                name="Mapbox"
                description={text.mapboxDescription}
                status={text.planned}
              />

              <IntegrationRow
                name="ELD / GPS Providers"
                description={text.eldGpsDescription}
                status={text.planned}
              />

              <IntegrationRow
                name="Background Check"
                description={
                  text.backgroundCheckDescription
                }
                status={text.planned}
              />

              <IntegrationRow
                name="Factoring Providers"
                description={
                  text.factoringProvidersDescription
                }
                status={text.planned}
              />

              <IntegrationRow
                name="Broker Connections"
                description={
                  text.brokerConnectionsDescription
                }
                status={text.planned}
              />
            </section>
          </div>
        </div>

        <div
          style={{
            marginTop: "28px",
            padding: "20px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          <strong
            style={{
              color: "#0f172a",
            }}
          >
            Project Logistics
          </strong>

          {" · "}

          {text.footerPolicy}
        </div>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: 800,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "6px 0 0",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function SettingNav({
  title,
  description,
  active = false,
}: {
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "10px",
        background: active
          ? "#f1f5f9"
          : "transparent",
        marginBottom: "3px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: active
            ? "#0f172a"
            : "#334155",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "#94a3b8",
          marginTop: "3px",
        }}
      >
        {description}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          color: "#64748b",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        {label}
      </label>

      <input
        defaultValue={value}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #cbd5e1",
          borderRadius: "9px",
          padding: "10px 11px",
          fontSize: "13px",
          color: "#0f172a",
          background: "#ffffff",
          outline: "none",
        }}
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "15px 0",
        borderBottom:
          "1px solid #f1f5f9",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            marginTop: "4px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!enabled)
        }
        aria-label={title}
        aria-pressed={enabled}
        style={{
          width: "48px",
          height: "26px",
          borderRadius: "999px",
          border: "none",
          background: enabled
            ? "#0f172a"
            : "#cbd5e1",
          padding: "3px",
          cursor: "pointer",
          flexShrink: 0,
          transition:
            "background 0.15s ease",
        }}
      >
        <span
          style={{
            display: "block",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#ffffff",
            transform: enabled
              ? "translateX(22px)"
              : "translateX(0)",
            transition:
              "transform 0.15s ease",
          }}
        />
      </button>
    </div>
  );
}

function SecurityCard({
  title,
  status,
  description,
}: {
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        <span
          style={{
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "999px",
            padding: "4px 7px",
            fontSize: "9px",
            fontWeight: 800,
          }}
        >
          {status}
        </span>
      </div>

      <div
        style={{
          marginTop: "7px",
          fontSize: "11px",
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  );
}

function IntegrationRow({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: string;
}) {
  const connected =
    status.toLowerCase() ===
    "connected" ||
    status.toLowerCase() ===
      "conectado";

  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "15px 0",
        borderBottom:
          "1px solid #f1f5f9",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {name}
        </div>

        <div
          style={{
            marginTop: "4px",
            fontSize: "11px",
            color: "#64748b",
          }}
        >
          {description}
        </div>
      </div>

      <span
        style={{
          background: connected
            ? "#dcfce7"
            : "#f1f5f9",
          color: connected
            ? "#166534"
            : "#64748b",
          borderRadius: "999px",
          padding: "6px 9px",
          fontSize: "10px",
          fontWeight: 800,
          whiteSpace:
            "nowrap",
        }}
      >
        {status}
      </span>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "22px",
};