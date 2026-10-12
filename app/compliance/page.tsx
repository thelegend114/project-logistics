"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type Driver = {
  id: string;
  full_name: string;
  driver_number: string | null;
};

type Inspection = {
  id: string;
  driver_id: string | null;
  inspection_date: string | null;
  inspection_type: string | null;
  result: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

type HosEvent = {
  id: string;
  driver_id: string | null;
  event_type: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

function getString(
  value: unknown,
  fallback = ""
): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function inspectionStatus(
  expirationDate: string | null | undefined,
  isES: boolean
) {
  if (!expirationDate) {
    return isES ? "Sin fecha" : "No date";
  }

  const date = new Date(expirationDate);

  if (Number.isNaN(date.getTime())) {
    return isES ? "Desconocido" : "Unknown";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  const diff =
    Math.ceil(
      (date.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  if (diff < 0) {
    return isES ? "Vencida" : "Expired";
  }

  if (diff <= 30) {
    return isES ? "Por vencer" : "Expiring Soon";
  }

  return isES ? "Vigente" : "Current";
}

function translateHosEvent(
  value: string | null | undefined,
  isES: boolean
) {
  const normalized = (value || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "driving") {
    return isES ? "Conduciendo" : "Driving";
  }

  if (normalized === "on_duty") {
    return isES ? "En servicio" : "On Duty";
  }

  if (normalized === "off_duty") {
    return isES ? "Fuera de servicio" : "Off Duty";
  }

  if (normalized === "sleeper") {
    return isES ? "Durmiendo" : "Sleeper";
  }

  if (normalized === "violation") {
    return isES ? "Violación" : "Violation";
  }

  if (normalized === "break") {
    return isES ? "Descanso" : "Break";
  }

  return value || (isES ? "Desconocido" : "Unknown");
}

function formatDate(
  value: string | null | undefined,
  isES: boolean
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    isES ? "es-US" : "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value: string | null | undefined,
  isES: boolean
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    isES ? "es-US" : "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export default function CompliancePage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    brand: isES
      ? "LOGÍSTICA DEL PROYECTO"
      : "PROJECT LOGISTICS",

    title: isES
      ? "Cumplimiento"
      : "Compliance",

    subtitle: isES
      ? "Supervisa inspecciones, cumplimiento HOS y eventos regulatorios."
      : "Monitor inspections, HOS compliance and regulatory events.",

    refresh: isES
      ? "Actualizar"
      : "Refresh",

    inspections: isES
      ? "Inspecciones"
      : "Inspections",

    hosEvents: isES
      ? "Eventos HOS"
      : "HOS Events",

    totalInspections: isES
      ? "Total de inspecciones"
      : "Total Inspections",

    compliant: isES
      ? "Cumplimiento"
      : "Compliant",

    violations: isES
      ? "Violaciones"
      : "Violations",

    expiring: isES
      ? "Por vencer"
      : "Expiring Soon",

    commandCenter: isES
      ? "Centro de cumplimiento"
      : "Compliance Command Center",

    inspectionsTab: isES
      ? "Inspecciones"
      : "Inspections",

    hosTab: isES
      ? "HOS"
      : "HOS",

    searchInspections: isES
      ? "Buscar conductor, tipo o resultado..."
      : "Search driver, type or result...",

    searchHos: isES
      ? "Buscar conductor o evento..."
      : "Search driver or event...",

    all: isES
      ? "Todos"
      : "All",

    allResults: isES
      ? "Todos los resultados"
      : "All Results",

    pass: isES
      ? "Aprobado"
      : "Pass",

    fail: isES
      ? "Falló"
      : "Fail",

    violation: isES
      ? "Violación"
      : "Violation",

    date: isES
      ? "Fecha"
      : "Date",

    driver: isES
      ? "Conductor"
      : "Driver",

    type: isES
      ? "Tipo"
      : "Type",

    result: isES
      ? "Resultado"
      : "Result",

    unknownResult: isES
      ? "Desconocido"
      : "Unknown",

    status: isES
      ? "Estado"
      : "Status",

    event: isES
      ? "Evento"
      : "Event",

    start: isES
      ? "Inicio"
      : "Start",

    end: isES
      ? "Fin"
      : "End",

    details: isES
      ? "Detalles"
      : "Details",

    view: isES
      ? "Ver"
      : "View",

    loading: isES
      ? "Cargando..."
      : "Loading...",

    noInspections: isES
      ? "No se encontraron inspecciones."
      : "No inspections found.",

    noHosEvents: isES
      ? "No se encontraron eventos HOS."
      : "No HOS events found.",

    inspectionDetails: isES
      ? "Detalles de inspección"
      : "Inspection Details",

    hosDetails: isES
      ? "Detalles del evento HOS"
      : "HOS Event Details",

    close: isES
      ? "Cerrar"
      : "Close",

    noNotes: isES
      ? "Sin notas"
      : "No notes",

    unassigned: isES
      ? "Sin asignar"
      : "Unassigned",

    error: isES
      ? "Error"
      : "Error",

    failedLoad: isES
      ? "No se pudieron cargar los datos de cumplimiento."
      : "Could not load compliance data.",

    systemOverview: isES
      ? "Resumen del sistema"
      : "System Overview",

    inspectionSummary: isES
      ? "Resumen de inspecciones"
      : "Inspection Summary",

    hosSummary: isES
      ? "Resumen HOS"
      : "HOS Summary",

    monitor:
      isES
        ? "Supervisa el estado operativo y regulatorio de tu flota."
        : "Monitor the operational and regulatory status of your fleet.",
  };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [inspections, setInspections] =
    useState<Inspection[]>([]);
  const [hosEvents, setHosEvents] =
    useState<HosEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [activeTab, setActiveTab] = useState<
    "inspections" | "hos"
  >("inspections");

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] =
    useState("all");

  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  const [selectedHosEvent, setSelectedHosEvent] =
    useState<HosEvent | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const [
      driversResult,
      inspectionsResult,
      hosResult,
    ] = await Promise.all([
      supabase
        .from("drivers")
        .select("id, full_name, driver_number")
        .order("full_name", {
          ascending: true,
        }),

      supabase
        .from("inspections")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("hos_events")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (driversResult.error) {
      setErrorMessage(
        driversResult.error.message
      );
    } else {
      setDrivers(
        (driversResult.data || []) as Driver[]
      );
    }

    if (inspectionsResult.error) {
      setErrorMessage(
        inspectionsResult.error.message
      );
      setInspections([]);
    } else {
      setInspections(
        (inspectionsResult.data ||
          []) as Inspection[]
      );
    }

    if (hosResult.error) {
      setErrorMessage(
        hosResult.error.message
      );
      setHosEvents([]);
    } else {
      setHosEvents(
        (hosResult.data || []) as HosEvent[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function driverName(driverId: string | null) {
    if (!driverId) {
      return text.unassigned;
    }

    const driver = drivers.find(
      (item) => item.id === driverId
    );

    if (!driver) {
      return text.unassigned;
    }

    return driver.driver_number
      ? `${driver.full_name} · ${driver.driver_number}`
      : driver.full_name;
  }

  function getInspectionDate(
    inspection: Inspection
  ) {
    return (
      inspection.inspection_date ||
      getString(
        inspection.inspectionDate
      ) ||
      getString(inspection.date) ||
      null
    );
  }

  function getInspectionType(
    inspection: Inspection
  ) {
    return (
      inspection.inspection_type ||
      getString(inspection.inspectionType) ||
      getString(inspection.type) ||
      null
    );
  }

  function getInspectionResult(
    inspection: Inspection
  ) {
    return (
      inspection.result ||
      getString(inspection.outcome) ||
      getString(inspection.inspection_result) ||
      null
    );
  }

  function getInspectionStatus(
    inspection: Inspection
  ) {
    return (
      inspection.status ||
      getString(
        inspection.inspection_status
      ) ||
      null
    );
  }

  function getHosEventType(event: HosEvent) {
    return (
      event.event_type ||
      getString(event.eventType) ||
      getString(event.type) ||
      null
    );
  }

  function getHosStart(event: HosEvent) {
    return (
      event.start_time ||
      getString(event.start) ||
      getString(event.started_at) ||
      null
    );
  }

  function getHosEnd(event: HosEvent) {
    return (
      event.end_time ||
      getString(event.end) ||
      getString(event.ended_at) ||
      null
    );
  }

  const filteredInspections = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    return inspections.filter(
      (inspection) => {
        const driver = driverName(
          inspection.driver_id
        ).toLowerCase();

        const type = getString(
          getInspectionType(inspection)
        ).toLowerCase();

        const result = getString(
          getInspectionResult(inspection)
        ).toLowerCase();

        const matchesSearch =
          !value ||
          driver.includes(value) ||
          type.includes(value) ||
          result.includes(value);

        const rawResult =
          getString(
            getInspectionResult(
              inspection
            )
          ).toLowerCase();

        const matchesFilter =
          resultFilter === "all" ||
          rawResult === resultFilter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    inspections,
    drivers,
    search,
    resultFilter,
  ]);

  const filteredHosEvents = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    return hosEvents.filter((event) => {
      const driver = driverName(
        event.driver_id
      ).toLowerCase();

      const eventType = getString(
        getHosEventType(event)
      ).toLowerCase();

      return (
        !value ||
        driver.includes(value) ||
        eventType.includes(value)
      );
    });
  }, [
    hosEvents,
    drivers,
    search,
  ]);

  const inspectionCount =
    inspections.length;

  const compliantCount =
    inspections.filter((inspection) => {
      const value = getString(
        getInspectionResult(inspection)
      ).toLowerCase();

      return (
        value === "pass" ||
        value === "passed" ||
        value === "approved" ||
        value === "compliant"
      );
    }).length;

  const violationCount =
    inspections.filter((inspection) => {
      const value = getString(
        getInspectionResult(inspection)
      ).toLowerCase();

      return (
        value === "fail" ||
        value === "failed" ||
        value === "violation" ||
        value === "non-compliant"
      );
    }).length;

  const expiringCount =
    inspections.filter((inspection) => {
      const date =
        getInspectionDate(
          inspection
        );

      return (
        inspectionStatus(
          date,
          false
        ) === "Expiring Soon"
      );
    }).length;

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <div>
            <div className="eyebrow">
              {text.brand}
            </div>

            <h1>{text.title}</h1>

            <p>{text.subtitle}</p>
          </div>

          <button
            className="primaryButton"
            onClick={loadData}
            disabled={loading}
          >
            ↻ {text.refresh}
          </button>
        </header>

        {errorMessage && (
          <div className="message error">
            <strong>
              {text.error}:
            </strong>{" "}
            {errorMessage}
          </div>
        )}

        <section className="stats">
          <div className="statCard">
            <div className="statLabel">
              {text.totalInspections}
            </div>

            <div className="statValue">
              {inspectionCount}
            </div>

            <div className="statText">
              {text.inspections}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              {text.compliant}
            </div>

            <div className="statValue">
              {compliantCount}
            </div>

            <div className="statText">
              {text.inspectionSummary}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              {text.violations}
            </div>

            <div className="statValue">
              {violationCount}
            </div>

            <div className="statText">
              {text.hosSummary}
            </div>
          </div>

          <div className="statCard">
            <div className="statLabel">
              {text.expiring}
            </div>

            <div className="statValue">
              {expiringCount}
            </div>

            <div className="statText">
              {text.monitor}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="panelEyebrow">
                {text.commandCenter}
              </div>

              <h2>
                {activeTab === "inspections"
                  ? text.inspectionsTab
                  : text.hosTab}
              </h2>
            </div>

            <div className="tabs">
              <button
                className={
                  activeTab === "inspections"
                    ? "tab active"
                    : "tab"
                }
                onClick={() => {
                  setActiveTab("inspections");
                  setSearch("");
                  setResultFilter("all");
                }}
              >
                {text.inspectionsTab}
              </button>

              <button
                className={
                  activeTab === "hos"
                    ? "tab active"
                    : "tab"
                }
                onClick={() => {
                  setActiveTab("hos");
                  setSearch("");
                  setResultFilter("all");
                }}
              >
                {text.hosTab}
              </button>
            </div>
          </div>

          <div className="toolbar">
            <input
              className="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                activeTab === "inspections"
                  ? text.searchInspections
                  : text.searchHos
              }
            />

            {activeTab === "inspections" && (
              <select
                className="select"
                value={resultFilter}
                onChange={(event) =>
                  setResultFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  {text.allResults}
                </option>

                <option value="pass">
                  {text.pass}
                </option>

                <option value="fail">
                  {text.fail}
                </option>

                <option value="violation">
                  {text.violation}
                </option>
              </select>
            )}
          </div>

          {loading ? (
            <div className="empty">
              {text.loading}
            </div>
          ) : activeTab === "inspections" ? (
            filteredInspections.length ===
            0 ? (
              <div className="empty">
                {text.noInspections}
              </div>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>{text.date}</th>
                      <th>{text.driver}</th>
                      <th>{text.type}</th>
                      <th>{text.result}</th>
                      <th>{text.status}</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInspections.map(
                      (inspection) => {
                        const date =
                          getInspectionDate(
                            inspection
                          );

                        const type =
                          getInspectionType(
                            inspection
                          );

                        const result =
                          getInspectionResult(
                            inspection
                          );

                        const status =
                          getInspectionStatus(
                            inspection
                          );

                        return (
                          <tr
                            key={
                              inspection.id
                            }
                          >
                            <td>
                              {formatDate(
                                date,
                                isES
                              )}
                            </td>

                            <td>
                              <strong>
                                {driverName(
                                  inspection.driver_id
                                )}
                              </strong>
                            </td>

                            <td>
                              {type ||
                                text.unknownResult}
                            </td>

                            <td>
                              <span
                                className={
                                  result
                                    ?.toLowerCase()
                                    .includes(
                                      "fail"
                                    ) ||
                                  result
                                    ?.toLowerCase()
                                    .includes(
                                      "violation"
                                    )
                                    ? "badge danger"
                                    : "badge success"
                                }
                              >
                                {result ||
                                  text.unknownResult}
                              </span>
                            </td>

                            <td>
                              {status ||
                                inspectionStatus(
                                  date,
                                  isES
                                )}
                            </td>

                            <td>
                              <button
                                className="viewButton"
                                onClick={() =>
                                  setSelectedInspection(
                                    inspection
                                  )
                                }
                              >
                                {text.view}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredHosEvents.length ===
            0 ? (
            <div className="empty">
              {text.noHosEvents}
            </div>
          ) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>{text.driver}</th>
                    <th>{text.event}</th>
                    <th>{text.start}</th>
                    <th>{text.end}</th>
                    <th>{text.status}</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHosEvents.map(
                    (event) => {
                      const eventType =
                        getHosEventType(
                          event
                        );

                      const start =
                        getHosStart(event);

                      const end =
                        getHosEnd(event);

                      return (
                        <tr
                          key={event.id}
                        >
                          <td>
                            <strong>
                              {driverName(
                                event.driver_id
                              )}
                            </strong>
                          </td>

                          <td>
                            {translateHosEvent(
                              eventType,
                              isES
                            )}
                          </td>

                          <td>
                            {formatDateTime(
                              start,
                              isES
                            )}
                          </td>

                          <td>
                            {formatDateTime(
                              end,
                              isES
                            )}
                          </td>

                          <td>
                            {translateHosEvent(
                              event.status,
                              isES
                            )}
                          </td>

                          <td>
                            <button
                              className="viewButton"
                              onClick={() =>
                                setSelectedHosEvent(
                                  event
                                )
                              }
                            >
                              {text.view}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedInspection && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedInspection(
                null
              );
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  {text.inspectionDetails}
                </div>

                <h2>
                  {driverName(
                    selectedInspection.driver_id
                  )}
                </h2>

                <p>
                  {formatDate(
                    getInspectionDate(
                      selectedInspection
                    ),
                    isES
                  )}
                </p>
              </div>

              <button
                className="closeButton"
                onClick={() =>
                  setSelectedInspection(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="detailGrid">
              <div>
                <span>
                  {text.type}
                </span>
                <strong>
                  {getInspectionType(
                    selectedInspection
                  ) ||
                    text.unknownResult}
                </strong>
              </div>

              <div>
                <span>
                  {text.result}
                </span>
                <strong>
                  {getInspectionResult(
                    selectedInspection
                  ) ||
                    text.unknownResult}
                </strong>
              </div>

              <div>
                <span>
                  {text.status}
                </span>
                <strong>
                  {getInspectionStatus(
                    selectedInspection
                  ) ||
                    inspectionStatus(
                      getInspectionDate(
                        selectedInspection
                      ),
                      isES
                    )}
                </strong>
              </div>

              <div className="full">
                <span>
                  {text.details}
                </span>

                <strong>
                  {selectedInspection.notes ||
                    getString(
                      selectedInspection.description
                    ) ||
                    text.noNotes}
                </strong>
              </div>
            </div>

            <div className="modalFooter">
              <button
                className="secondaryButton"
                onClick={() =>
                  setSelectedInspection(
                    null
                  )
                }
              >
                {text.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHosEvent && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedHosEvent(null);
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  {text.hosDetails}
                </div>

                <h2>
                  {driverName(
                    selectedHosEvent.driver_id
                  )}
                </h2>
              </div>

              <button
                className="closeButton"
                onClick={() =>
                  setSelectedHosEvent(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="detailGrid">
              <div>
                <span>
                  {text.event}
                </span>

                <strong>
                  {translateHosEvent(
                    getHosEventType(
                      selectedHosEvent
                    ),
                    isES
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {text.status}
                </span>

                <strong>
                  {translateHosEvent(
                    selectedHosEvent.status,
                    isES
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {text.start}
                </span>

                <strong>
                  {formatDateTime(
                    getHosStart(
                      selectedHosEvent
                    ),
                    isES
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {text.end}
                </span>

                <strong>
                  {formatDateTime(
                    getHosEnd(
                      selectedHosEvent
                    ),
                    isES
                  )}
                </strong>
              </div>

              <div className="full">
                <span>
                  {text.details}
                </span>

                <strong>
                  {selectedHosEvent.notes ||
                    text.noNotes}
                </strong>
              </div>
            </div>

            <div className="modalFooter">
              <button
                className="secondaryButton"
                onClick={() =>
                  setSelectedHosEvent(null)
                }
              >
                {text.close}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          padding: 32px;
        }

        .container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.1;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .primaryButton {
          border: 0;
          background: #2563eb;
          color: white;
          border-radius: 9px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .primaryButton:hover {
          background: #1d4ed8;
        }

        .primaryButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 650;
        }

        .message.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .statCard {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          box-shadow:
            0 1px 2px
              rgba(15, 23, 42, 0.03);
        }

        .statLabel {
          font-size: 11px;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .statValue {
          margin-top: 8px;
          font-size: 30px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .statText {
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
        }

        .panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 1px 2px
              rgba(15, 23, 42, 0.03);
        }

        .panelHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-bottom: 1px solid
            #e2e8f0;
        }

        .panelEyebrow {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .tabs {
          display: flex;
          gap: 8px;
        }

        .tab {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          border-radius: 8px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .tab.active {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
        }

        .toolbar {
          display: flex;
          gap: 12px;
          padding: 18px;
          border-bottom: 1px solid
            #e2e8f0;
        }

        .search,
        .select {
          width: 100%;
          height: 42px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: white;
          padding: 0 12px;
          color: #0f172a;
          font-size: 13px;
          outline: none;
        }

        .search {
          max-width: 520px;
        }

        .select {
          max-width: 220px;
        }

        .search:focus,
        .select:focus {
          border-color: #60a5fa;
          box-shadow:
            0 0 0 3px
              rgba(59, 130, 246, 0.12);
        }

        .tableWrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          padding: 13px 16px;
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-align: left;
          border-bottom: 1px solid
            #e2e8f0;
          white-space: nowrap;
        }

        td {
          padding: 14px 16px;
          font-size: 13px;
          border-bottom: 1px solid
            #eef2f7;
          white-space: nowrap;
        }

        tbody tr:hover {
          background: #f8fafc;
        }

        .viewButton {
          border: 1px solid #cbd5e1;
          background: white;
          color: #334155;
          border-radius: 7px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .viewButton:hover {
          background: #f8fafc;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
        }

        .badge.success {
          background: #ecfdf5;
          color: #047857;
        }

        .badge.danger {
          background: #fef2f2;
          color: #b91c1c;
        }

        .empty {
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 14px;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(
            15,
            23,
            42,
            0.48
          );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modal {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow:
            0 24px 80px
              rgba(15, 23, 42, 0.24);
        }

        .modalHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border-bottom: 1px solid
            #e2e8f0;
        }

        .closeButton {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .detailGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 16px;
          padding: 24px;
        }

        .detailGrid > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .detailGrid > div.full {
          grid-column: 1 / -1;
        }

        .detailGrid span {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detailGrid strong {
          color: #0f172a;
          font-size: 13px;
          line-height: 1.5;
        }

        .modalFooter {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 18px 24px;
          border-top: 1px solid
            #e2e8f0;
        }

        .secondaryButton {
          border: 1px solid #cbd5e1;
          background: white;
          color: #334155;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .secondaryButton:hover {
          background: #f8fafc;
        }

        @media (max-width: 1000px) {
          .stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .panelHeader {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 700px) {
          .page {
            padding: 20px;
          }

          .header {
            flex-direction: column;
          }

          .primaryButton {
            width: 100%;
          }

          .toolbar {
            flex-direction: column;
          }

          .search,
          .select {
            max-width: none;
          }

          .detailGrid {
            grid-template-columns: 1fr;
          }

          .detailGrid > div.full {
            grid-column: auto;
          }
        }

        @media (max-width: 560px) {
          .page {
            padding: 14px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .tabs {
            width: 100%;
          }

          .tab {
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}