"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../lib/LanguageProvider";

type Load = {
  id: string;
  load_number: string | null;
  broker_name: string | null;
  customer_name: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  miles: number | null;
  rate: number | null;
  status: string | null;
  driver_id: string | null;
  truck_id: string | null;
  created_at: string;
};

type Driver = {
  id: string;
  full_name: string | null;
  status: string | null;
};

type Truck = {
  id: string;
  unit_number: string | null;
  status: string | null;
};

type GPS = {
  id: string;
  driver_id: string | null;
  truck_id: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string | null;
  load_id: string | null;
};

type HOSEvent = {
  id: string;
  driver_id: string | null;
  event_type: string | null;
  event_time: string | null;
  location: string | null;
  source: string | null;
};

type LoadStop = {
  id: string;
  load_id: string;
  stop_order: number;
  stop_type: string | null;
  pickup_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

export default function CommandPage() {
  const { language, t } = useLanguage();

  const [loads, setLoads] = useState<Load[]>([]);
  const [loadStops, setLoadStops] = useState<LoadStop[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [gpsEvents, setGpsEvents] = useState<GPS[]>([]);
  const [hosEvents, setHosEvents] = useState<HOSEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  
  async function loadDashboard() {
  setLoading(true);
  setError("");

  const [
    loadsResult,
    driversResult,
    trucksResult,
    gpsResult,
    hosResult,
    stopsResult,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select(
        "id, load_number, broker_name, customer_name, origin_city, origin_state, destination_city, destination_state, miles, rate, status, driver_id, truck_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("drivers")
      .select("id, full_name, status")
      .order("created_at", { ascending: false }),

    supabase
      .from("trucks")
      .select("id, unit_number, status")
      .order("created_at", { ascending: false }),

    supabase
      .from("gps_events")
      .select(
        "id, driver_id, truck_id, latitude, longitude, speed, heading, recorded_at, load_id"
      )
      .order("recorded_at", { ascending: false })
      .limit(20),

    supabase
      .from("hos_events")
      .select(
        "id, driver_id, event_type, event_time, location, source"
      )
      .order("event_time", { ascending: false })
      .limit(20),

    supabase
      .from("load_stops")
      .select(
        "id, load_id, stop_order, stop_type, pickup_number, address, city, state"
      )
      .order("stop_order", { ascending: true }),
  ]);

  if (loadsResult.error) {
    setError(`Loads: ${loadsResult.error.message}`);
    setLoading(false);
    return;
  }

  if (driversResult.error) {
    setError(`Drivers: ${driversResult.error.message}`);
    setLoading(false);
    return;
  }

  if (trucksResult.error) {
    setError(`Trucks: ${trucksResult.error.message}`);
    setLoading(false);
    return;
  }

  if (gpsResult.error) {
    setError(`GPS: ${gpsResult.error.message}`);
    setLoading(false);
    return;
  }

  if (hosResult.error) {
    setError(`HOS: ${hosResult.error.message}`);
    setLoading(false);
    return;
  }

  if (stopsResult.error) {
    setError(`Stops / Paradas: ${stopsResult.error.message}`);
    setLoading(false);
    return;
  }

  setLoads(loadsResult.data || []);
  setLoadStops((stopsResult.data ?? []) as LoadStop[]);
  setDrivers(driversResult.data || []);
  setTrucks(trucksResult.data || []);
  setGpsEvents(gpsResult.data || []);
  setHosEvents(hosResult.data || []);
  setLastUpdated(new Date());

  setLoading(false);
}

  

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const activeLoads = loads.filter((load) => {
      const status = (load.status || "").toLowerCase();

      return ![
        "delivered",
        "completed",
        "cancelled",
        "canceled",
      ].includes(status);
    });

    const inTransit = loads.filter((load) => {
      const status = (load.status || "").toLowerCase();

      return (
        status.includes("transit") ||
        status.includes("en route") ||
        status.includes("in_transit")
      );
    });

    const delivered = loads.filter((load) => {
      const status = (load.status || "").toLowerCase();

      return status === "delivered" || status === "completed";
    });

    const revenue = loads.reduce(
      (total, load) => total + Number(load.rate || 0),
      0
    );

    const activeDrivers = drivers.filter((driver) => {
      const status = (driver.status || "").toLowerCase();

      return (
        status === "active" ||
        status === "available" ||
        status === "on duty"
      );
    });

    const activeTrucks = trucks.filter((truck) => {
      const status = (truck.status || "").toLowerCase();

      return (
        status === "active" ||
        status === "available" ||
        status === "in service"
      );
    });

    return {
      activeLoads: activeLoads.length,
      inTransit: inTransit.length,
      delivered: delivered.length,
      revenue,
      drivers: activeDrivers.length,
      trucks: activeTrucks.length,
    };
  }, [loads, drivers, trucks]);

  
const loadStopsByLoad = useMemo(() => {
  const grouped: Record<string, LoadStop[]> = {};

  for (const stop of loadStops) {
    const loadId = String(stop.load_id);

    if (!grouped[loadId]) {
      grouped[loadId] = [];
    }

    grouped[loadId].push(stop);
  }

  for (const stops of Object.values(grouped)) {
    stops.sort((a, b) => a.stop_order - b.stop_order);
  }

  return grouped;
}, [loadStops]);


  const latestGPS = gpsEvents[0] || null;
  const latestHOS = hosEvents[0] || null;

  const driverName = latestGPS?.driver_id
    ? drivers.find(
        (driver) => driver.id === latestGPS.driver_id
      )?.full_name
    : null;

  const truckNumber = latestGPS?.truck_id
    ? trucks.find(
        (truck) => truck.id === latestGPS.truck_id
      )?.unit_number
    : null;

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
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
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
              Project Logistics
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {t.command.projectCommand}
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              {t.command.realtimeDescription}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#dcfce7",
                color: "#166534",
                borderRadius: "999px",
                padding: "7px 11px",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              ● {t.command.live}
            </div>

            <button
              onClick={loadDashboard}
              style={{
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "10px 15px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.command.refresh}
            </button>
          </div>
        </div>

        {/* LAST UPDATED */}
        {lastUpdated && (
          <div
            style={{
              marginBottom: "18px",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            {t.command.lastUpdated}:{" "}
            {lastUpdated.toLocaleTimeString(
              language === "ES" ? "es-US" : "en-US",
              {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              }
            )}
            {" · "}
            {t.command.automaticRefresh}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(6, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            title={t.command.activeLoads}
            value={stats.activeLoads}
            subtitle={t.command.operational}
          />

          <StatCard
            title={t.command.inTransit}
            value={stats.inTransit}
            subtitle={t.command.onTheRoad}
          />

          <StatCard
            title={t.command.delivered}
            value={stats.delivered}
            subtitle={t.command.completed}
          />

          <StatCard
            title={t.command.revenue}
            value={formatMoney(stats.revenue, language)}
            subtitle={t.command.loadRevenue}
          />

          <StatCard
            title={t.command.drivers}
            value={stats.drivers}
            subtitle={t.command.active}
          />

          <StatCard
            title={t.command.trucks}
            value={stats.trucks}
            subtitle={t.command.active}
          />
        </div>

        {/* LIVE OPERATIONS + GPS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {/* LIVE OPERATIONS */}
          <section style={sectionStyle}>
            <SectionHeader
              title={t.command.liveOperations}
              description={t.command.latestLoadsActivity}
            />

            {loading ? (
              <LoadingState
                text={t.command.loadingLiveData}
              />
            ) : loads.length === 0 ? (
              <EmptyState text={t.command.noLoads} />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {loads.slice(0, 6).map((load) => (
                  <div
                    key={load.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "14px",
                      display: "grid",
                      gridTemplateColumns:
                        "110px 1fr 120px 100px",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "13px",
                        }}
                      >
                       
{(loadStopsByLoad[String(load.id)] ?? [])
  .filter((stop) =>
    ["pickup", "pick_up", "pick-up"].includes(
      String(stop.stop_type ?? "").trim().toLowerCase()
    )
  )
  .map((stop) => String(stop.pickup_number ?? "").trim())
  .filter((number) => number.length > 0)
  .filter((number, index, numbers) => numbers.indexOf(number) === index)
  .join(" / ") ||
  load.load_number ||
  t.command.unknown}

                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "3px",
                        }}
                      >
                        {load.broker_name ||
                          t.command.noBroker}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        
{(loadStopsByLoad[String(load.id)] ?? []).length > 0
  ? (loadStopsByLoad[String(load.id)] ?? [])
      .map((stop) => {
        const location = [
          stop.address,
          [stop.city, stop.state].filter(Boolean).join(", "),
        ]
          .filter(Boolean)
          .join(" — ");

        return location || "—";
      })
      .join(" → ")
  : `${load.origin_city || "—"}, ${load.origin_state || ""} → ${
      load.destination_city || "—"
    }, ${load.destination_state || ""}`}

                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "4px",
                        }}
                      >
                        {load.miles || 0}{" "}
                        {t.command.miles}
                        {" · "}
                        {load.customer_name ||
                          t.command.noCustomer}
                      </div>
                    </div>

                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "14px",
                      }}
                    >
                      {formatMoney(
                        Number(load.rate || 0),
                        language
                      )}
                    </div>

                    <StatusBadge
                      status={load.status}
                      unknownText={t.command.unknown}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* GPS */}
          <section style={sectionStyle}>
            <SectionHeader
              title={t.command.gpsMonitoring}
              description={t.command.latestVehiclePosition}
            />

            {loading ? (
              <LoadingState
                text={t.command.loadingLiveData}
              />
            ) : !latestGPS ? (
              <EmptyState
                text={t.command.noGpsEvents}
              />
            ) : (
              <div>
                <div
                  style={{
                    height: "250px",
                    borderRadius: "14px",
                    background:
                      "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "20px",
                      border: "1px dashed #94a3b8",
                      borderRadius: "12px",
                    }}
                  />

                  <div
                    style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "999px",
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      zIndex: 2,
                    }}
                  >
                    🚚
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      right: "12px",
                      background:
                        "rgba(255,255,255,0.92)",
                      borderRadius: "10px",
                      padding: "9px 11px",
                      fontSize: "11px",
                      color: "#475569",
                    }}
                  >
                    {t.command.mapboxMessage}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <MiniInfo
                    label={t.command.driver}
                    value={
                      driverName || t.command.unknown
                    }
                  />

                  <MiniInfo
                    label={t.command.truck}
                    value={
                      truckNumber || t.command.unknown
                    }
                  />

                  <MiniInfo
                    label={t.command.latitude}
                    value={formatCoordinate(
                      latestGPS.latitude
                    )}
                  />

                  <MiniInfo
                    label={t.command.longitude}
                    value={formatCoordinate(
                      latestGPS.longitude
                    )}
                  />

                  <MiniInfo
                    label={t.command.speed}
                    value={`${Number(
                      latestGPS.speed || 0
                    )} mph`}
                  />

                  <MiniInfo
                    label={t.command.updated}
                    value={formatDateTime(
                      latestGPS.recorded_at,
                      language
                    )}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* AI + COMPLIANCE + FINANCE */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {/* AI */}
          <section style={darkSectionStyle}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              Project AI
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              {t.command.aiOperationsCopilot}
            </h2>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: "10px 0 18px",
              }}
            >
              {t.command.aiDescription}
            </p>

            <div
              style={{
                background: "#1e293b",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "13px",
                color: "#e2e8f0",
              }}
            >
              <strong>{t.command.aiPrinciple}</strong>
              <br />
              {t.command.aiFlow}
            </div>
          </section>

          {/* COMPLIANCE */}
          <section style={sectionStyle}>
            <SectionHeader
              title={t.command.compliance}
              description={t.command.latestSafetyHos}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <InfoRow
                label={t.command.inspections}
                value={t.command.connected}
                positive
              />

              <InfoRow
                label={t.command.hosEvents}
                value={String(hosEvents.length)}
                positive
              />

              <InfoRow
                label={t.command.latestHos}
                value={
                  latestHOS?.event_type ||
                  t.command.noEvent
                }
              />

              <InfoRow
                label={t.command.location}
                value={
                  latestHOS?.location ||
                  t.command.noLocation
                }
              />
            </div>
          </section>

          {/* FINANCE */}
          <section style={sectionStyle}>
            <SectionHeader
              title={t.command.financeFactoring}
              description={t.command.financialWorkflow}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <InfoRow
                label={t.command.invoices}
                value={t.command.connected}
                positive
              />

              <InfoRow
                label={t.command.factoring}
                value={t.command.connected}
                positive
              />

              <InfoRow
                label={t.command.revenue}
                value={formatMoney(
                  stats.revenue,
                  language
                )}
              />

              <InfoRow
                label={t.command.loadRevenueStatus}
                value={t.command.liveStatus}
                positive
              />
            </div>
          </section>
        </div>

        {/* SYSTEM STATUS */}
        <section style={sectionStyle}>
          <SectionHeader
            title={t.command.systemStatus}
            description={t.command.platformConnectivity}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <SystemStatus
              name="Supabase"
              status={t.command.connected}
            />

            <SystemStatus
              name={t.command.loads}
              status={t.command.liveStatus}
            />

            <SystemStatus
              name={t.command.drivers}
              status={t.command.liveStatus}
            />

            <SystemStatus
              name={t.command.gps}
              status={t.command.connected}
            />

            <SystemStatus
              name={t.command.hos}
              status={t.command.connected}
            />
          </div>
        </section>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          <strong style={{ color: "#0f172a" }}>
            Project Logistics
          </strong>
          {" · "}
          {t.command.footerDescription}
          {" · "}
          {t.command.aiRecommends}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "25px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "11px",
          color: "#94a3b8",
        }}
      >
        {subtitle}
      </div>
    </div>
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
    <div style={{ marginBottom: "18px" }}>
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
          margin: "5px 0 0",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  unknownText,
}: {
  status: string | null;
  unknownText: string;
}) {
  const value = status || unknownText;
  const normalized = value.toLowerCase();

  let background = "#f1f5f9";
  let color = "#475569";

  if (
    normalized.includes("transit") ||
    normalized.includes("active") ||
    normalized.includes("available")
  ) {
    background = "#dcfce7";
    color = "#166534";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("pickup")
  ) {
    background = "#fef3c7";
    color = "#92400e";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("fail")
  ) {
    background = "#fee2e2";
    color = "#991b1b";
  }

  return (
    <span
      style={{
        display: "inline-block",
        background,
        color,
        borderRadius: "999px",
        padding: "5px 8px",
        fontSize: "11px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: "10px",
        padding: "10px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#94a3b8",
          fontWeight: 700,
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: "#334155",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        paddingBottom: "10px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: positive ? "#166534" : "#0f172a",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SystemStatus({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "5px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
          }}
        />

        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
          }}
        >
          {name}
        </span>
      </div>

      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
        }}
      >
        {status}
      </div>
    </div>
  );
}

function LoadingState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        padding: "35px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      {text}
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        padding: "35px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      {text}
    </div>
  );
}

function formatMoney(
  amount: number,
  language: "EN" | "ES"
) {
  return new Intl.NumberFormat(
    language === "ES" ? "es-US" : "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

function formatCoordinate(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toFixed(5);
}

function formatDateTime(
  value: string | null,
  language: "EN" | "ES"
) {
  if (!value) return "—";

  return new Date(value).toLocaleString(
    language === "ES" ? "es-US" : "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "22px",
};

const darkSectionStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: "16px",
  padding: "22px",
};
