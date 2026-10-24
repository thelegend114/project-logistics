
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type Load = {
  id: string;
  load_number: string;
  broker_name: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  status: string;
  driver: string;
  truck: string;
  revenue: string;
  pickup_labels?: string;
  route?: string;
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

const statusStyle = (status: string) => {
  const normalized = status.trim().toLowerCase();

  if (normalized === "in transit") {
    return { background: "#eff6ff", color: "#2563eb" };
  }

  if (normalized === "at pickup") {
    return { background: "#fff7ed", color: "#ea580c" };
  }

  if (normalized === "delivered") {
    return { background: "#ecfdf5", color: "#059669" };
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return { background: "#fef2f2", color: "#dc2626" };
  }

  return { background: "#f1f5f9", color: "#475569" };
};

function normalizeStatus(value: string | null | undefined): string {
  const status = String(value ?? "new")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (
    ["in_transit", "in transit", "en_route", "en route"].includes(status)
  ) {
    return "In Transit";
  }

  if (
    ["at_pickup", "at pickup", "pickup", "pick_up"].includes(status)
  ) {
    return "At Pickup";
  }

  if (["delivered", "completed"].includes(status)) {
    return "Delivered";
  }

  if (status === "pending_review") {
    return "Pending Review";
  }

  if (status === "assigned") {
    return "Assigned";
  }

  if (status === "cancelled" || status === "canceled") {
    return "Cancelled";
  }

  if (status === "available") {
    return "Available";
  }

  if (status === "new") {
    return "New";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function OperationsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [loads, setLoads] = useState<Load[]>([]);
  const [showNewLoad, setShowNewLoad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [loadNumber, setLoadNumber] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationState, setDestinationState] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOperationsLoads() {
      setLoading(true);

      const [
        loadsResult,
        stopsResult,
        driversResult,
        trucksResult,
      ] = await Promise.all([
        supabase
          .from("loads")
          .select(
            "id, load_number, broker_name, origin_city, origin_state, destination_city, destination_state, status, driver_id, truck_id, rate, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("load_stops")
          .select(
            "id, load_id, stop_order, stop_type, pickup_number, address, city, state"
          )
          .order("stop_order", { ascending: true }),

        supabase
          .from("drivers")
          .select("id, full_name"),

        supabase
          .from("trucks")
          .select("id, unit_number"),
      ]);

      if (!active) return;

      const queryError =
        loadsResult.error ??
        stopsResult.error ??
        driversResult.error ??
        trucksResult.error;

      if (queryError) {
        setMessage(
          language === "ES"
            ? `Error al cargar las operaciones: ${queryError.message}`
            : `Error loading operations: ${queryError.message}`
        );
        setLoading(false);
        return;
      }

      const stops = (stopsResult.data ?? []) as LoadStop[];

      const driverNames = new Map(
        (driversResult.data ?? []).map((driver) => [
          driver.id,
          driver.full_name,
        ])
      );

      const truckNumbers = new Map(
        (trucksResult.data ?? []).map((truck) => [
          truck.id,
          truck.unit_number,
        ])
      );

      const currency = new Intl.NumberFormat(
        language === "ES" ? "es-US" : "en-US",
        {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }
      );

      const realLoads: Load[] = (loadsResult.data ?? []).map((load) => {
        const loadStops = stops
          .filter((stop) => stop.load_id === load.id)
          .sort((a, b) => a.stop_order - b.stop_order);

        const pickupLabels = loadStops
          .filter((stop) =>
            ["pickup", "pick_up", "pick-up"].includes(
              String(stop.stop_type ?? "").trim().toLowerCase()
            )
          )
          .map((stop) => String(stop.pickup_number ?? "").trim())
          .filter((number) => number.length > 0)
          .filter(
            (number, index, numbers) =>
              numbers.indexOf(number) === index
          )
          .join(" / ");

        const route = loadStops
          .map((stop) => {
            const location = [
              stop.address,
              [stop.city, stop.state].filter(Boolean).join(", "),
            ]
              .filter(Boolean)
              .join(" — ");

            return location || "—";
          })
          .join(" → ");

        return {
          id: String(load.id),
          load_number: String(load.load_number ?? ""),
          broker_name: String(load.broker_name ?? ""),
          origin_city: String(load.origin_city ?? ""),
          origin_state: String(load.origin_state ?? ""),
          destination_city: String(load.destination_city ?? ""),
          destination_state: String(load.destination_state ?? ""),
          status: normalizeStatus(load.status),
          driver: load.driver_id
            ? String(driverNames.get(load.driver_id) ?? "Unassigned")
            : "Unassigned",
          truck: load.truck_id
            ? String(truckNumbers.get(load.truck_id) ?? "Unassigned")
            : "Unassigned",
          revenue:
            load.rate == null
              ? "—"
              : currency.format(Number(load.rate)),
          pickup_labels: pickupLabels,
          route:
            route ||
            `${load.origin_city || "—"}, ${load.origin_state || ""} → ${
              load.destination_city || "—"
            }, ${load.destination_state || ""}`,
        };
      });

      if (active) {
        setLoads(realLoads);
        setLoading(false);
      }
    }

    void fetchOperationsLoads();

    return () => {
      active = false;
    };
  }, [language]);

  const activeLoads = loads.filter(
    (load) =>
      !["delivered", "completed", "cancelled", "canceled"].includes(
        load.status.toLowerCase()
      )
  ).length;

  const inTransitLoads = loads.filter(
    (load) => load.status.toLowerCase() === "in transit"
  ).length;

  const atPickupLoads = loads.filter(
    (load) => load.status.toLowerCase() === "at pickup"
  ).length;

  const deliveredLoads = loads.filter(
    (load) => load.status.toLowerCase() === "delivered"
  ).length;

  const openNewLoad = () => {
    setMessage("");
    setLoadNumber("");
    setBrokerName("");
    setOriginCity("");
    setOriginState("");
    setDestinationCity("");
    setDestinationState("");
    setShowNewLoad(true);
  };

  const closeNewLoad = () => {
    if (!saving) {
      setShowNewLoad(false);
    }
  };

  const createLoad = async () => {
    if (
      !loadNumber.trim() ||
      !brokerName.trim() ||
      !originCity.trim() ||
      !originState.trim() ||
      !destinationCity.trim() ||
      !destinationState.trim()
    ) {
      setMessage(
        language === "ES"
          ? "Complete todos los campos requeridos."
          : "Complete all required fields."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (userError || !userProfile?.company_id) {
        setMessage(
          language === "ES"
            ? "No se pudo identificar la empresa de este usuario."
            : "Could not identify the company for this user."
        );
        return;
      }

      const { data, error } = await supabase
        .from("loads")
        .insert({
          company_id: userProfile.company_id,
          load_number: loadNumber.trim(),
          broker_name: brokerName.trim(),
          origin_city: originCity.trim(),
          origin_state: originState.trim().toUpperCase(),
          destination_city: destinationCity.trim(),
          destination_state: destinationState.trim().toUpperCase(),
          status: "new",
        })
        .select(
          "id, load_number, broker_name, origin_city, origin_state, destination_city, destination_state, status"
        )
        .single();

      if (error) {
        console.error("Create load error:", error);
        setMessage(
          error.message ||
            (language === "ES"
              ? "No se pudo crear la carga."
              : "Could not create the load.")
        );
        return;
      }

      const newLoad: Load = {
        id: String(data.id),
        load_number: String(data.load_number ?? loadNumber.trim()),
        broker_name: String(data.broker_name ?? brokerName.trim()),
        origin_city: String(data.origin_city ?? originCity.trim()),
        origin_state: String(
          data.origin_state ?? originState.trim().toUpperCase()
        ),
        destination_city: String(
          data.destination_city ?? destinationCity.trim()
        ),
        destination_state: String(
          data.destination_state ?? destinationState.trim().toUpperCase()
        ),
        status: "New",
        driver: "Unassigned",
        truck: "Unassigned",
        revenue: "—",
        pickup_labels: "",
        route: `${originCity.trim()}, ${originState.trim().toUpperCase()} → ${destinationCity.trim()}, ${destinationState.trim().toUpperCase()}`,
      };

      setLoads((current) => [
        newLoad,
        ...current.filter((load) => load.id !== newLoad.id),
      ]);

      setShowNewLoad(false);
      setLoadNumber("");
      setBrokerName("");
      setOriginCity("");
      setOriginState("");
      setDestinationCity("");
      setDestinationState("");

      setMessage(
        language === "ES"
          ? `Carga ${newLoad.load_number} creada correctamente.`
          : `Load ${newLoad.load_number} created successfully.`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        language === "ES"
          ? "Ocurrió un error inesperado."
          : "An unexpected error occurred."
      );
    } finally {
      setSaving(false);
    }
  };

  const goToLoads = () => {
    router.push("/loads");
  };

  const translateStatus = (status: string) => {
    if (language === "ES") {
      if (status === "In Transit") return t.operations.inTransit;
      if (status === "At Pickup") return "En Recogida";
      if (status === "Delivered") return t.operations.delivered;
      if (status === "New") return "Nueva";
      if (status === "Assigned") return "Asignada";
      if (status === "Pending Review") return "Pendiente de revisión";
      if (status === "Available") return "Disponible";
      if (status === "Cancelled") return "Cancelada";
      if (status === "Unassigned") return "Sin asignar";
    }

    return status;
  };

  const translateDriver = (driver: string) => {
    if (driver === "Unassigned" && language === "ES") {
      return "Sin asignar";
    }

    return driver;
  };

  const translateTruck = (truck: string) => {
    if (truck === "Unassigned" && language === "ES") {
      return "Sin asignar";
    }

    return truck;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "34px 40px 60px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: "#64748b",
                marginBottom: 10,
              }}
            >
              PROJECT LOGISTICS
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 800,
                color: "#172033",
              }}
            >
              {t.operations.title}
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                color: "#64748b",
              }}
            >
              {t.operations.description}
            </p>
          </div>

          <button
            type="button"
            onClick={openNewLoad}
            style={{
              border: "none",
              background: "#111827",
              color: "#ffffff",
              borderRadius: 10,
              padding: "13px 20px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(15,23,42,0.12)",
            }}
          >
            + {t.loads.newLoad}
          </button>
        </div>

        {message && (
          <div
            role="status"
            style={{
              marginBottom: 22,
              padding: "13px 16px",
              borderRadius: 10,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 18,
            marginBottom: 26,
          }}
        >
          <StatCard
            label={t.operations.activeLoads}
            value={activeLoads}
          />
          <StatCard
            label={t.operations.inTransit}
            value={inTransitLoads}
          />
          <StatCard
            label={language === "ES" ? "En Recogida" : "At Pickup"}
            value={atPickupLoads}
          />
          <StatCard
            label={t.operations.delivered}
            value={deliveredLoads}
          />
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
          }}
        >
          <div
            style={{
              padding: "25px 24px 22px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 750,
                  color: "#172033",
                }}
              >
                {t.operations.activeLoads}
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {language === "ES"
                  ? "Actividad actual de transporte."
                  : "Current transportation activity."}
              </p>
            </div>

            <button
              type="button"
              onClick={goToLoads}
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                borderRadius: 8,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {language === "ES"
                ? "Ver Todas las Cargas"
                : "View All Loads"}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <Th>{t.operations.loadNumber}</Th>
                  <Th>{t.operations.status}</Th>
                  <Th>{language === "ES" ? "Ruta" : "Route"}</Th>
                  <Th>{t.operations.driver}</Th>
                  <Th>{t.operations.truck}</Th>
                  <Th>{t.operations.revenue}</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <Td colSpan={6}>
                      {language === "ES"
                        ? "Cargando operaciones..."
                        : "Loading operations..."}
                    </Td>
                  </tr>
                ) : loads.length === 0 ? (
                  <tr>
                    <Td colSpan={6}>
                      {language === "ES"
                        ? "No hay cargas para mostrar."
                        : "No loads to display."}
                    </Td>
                  </tr>
                ) : (
                  loads.map((load) => {
                    const style = statusStyle(load.status);

                    return (
                      <tr
                        key={load.id}
                        style={{
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <Td>
                          <span
                            style={{
                              fontWeight: 750,
                              color: "#172033",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {load.pickup_labels || load.load_number}
                          </span>
                        </Td>

                        <Td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderRadius: 999,
                              background: style.background,
                              color: style.color,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {translateStatus(load.status)}
                          </span>
                        </Td>

                        <Td>
                          <span
                            style={{
                              color: "#475569",
                              whiteSpace: "normal",
                              display: "block",
                              minWidth: 240,
                              maxWidth: 520,
                              lineHeight: 1.7,
                            }}
                          >
                            {load.route ||
                              `${load.origin_city || "—"}, ${
                                load.origin_state || ""
                              } → ${load.destination_city || "—"}, ${
                                load.destination_state || ""
                              }`}
                          </span>
                        </Td>

                        <Td>
                          <span
                            style={{
                              color:
                                load.driver === "Unassigned"
                                  ? "#94a3b8"
                                  : "#475569",
                            }}
                          >
                            {translateDriver(load.driver)}
                          </span>
                        </Td>

                        <Td>
                          <span
                            style={{
                              color:
                                load.truck === "Unassigned"
                                  ? "#94a3b8"
                                  : "#475569",
                            }}
                          >
                            {translateTruck(load.truck)}
                          </span>
                        </Td>

                        <Td>
                          <span
                            style={{
                              fontWeight: 750,
                              color: "#172033",
                            }}
                          >
                            {load.revenue}
                          </span>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showNewLoad && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNewLoad();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 620,
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "22px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 21,
                    fontWeight: 800,
                    color: "#172033",
                  }}
                >
                  {t.loads.createLoad}
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  {language === "ES"
                    ? "Ingrese la información básica de la carga."
                    : "Enter the basic load information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeNewLoad}
                disabled={saving}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#64748b",
                  fontSize: 20,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                }}
              >
                <Field
                  label={t.loads.loadNumber}
                  value={loadNumber}
                  onChange={setLoadNumber}
                  placeholder="PL-1004"
                />

                <Field
                  label={t.loads.broker}
                  value={brokerName}
                  onChange={setBrokerName}
                  placeholder={
                    language === "ES"
                      ? "Nombre del broker"
                      : "Broker name"
                  }
                />

                <Field
                  label={
                    language === "ES" ? "Ciudad de Origen" : "Origin City"
                  }
                  value={originCity}
                  onChange={setOriginCity}
                  placeholder="Miami"
                />

                <Field
                  label={
                    language === "ES"
                      ? "Estado de Origen"
                      : "Origin State"
                  }
                  value={originState}
                  onChange={setOriginState}
                  placeholder="FL"
                  maxLength={2}
                />

                <Field
                  label={
                    language === "ES"
                      ? "Ciudad de Destino"
                      : "Destination City"
                  }
                  value={destinationCity}
                  onChange={setDestinationCity}
                  placeholder="Atlanta"
                />

                <Field
                  label={
                    language === "ES"
                      ? "Estado de Destino"
                      : "Destination State"
                  }
                  value={destinationState}
                  onChange={setDestinationState}
                  placeholder="GA"
                  maxLength={2}
                />
              </div>

              {message && (
                <div
                  style={{
                    marginTop: 18,
                    padding: "11px 13px",
                    borderRadius: 8,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {message}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={closeNewLoad}
                disabled={saving}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  borderRadius: 8,
                  padding: "11px 17px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {t.common.cancel}
              </button>

              <button
                type="button"
                onClick={createLoad}
                disabled={saving}
                style={{
                  border: "none",
                  background: saving ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "11px 18px",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving
                  ? language === "ES"
                    ? "Creando..."
                    : "Creating..."
                  : t.loads.createLoad}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 13,
        padding: "22px 20px",
        minHeight: 108,
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          marginBottom: 12,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 800,
          color: "#172033",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "14px 18px",
        fontSize: 12,
        fontWeight: 800,
        color: "#475569",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  colSpan,
}: {
  children: ReactNode;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: "17px 18px",
        fontSize: 13,
        color: "#475569",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 7,
          fontSize: 12,
          fontWeight: 750,
          color: "#334155",
        }}
      >
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          width: "100%",
          boxSizing: "border-box",
          height: 42,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          padding: "0 12px",
          outline: "none",
          fontSize: 13,
          color: "#172033",
          background: "#ffffff",
        }}
      />
    </div>
  );
}
