"use client";

import {
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type Company = {
  id: string;
  name: string;
};

type Driver = {
  id: string;
  full_name: string;
  driver_number: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
};

type Trailer = {
  id: string;
  company_id: string | null;
  unit_number: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trailer_type: string | null;
  status: string | null;
};

type Load = {
  id: string;
  company_id: string | null;
  load_number: string;
  broker_name: string | null;
  customer_name: string | null;
  origin_city: string | null;
  origin_state: string | null;
  pickup_address: string | null;
  destination_city: string | null;
  destination_state: string | null;
  delivery_address: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  miles: number | null;
  rate: number | null;
  status: string | null;
  driver_id: string | null;
  truck_id: string | null;
  trailer_id: string | null;
  created_at: string | null;
  pickup_count?: number;
  delivery_count?: number;
};

type StopType = "pickup" | "delivery";

type LoadStop = {
  stop_number: string;
  stop_order: number;
  stop_type: StopType;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  pickup_number: string;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string;
  scheduled_time: string;
};

const statusStyles: Record<
  string,
  {
    background: string;
    color: string;
    border: string;
  }
> = {
  available: {
    background: "#ecfdf5",
    color: "#047857",
    border: "#a7f3d0",
  },
  assigned: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
  },
  in_transit: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
  },
  delivered: {
    background: "#f5f3ff",
    color: "#6d28d9",
    border: "#ddd6fe",
  },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  border: "1px solid #dbe3ec",
  borderRadius: 9,
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
};

function createEmptyStop(
  stopOrder: number,
  stopType: StopType = "pickup"
): LoadStop {
  return {
    stop_number: `stop-${Date.now()}`,
    stop_order: stopOrder,
    stop_type: stopType,
    address: "",
    city: "",
    state: "",
    zip_code: "",
    pickup_number: "",
    latitude: null,
    longitude: null,
    scheduled_date: "",
    scheduled_time: "",
  };
}

/**
 * Convierte una fecha/hora escrita como hora local de Eastern Time
 * a ISO UTC respetando EST/EDT.
 *
 * Ejemplo:
 * 2026-10-10 + 09:30
 * se interpreta como 9:30 AM America/New_York.
 */
function easternDateTimeToISO(
  date: string,
  time: string
): string | null {
  if (!date) return null;

  const normalizedTime = time || "00:00";

  const naiveUTC = new Date(
    `${date}T${normalizedTime}:00Z`
  );

  if (Number.isNaN(naiveUTC.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }
  );

  const parts = formatter.formatToParts(naiveUTC);

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const easternAsUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  const offset = easternAsUTC - naiveUTC.getTime();

  return new Date(
    naiveUTC.getTime() - offset
  ).toISOString();
}

export default function LoadsPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    section: isES ? "OPERACIONES" : "OPERATIONS",
    title: isES ? "Cargas" : "Loads",
    subtitle: isES
      ? "Administra cargas, asignaciones, rutas y estados de las cargas."
      : "Manage freight, assignments, routes and load status.",
    createLoad: isES ? "Crear carga" : "Create Load",
    edit: isES ? "Editar" : "Edit",
    editLoadTitle: isES ? "Editar carga" : "Edit Load",
    saveChanges: isES ? "Guardar cambios" : "Save Changes",
    savingChanges: isES ? "Guardando cambios..." : "Saving changes...",
    loadUpdated: isES ? "Carga actualizada correctamente." : "Load updated successfully.",
    editBlocked: isES ? "Solo se pueden editar cargas que aún no están en tránsito ni entregadas. No se modificó el historial de paradas." : "Only loads not yet in transit or delivered can be edited. Stop history was not changed.",

    totalLoads: isES ? "Total de cargas" : "Total Loads",
    available: isES ? "Disponible" : "Available",
    assigned: isES ? "Asignada" : "Assigned",
    inTransit: isES ? "En tránsito" : "In Transit",
    delivered: isES ? "Entregada" : "Delivered",

    searchPlaceholder: isES
      ? "Buscar carga, broker, cliente, ruta, chofer, camión o remolque..."
      : "Search load, broker, customer, route, driver, truck or trailer...",
    allStatuses: isES ? "Todos los estados" : "All Statuses",
    clear: isES ? "Limpiar" : "Clear",

    loadBoard: isES ? "Tablero de cargas" : "Load Board",
    loadDisplayed: isES ? "carga mostrada" : "load displayed",
    loadsDisplayed: isES ? "cargas mostradas" : "loads displayed",
    loading: isES ? "Cargando cargas..." : "Loading loads...",
    noLoads: isES ? "No se encontraron cargas" : "No loads found",
    createOrAdjust: isES
      ? "Crea una carga o ajusta los filtros."
      : "Create a load or adjust your filters.",

    load: isES ? "Carga" : "Load",
    brokerCustomer: isES ? "Broker / Cliente" : "Broker / Customer",
    route: isES ? "Ruta" : "Route",
    dates: isES ? "Fechas" : "Dates",
    driver: isES ? "Chofer" : "Driver",
    truck: isES ? "Camión" : "Truck",
    trailer: isES ? "Remolque" : "Trailer",
    miles: isES ? "Millas" : "Miles",
    rate: isES ? "Tarifa" : "Rate",
    status: isES ? "Estado" : "Status",

    pickup: isES ? "Recogida" : "Pickup",
    delivery: isES ? "Entrega" : "Delivery",
    pickupStop: isES ? "Pickup" : "Pickup",
    deliveryStop: isES ? "Delivery" : "Delivery",
    noCustomer: isES ? "Sin cliente" : "No customer",
    unassigned: isES ? "Sin asignar" : "Unassigned",
    unknown: isES ? "Desconocido" : "Unknown",

    changeStatus: isES ? "Cambiar estado" : "Change Status",

    availableLabel: isES ? "Disponible" : "Available",
    availableDescription: isES
      ? "Lista para asignar"
      : "Ready to assign",

    assignedLabel: isES ? "Asignada" : "Assigned",
    assignedDescription: isES
      ? "Chofer asignado"
      : "Driver assigned",

    inTransitLabel: isES ? "En tránsito" : "In Transit",
    inTransitDescription: isES
      ? "Actualmente en movimiento"
      : "Currently moving",

    deliveredLabel: isES ? "Entregada" : "Delivered",
    deliveredDescription: isES
      ? "Carga completada"
      : "Load completed",

    createLoadTitle: isES ? "Crear carga" : "Create Load",
    createLoadDescription: isES
      ? "Crea la carga, construye su secuencia de paradas y asigna el equipo."
      : "Create the load, build its stop sequence and assign the equipment.",

    company: isES ? "Empresa" : "Company",
    selectCompany: isES ? "Seleccionar empresa" : "Select company",
    loadNumber: isES ? "Número de carga *" : "Load Number *",
    broker: isES ? "Broker" : "Broker",
    customer: isES ? "Cliente" : "Customer",

    routeStops: isES ? "Ruta y paradas" : "Route & Stops",
    routeStopsDescription: isES
      ? "Construye la ruta en secuencia. Cada parada es individual y puede ser Pickup o Delivery."
      : "Build the route in sequence. Each stop is individual and can be Pickup or Delivery.",

    stop: isES ? "Parada" : "Stop",
    stopType: isES ? "Tipo de parada" : "Stop Type",
    pickupAddress: isES ? "Dirección de Pickup" : "Pickup Address",
    deliveryAddress: isES
      ? "Dirección de Delivery"
      : "Delivery Address",
    address: isES ? "Dirección" : "Address",
    city: isES ? "Ciudad" : "City",
    state: isES ? "Estado" : "State",
    zipCode: isES ? "Código ZIP" : "ZIP Code",
    pickupNumber: "PU",
    date: isES ? "Fecha" : "Date",
    time: isES ? "Hora" : "Time",
    originCity: isES ? "Ciudad de origen *" : "Origin City *",
    originState: isES ? "Estado de origen" : "Origin State",
    destinationCity: isES
      ? "Ciudad de destino *"
      : "Destination City *",
    destinationState: isES
      ? "Estado de destino"
      : "Destination State",

    addStop: isES ? "Añadir parada" : "Add Stop",
    remove: isES ? "Eliminar" : "Remove",

    pickupDate: isES ? "Fecha de recogida" : "Pickup Date",
    pickupTime: isES ? "Hora de recogida" : "Pickup Time",
    deliveryDate: isES ? "Fecha de entrega" : "Delivery Date",
    deliveryTime: isES ? "Hora de entrega" : "Delivery Time",

    equipmentAssignment: isES
      ? "Asignación de equipo"
      : "Equipment Assignment",

    equipmentDescription: isES
      ? "Asigna chofer + camión + remolque a esta carga."
      : "Assign Driver + Truck + Trailer to this load.",

    initialStatus: isES ? "Estado inicial" : "Initial Status",
    cancel: isES ? "Cancelar" : "Cancel",
    creating: isES ? "Creando..." : "Creating...",

    loadCreated: isES
      ? "Carga creada correctamente."
      : "Load created successfully.",

    loadNumberRequired: isES
      ? "El número de carga es obligatorio."
      : "Load number is required.",

    stopsRequired: isES
      ? "Cada parada debe tener ciudad y estado."
      : "Every stop must have a city and state.",

    stopsCreatedError: isES
      ? "La carga fue creada, pero no se pudieron guardar sus paradas. La carga fue revertida."
      : "The load was created, but its stops could not be saved. The load was rolled back.",

    loadUpdatedTo: isES
      ? "actualizada a"
      : "updated to",

    loadFlow: isES ? "Flujo de carga" : "Load Flow",
    loadFlowText: isES
      ? "Disponible → Asignada → En tránsito → Entregada"
      : "Available → Assigned → In Transit → Delivered",

    assignment: isES ? "Asignación" : "Assignment",
    assignmentText: isES
      ? "Cada carga puede conectarse a un chofer, camión y remolque."
      : "Each load can be connected to a driver, truck and trailer.",

    operations: isES ? "Operaciones" : "Operations",
    operationsText: isES
      ? "Las cargas creadas desde Operaciones y Cargas utilizan el mismo registro."
      : "Loads created from Operations and Loads use the same load record.",
  };

 

const STATUS_OPTIONS = [
  {
    value: "pending_review",
    label: isES ? "Pendiente de revisión" : "Pending Review",
    description: isES
      ? "Pendiente de validar y liberar a Dispatch."
      : "Awaiting validation and release to Dispatch.",
  },
  {
    value: "available",
    label: text.availableLabel,
    description: text.availableDescription,
  },
  {
    value: "assigned",
    label: text.assignedLabel,
    description: text.assignedDescription,
  },
  {
    value: "in_transit",
    label: text.inTransitLabel,
    description: text.inTransitDescription,
  },
  {
    value: "delivered",
    label: text.deliveredLabel,
    description: text.deliveredDescription,
  },
];


  const [loads, setLoads] = useState<Load[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [openStatusMenu, setOpenStatusMenu] =
    useState<string | null>(null);

  const [statusMenuPosition, setStatusMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    company_id: "",
    load_number: "",
    broker_name: "",
    customer_name: "",
    miles: "",
    rate: "",
    status: "pending_review",
    driver_id: "",
    truck_id: "",
    trailer_id: "",
  });

  const [stops, setStops] = useState<LoadStop[]>([
    createEmptyStop(1, "pickup"),
    createEmptyStop(2, "delivery"),
  ]);

  
async function loadData() {
  setLoading(true);
  setErrorMessage("");

  const [
    loadsResult,
    stopsResult,
    companiesResult,
    driversResult,
    trucksResult,
    trailersResult,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select(`
        id,
        company_id,
        load_number,
        broker_name,
        customer_name,
        origin_city,
        origin_state,
        pickup_address,
        destination_city,
        destination_state,
        delivery_address,
        pickup_date,
        delivery_date,
        miles,
        rate,
        status,
        driver_id,
        truck_id,
        trailer_id,
        created_at
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("load_stops")
      .select("load_id, stop_type"),

    supabase
      .from("companies")
      .select("id, name")
      .order("name"),

    supabase
      .from("drivers")
      .select("id, full_name, driver_number")
      .order("full_name"),

    supabase
      .from("trucks")
      .select("id, unit_number, make, model")
      .order("unit_number"),

    supabase
      .from("trailers")
      .select(
        "id, company_id, unit_number, year, make, model, trailer_type, status"
      )
      .order("unit_number"),
  ]);

  if (loadsResult.error) {
    setErrorMessage(loadsResult.error.message);
    setLoads([]);
  } else if (stopsResult.error) {
    setErrorMessage(stopsResult.error.message);
    setLoads((loadsResult.data ?? []) as Load[]);
  } else {
    const stopCounts = new Map<
      string,
      { pickups: number; deliveries: number }
    >();

    for (const load of loadsResult.data ?? []) {
      stopCounts.set(load.id, {
        pickups: 0,
        deliveries: 0,
      });
    }

    for (const stop of stopsResult.data ?? []) {
      const counts = stopCounts.get(stop.load_id);

      if (!counts) continue;

      const stopType = String(stop.stop_type ?? "")
        .trim()
        .toLowerCase();

      if (stopType === "pickup") {
        counts.pickups += 1;
      } else if (stopType === "delivery") {
        counts.deliveries += 1;
      }
    }

    setLoads(
      (loadsResult.data ?? []).map((load) => {
        const counts = stopCounts.get(load.id);

        return {
          ...load,
          pickup_count: counts?.pickups ?? 0,
          delivery_count: counts?.deliveries ?? 0,
        };
      }) as Load[]
    );
  }

  if (!companiesResult.error) {
    setCompanies((companiesResult.data ?? []) as Company[]);
  }

  if (!driversResult.error) {
    setDrivers((driversResult.data ?? []) as Driver[]);
  }

  if (!trucksResult.error) {
    setTrucks((trucksResult.data ?? []) as Truck[]);
  }

  if (!trailersResult.error) {
    setTrailers((trailersResult.data ?? []) as Trailer[]);
  }

  setLoading(false);
}


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!openStatusMenu) return;

    const closeMenu = () => {
      setOpenStatusMenu(null);
    };

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openStatusMenu]);

  useEffect(() => {
    function handleOutsideClick(event: globalThis.MouseEvent) {
      const target = event.target as Node;

      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(target)
      ) {
        setOpenStatusMenu(null);
      }
    }

    if (openStatusMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [openStatusMenu]);

  const filteredLoads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return loads.filter((load) => {
      const driver = drivers.find(
        (item) => item.id === load.driver_id
      );

      const truck = trucks.find(
        (item) => item.id === load.truck_id
      );

      const trailer = trailers.find(
        (item) => item.id === load.trailer_id
      );

      const driverName = driver?.full_name ?? "";
      const truckName = truck?.unit_number ?? "";
      const trailerName = trailer?.unit_number ?? "";

      const matchesSearch =
        !term ||
        [
          load.load_number,
          load.broker_name,
          load.customer_name,
          load.origin_city,
          load.origin_state,
          load.destination_city,
          load.destination_state,
          load.pickup_address,
          load.delivery_address,
          driverName,
          truckName,
          trailerName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(term)
          );

      const matchesStatus =
        statusFilter === "all" ||
        load.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    loads,
    drivers,
    trucks,
    trailers,
    search,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: loads.length,
      available: loads.filter(
        (load) => load.status === "available"
      ).length,
      assigned: loads.filter(
        (load) => load.status === "assigned"
      ).length,
      inTransit: loads.filter(
        (load) => load.status === "in_transit"
      ).length,
      delivered: loads.filter(
        (load) => load.status === "delivered"
      ).length,
    };
  }, [loads]);

  function resetForm() {
    setForm({
      company_id: companies[0]?.id ?? "",
      load_number: "",
      broker_name: "",
      customer_name: "",
      miles: "",
      rate: "",
      status: "pending_review",
      driver_id: "",
      truck_id: "",
      trailer_id: "",
    });

    setStops([
      createEmptyStop(1, "pickup"),
      createEmptyStop(2, "delivery"),
    ]);
  }

  function openCreateForm() {
    setEditingLoadId(null);
    resetForm();
    setMessage("");
    setErrorMessage("");
    setShowForm(true);
  }

  async function openEditForm(load: Load) {
    setMessage("");
    setErrorMessage("");
    setOpenStatusMenu(null);

    if (load.status === "in_transit" || load.status === "delivered") {
      setErrorMessage(text.editBlocked);
      return;
    }

    const { data: stopRows, error: stopError } = await supabase
      .from("load_stops")
      .select("id, stop_order, stop_type, address, city, state, zip_code, pickup_number, latitude, longitude, scheduled_date, scheduled_time, status")
      .eq("load_id", load.id)
      .order("stop_order", { ascending: true });

    if (stopError) {
      setErrorMessage(stopError.message);
      return;
    }

    const rows = stopRows ?? [];
    if (rows.some((stop: any) => stop.status && stop.status !== "pending")) {
      setErrorMessage(text.editBlocked);
      return;
    }

    setEditingLoadId(load.id);
    setForm({
      company_id: load.company_id ?? "",
      load_number: load.load_number ?? "",
      broker_name: load.broker_name ?? "",
      customer_name: load.customer_name ?? "",
      miles: load.miles == null ? "" : String(load.miles),
      rate: load.rate == null ? "" : String(load.rate),
      status: load.status ?? "pending_review",
      driver_id: load.driver_id ?? "",
      truck_id: load.truck_id ?? "",
      trailer_id: load.trailer_id ?? "",
    });

    setStops(rows.length ? rows.map((stop: any) => ({
      stop_number: String(stop.id),
      stop_order: Number(stop.stop_order),
      stop_type: stop.stop_type as StopType,
      address: stop.address ?? "",
      city: stop.city ?? "",
      state: stop.state ?? "",
      zip_code: stop.zip_code ?? "",
      pickup_number: stop.pickup_number ?? "",
      latitude: stop.latitude == null ? null : Number(stop.latitude),
      longitude: stop.longitude == null ? null : Number(stop.longitude),
      scheduled_date: stop.scheduled_date ?? "",
      scheduled_time: stop.scheduled_time ?? "",
    })) : [createEmptyStop(1, "pickup"), createEmptyStop(2, "delivery")]);
    setShowForm(true);
  }

  function closeCreateForm() {
    if (!saving) {
      setShowForm(false);
    }
  }

  function updateStop(
    index: number,
    field: keyof LoadStop,
    value: string
  ) {
    setStops((current) =>
      current.map((stop, stopIndex) =>
        stopIndex === index
          ? {
              ...stop,
              [field]:
                field === "stop_type"
                  ? (value as StopType)
                  : value,
            }
          : stop
      )
    );
  }

  
   function addStop(stopType: StopType) {
  setStops((current) => [
    ...current,
    createEmptyStop(current.length + 1, stopType),
  ]);
}

  function removeStop(index: number) {
    setStops((current) => {
      if (
        index === 0 ||
        index === current.length - 1
      ) {
        return current;
      }

      return current
        .filter((_, stopIndex) => stopIndex !== index)
        .map((stop, stopIndex) => ({
          ...stop,
          stop_order: stopIndex + 1,
        }));
    });
  }

  async function handleCreateLoad(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!form.load_number.trim()) {
      setErrorMessage(text.loadNumberRequired);
      return;
    }

    if (stops.length < 2) {
      setErrorMessage(text.stopsRequired);
      return;
    }

    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];

    const invalidStop = stops.some(
      (stop) =>
        !stop.city.trim() ||
        !stop.state.trim()
    );

    if (invalidStop) {
      setErrorMessage(text.stopsRequired);
      return;
    }

    setSaving(true);

    try {
      const pickupDateTime = easternDateTimeToISO(
        firstStop.scheduled_date,
        firstStop.scheduled_time
      );

      const deliveryDateTime = easternDateTimeToISO(
        lastStop.scheduled_date,
        lastStop.scheduled_time
      );

   const geocodedStops: LoadStop[] = [];

for (const stop of stops) {
  const address = stop.address.trim();
  const city = stop.city.trim();
  const state = stop.state.trim();

  if (!address || !city || !state) {
    setErrorMessage(
      isES
        ? `Falta la dirección de la parada ${stop.stop_order}.`
        : `Address information is missing for stop ${stop.stop_order}.`
    );
    return;
  }

  try {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        city,
        state,
        zip_code: stop.zip_code?.trim() || "",
      }),
    });

    const result = await response.json();

    if (
      !response.ok ||
      !Number.isFinite(Number(result.latitude)) ||
      !Number.isFinite(Number(result.longitude))
    ) {
      setErrorMessage(
        isES
          ? `No se pudo localizar la parada ${stop.stop_order}: ${address}, ${city}, ${state}.`
          : `Could not locate stop ${stop.stop_order}: ${address}, ${city}, ${state}.`
      );
      return;
    }

    geocodedStops.push({
      ...stop,
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
    });
  } catch (error) {
    console.error("GEOCODING STOP ERROR:", stop.stop_order, error);
    setErrorMessage(
      isES
        ? `No se pudo localizar la parada ${stop.stop_order}.`
        : `Could not locate stop ${stop.stop_order}.`
    );
    return;
  }
}

const orderedStops = [...geocodedStops].sort((a, b) => {
  const typeA = a.stop_type.trim().toLowerCase();
  const typeB = b.stop_type.trim().toLowerCase();

  const groupA = typeA === "pickup" ? 0 : 1;
  const groupB = typeB === "pickup" ? 0 : 1;

  if (groupA !== groupB) {
    return groupA - groupB;
  }

  const dateA =
    `${a.scheduled_date || "9999-12-31"}T${a.scheduled_time || "23:59"}`;

  const dateB =
    `${b.scheduled_date || "9999-12-31"}T${b.scheduled_time || "23:59"}`;

  return dateA.localeCompare(dateB);
});

      const loadPayload = {
            company_id: form.company_id || null,
            load_number: form.load_number.trim(),
            broker_name:
              form.broker_name.trim() || null,
            customer_name:
              form.customer_name.trim() || null,

            pickup_address:
              firstStop.address.trim() || null,

            origin_city:
              firstStop.city.trim(),

            origin_state:
              firstStop.state.trim(),

            delivery_address:
              lastStop.address.trim() || null,

            destination_city:
              lastStop.city.trim(),

            destination_state:
              lastStop.state.trim(),

            pickup_date: pickupDateTime,
            delivery_date: deliveryDateTime,

            miles: form.miles
              ? Number(form.miles)
              : null,

            rate: form.rate
              ? Number(form.rate)
              : null,

            status: editingLoadId ? form.status : "pending_review",
            driver_id: form.driver_id || null,
            truck_id: form.truck_id || null,
            trailer_id: form.trailer_id || null,
      };

      if (editingLoadId) {
        const { error: updateError } = await supabase
          .from("loads")
          .update(loadPayload)
          .eq("id", editingLoadId);
        if (updateError) throw new Error(updateError.message);

     const { data: currentRows, error: currentRowsError } =
  await supabase
    .from("load_stops")
    .select("id, status, stop_order")
    .eq("load_id", editingLoadId);

if (currentRowsError) {
  throw new Error(currentRowsError.message);
}

if (
  (currentRows ?? []).some(
    (row: any) =>
      row.status && row.status !== "pending"
  )
) {
  throw new Error(text.editBlocked);
}
        const retainedIds = new Set(stops.filter(stop => stop.stop_number && !stop.stop_number.startsWith("stop-")).map(stop => stop.stop_number));
        const removedIds = (currentRows ?? []).filter((row: any) => !retainedIds.has(String(row.id))).map((row: any) => row.id);
       if (removedIds.length) {
  const { error: deleteError } = await supabase
    .from("load_stops")
    .delete()
    .eq("load_id", editingLoadId)
    .in("id", removedIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

const retainedStops = geocodedStops.filter(
  (stop) =>
    stop.stop_number &&
    !stop.stop_number.startsWith("stop-")
);

const maxStopOrder = Math.max(
  0,
  ...(currentRows ?? []).map(
    (row: any) => Number(row.stop_order) || 0
  )
);

for (let index = 0; index < retainedStops.length; index++) {
  const stop = retainedStops[index];

  const { error: tempOrderError } = await supabase
    .from("load_stops")
    .update({
      stop_order: maxStopOrder + 1000 + index,
    })
    .eq("id", stop.stop_number)
    .eq("load_id", editingLoadId);

  if (tempOrderError) {
    throw new Error(tempOrderError.message);
  }
}

        const orderedStops = [...geocodedStops].sort((a, b) => {
  const dateTimeA = `${a.scheduled_date || "9999-12-31"}T${a.scheduled_time || "23:59"}`;
  const dateTimeB = `${b.scheduled_date || "9999-12-31"}T${b.scheduled_time || "23:59"}`;

  return dateTimeA.localeCompare(dateTimeB);
});

for (let index = 0; index < orderedStops.length; index++) {
  const stop = orderedStops[index];

  const payload = {
    load_id: editingLoadId,
    stop_order: index + 1,
    stop_type: stop.stop_type,
    address: stop.address.trim() || null,
    city: stop.city.trim(),
    state: stop.state.trim(),
    zip_code: stop.zip_code.trim() || null,
    pickup_number:
      stop.stop_type.trim().toLowerCase() === "pickup"
        ? stop.pickup_number.trim() || null
        : null,
    latitude: stop.latitude,
    longitude: stop.longitude,
    scheduled_date: stop.scheduled_date || null,
    scheduled_time: stop.scheduled_time || null,
  };
          if (stop.stop_number && !stop.stop_number.startsWith("stop-")) {
            const { error: stopUpdateError } = await supabase.from("load_stops").update(payload).eq("id", stop.stop_number).eq("load_id", editingLoadId);
            if (stopUpdateError) throw new Error(stopUpdateError.message);
          } else {
            const { error: stopInsertError } = await supabase.from("load_stops").insert({ ...payload, status: "pending" });
            if (stopInsertError) throw new Error(stopInsertError.message);
          }
        }
      } else {
      
const { data: createdLoad, error: createError } = await supabase
  .from("loads")
  .insert(loadPayload)
  .select("id, load_number, status")
  .single();

console.log("[LOAD CREATE RESULT]", {
  requestedStatus: loadPayload.status,
  savedId: createdLoad?.id,
  savedLoadNumber: createdLoad?.load_number,
  savedStatus: createdLoad?.status,
  createError: createError?.message ?? null,
});
if (createError || !createdLoad) {
 setErrorMessage(
  createError?.message ??
    (isES ? "No se pudo crear la carga." : "Failed to create load.")
);
  setSaving(false);
  return;
}

const orderedStopsForNewLoad = [...geocodedStops].sort((a, b) => {
  const typeA = a.stop_type.trim().toLowerCase();
  const typeB = b.stop_type.trim().toLowerCase();

  const groupA = typeA === "pickup" ? 0 : 1;
  const groupB = typeB === "pickup" ? 0 : 1;

  if (groupA !== groupB) {
    return groupA - groupB;
  }

  const dateTimeA =
    `${a.scheduled_date || "9999-12-31"}T${a.scheduled_time || "23:59"}`;
  const dateTimeB =
    `${b.scheduled_date || "9999-12-31"}T${b.scheduled_time || "23:59"}`;

  return dateTimeA.localeCompare(dateTimeB);
});

const loadStops = orderedStopsForNewLoad.map((stop, index) => ({
  load_id: createdLoad.id,
  stop_order: index + 1,
  stop_type: stop.stop_type,
  address: stop.address.trim() || null,
  city: stop.city.trim(),
  state: stop.state.trim(),
  zip_code: stop.zip_code.trim() || null,
  pickup_number:
    stop.stop_type.trim().toLowerCase() === "pickup"
      ? stop.pickup_number.trim() || null
      : null,
  latitude: stop.latitude,
  longitude: stop.longitude,
  scheduled_date: stop.scheduled_date || null,
  scheduled_time: stop.scheduled_time || null,
  status: "pending",
}));

        const {
  data: insertedStops,
  error: stopsError,
} = await supabase
  .from("load_stops")
  .insert(loadStops)
  .select("id, load_id, stop_order, stop_type");

if (
  stopsError ||
  !insertedStops ||
  insertedStops.length !== loadStops.length
) {
  await supabase
    .from("loads")
    .delete()
    .eq("id", createdLoad.id);

  throw new Error(
    stopsError?.message ?? "The load stops could not be saved."
  );
}      }

      setMessage(
        isES
          ? "Carga guardada correctamente."
          : "Load saved successfully."
      );

     setShowForm(false);
      setEditingLoadId(null);
      await loadData();
    } catch (error) {
      console.error("SAVE LOAD ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : isES
            ? "No se pudo guardar la carga."
            : "Failed to save load."
      );
    } finally {
      setSaving(false);
    }
  }



async function updateLoadStatus(
  load: Load,
  newStatus: string
) {
  setMessage("");
  setErrorMessage("");
  setOpenStatusMenu(null);

  if (load.status === "pending_review") {
    setErrorMessage(
      isES
        ? "Esta carga debe liberarse a Dispatch mediante la acción de liberación."
        : "This load must be released to Dispatch using the release action."
    );
    return;
  }

  const { error } = await supabase
    .from("loads")
    .update({ status: newStatus })
    .eq("id", load.id);

  if (error) {
    setErrorMessage(
      isES
        ? `No se pudo actualizar la carga: ${error.message}`
        : `Could not update the load: ${error.message}`
    );
    return;
  }

  setLoads((current) =>
    current.map((item) =>
      item.id === load.id
        ? {
            ...item,
            status: newStatus,
          }
        : item
    )
  );

  setMessage(
    `${isES ? "Carga" : "Load"} ${load.load_number} ${
      text.loadUpdatedTo
    } ${statusLabel(newStatus)}.`
  );
}




async function releaseLoadToDispatch(load: Load) {
  setMessage("");
  setErrorMessage("");
  setOpenStatusMenu(null);

  if (load.status !== "pending_review") {
    setErrorMessage(
      isES
        ? "Solo se pueden liberar cargas pendientes de revisión."
        : "Only loads pending review can be released."
    );
    return;
  }

  const { data: stops, error: stopsError } = await supabase
    .from("load_stops")
    .select(
      "stop_order, stop_type, address, city, state, latitude, longitude, scheduled_date, scheduled_time"
    )
    .eq("load_id", load.id)
    .order("stop_order", { ascending: true });

  if (stopsError) {
    setErrorMessage(
      isES
        ? `No se pudieron verificar las paradas: ${stopsError.message}`
        : `Could not verify stops: ${stopsError.message}`
    );
    return;
  }

  if (
    !stops ||
    stops.length < 2 ||
    stops.some(
      (stop) =>
        !stop.address?.trim() ||
        !stop.city?.trim() ||
        !stop.state?.trim() ||
        stop.latitude == null ||
        stop.longitude == null
    ) ||
    !stops.some((stop) => stop.stop_type === "pickup") ||
    !stops.some((stop) => stop.stop_type === "delivery")
  ) {
    setErrorMessage(
      isES
        ? "No se puede liberar: verifica las paradas, direcciones y coordenadas."
        : "Cannot release: verify stops, addresses, and coordinates."
    );
    return;
  }

  const { data, error } = await supabase
    .from("loads")
    .update({ status: "available" })
    .eq("id", load.id)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) {
    setErrorMessage(
      isES
        ? `No se pudo liberar la carga: ${error.message}`
        : `Could not release the load: ${error.message}`
    );
    return;
  }

  if (!data) {
    setErrorMessage(
      isES
        ? "La carga ya cambió de estado. Actualiza la lista e inténtalo de nuevo."
        : "The load status has changed. Refresh the list and try again."
    );
    await loadData();
    return;
  }

  setLoads((current) =>
    current.map((item) =>
      item.id === load.id
        ? { ...item, status: "available" }
        : item
    )
  );

  setMessage(
    isES
      ? `Carga ${load.load_number} liberada a Dispatch.`
      : `Load ${load.load_number} released to Dispatch.`
  );
}




  function toggleStatusMenu(
    loadId: string,
    event: MouseEvent<HTMLButtonElement>
  ) {
    if (openStatusMenu === loadId) {
      setOpenStatusMenu(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 170;
    const menuHeight = 190;
    const gap = 6;
    const screenPadding = 10;

    const spaceBelow =
      window.innerHeight - buttonRect.bottom;

    const spaceAbove = buttonRect.top;

    const shouldOpenUp =
      spaceBelow < menuHeight + gap &&
      spaceAbove >= menuHeight + gap;

    let top: number;

    if (shouldOpenUp) {
      top =
        buttonRect.top -
        menuHeight -
        gap;
    } else {
      top = buttonRect.bottom + gap;
    }

    let left =
      buttonRect.right - menuWidth;

    if (left < screenPadding) {
      left = screenPadding;
    }

    if (
      left + menuWidth >
      window.innerWidth - screenPadding
    ) {
      left =
        window.innerWidth -
        menuWidth -
        screenPadding;
    }

    if (top < screenPadding) {
      top = screenPadding;
    }

    if (
      top + menuHeight >
      window.innerHeight - screenPadding
    ) {
      top =
        window.innerHeight -
        menuHeight -
        screenPadding;
    }

    setStatusMenuPosition({
      top,
      left,
    });

    setOpenStatusMenu(loadId);
  }

  function companyName(companyId: string | null) {
    if (!companyId) return "—";

    return (
      companies.find(
        (company) => company.id === companyId
      )?.name ?? "—"
    );
  }

  function driverName(driverId: string | null) {
    if (!driverId) return text.unassigned;

    const driver = drivers.find(
      (item) => item.id === driverId
    );

    if (!driver) return text.unknown;

    return driver.driver_number
      ? `${driver.full_name} · ${driver.driver_number}`
      : driver.full_name;
  }

  function truckName(truckId: string | null) {
    if (!truckId) return text.unassigned;

    const truck = trucks.find(
      (item) => item.id === truckId
    );

    if (!truck) return text.unknown;

    const details = [
      truck.make,
      truck.model,
    ]
      .filter(Boolean)
      .join(" ");

    return details
      ? `${truck.unit_number} · ${details}`
      : truck.unit_number;
  }

  function trailerName(trailerId: string | null) {
    if (!trailerId) return text.unassigned;

    const trailer = trailers.find(
      (item) => item.id === trailerId
    );

    if (!trailer) return text.unknown;

    const details = [
      trailer.year,
      trailer.make,
      trailer.model,
    ]
      .filter(Boolean)
      .join(" ");

    return details
      ? `${trailer.unit_number} · ${details}`
      : trailer.unit_number;
  }

  function statusLabel(status: string | null) {
    return (
      STATUS_OPTIONS.find(
        (option) => option.value === status
      )?.label ??
      status ??
      text.unknown
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      isES ? "es-US" : "en-US",
      {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function formatTime(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString(
      "en-US",
      {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    );
  }

  function formatCurrency(value: number | null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      isES ? "es-US" : "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }
    ).format(value);
  }

  function formatNumber(value: number | null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      isES ? "es-US" : "en-US"
    ).format(value);
  }

  const activeStatusLoad = openStatusMenu
    ? loads.find(
        (load) => load.id === openStatusMenu
      ) ?? null
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "28px 30px 50px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1700,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.2,
                color: "#64748b",
                marginBottom: 7,
              }}
            >
              {text.section}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: -0.6,
              }}
            >
              {text.title}
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              {text.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              height: 42,
              padding: "0 18px",
              border: "none",
              borderRadius: 9,
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + {text.createLoad}
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 9,
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 9,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard
            label={text.totalLoads}
            value={stats.total}
          />

          <StatCard
            label={text.available}
            value={stats.available}
            accent="#047857"
          />

          <StatCard
            label={text.assigned}
            value={stats.assigned}
            accent="#1d4ed8"
          />

          <StatCard
            label={text.inTransit}
            value={stats.inTransit}
            accent="#c2410c"
          />

          <StatCard
            label={text.delivered}
            value={stats.delivered}
            accent="#6d28d9"
          />
        </div>

        {/* FILTERS */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 320px",
              }}
            >
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  text.searchPlaceholder
                }
                style={{
                  ...inputStyle,
                  height: 44,
                }}
              />
            </div>

            <div style={{ minWidth: 180 }}>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  height: 44,
                  cursor: "pointer",
                }}
              >
                <option value="all">
                  {text.allStatuses}
                </option>

                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              style={{
                height: 44,
                padding: "0 15px",
                border:
                  "1px solid #dbe3ec",
                borderRadius: 9,
                background: "#ffffff",
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {text.clear}
            </button>
          </div>
        </section>

        {/* LOAD BOARD */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "17px 18px",
              borderBottom:
                "1px solid #e5e7eb",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 15,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                {text.loadBoard}
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {filteredLoads.length}{" "}
                {filteredLoads.length === 1
                  ? text.loadDisplayed
                  : text.loadsDisplayed}
              </div>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: 50,
                textAlign: "center",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              {text.loading}
            </div>
          ) : filteredLoads.length === 0 ? (
            <div
              style={{
                padding: 55,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 7,
                }}
              >
                {text.noLoads}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {text.createOrAdjust}
              </div>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 1630,
                  borderCollapse:
                    "collapse",
                }}
              >
               <thead>
  <tr
    style={{
      background: "#f8fafc",
    }}
  >
    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.load}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.brokerCustomer}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.route}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.dates}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.driver}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.truck}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.trailer}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.miles}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.rate}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {text.status}
    </th>

    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {isES ? "Acciones" : "Actions"}
    </th>
  </tr>
</thead>

                
<tbody>
  {filteredLoads.map((load) => {
    const style =
      statusStyles[load.status ?? "available"] ??
      statusStyles.available;

    const cellStyle = {
      ...tdStyle,
      whiteSpace: "nowrap" as const,
      paddingTop: 8,
      paddingBottom: 8,
      verticalAlign: "middle" as const,
    };

    const innerTextStyle = {
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: 220,
    };

    return (
      <tr
        key={load.id}
        style={{
          borderTop: "1px solid #eef2f7",
          height: 56,
        }}
      >
        <td style={cellStyle}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>
            {`(${load.pickup_count ?? 0}-${load.delivery_count ?? 0})`}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "#94a3b8",
              ...innerTextStyle,
            }}
          >
            {companyName(load.company_id)}
          </div>
        </td>

        <td style={cellStyle}>
          <div style={{ fontWeight: 700, ...innerTextStyle }}>
            {load.broker_name || "—"}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "#64748b",
              ...innerTextStyle,
            }}
          >
            {load.customer_name || text.noCustomer}
          </div>
        </td>

        <td style={cellStyle}>
          <div style={{ fontWeight: 700, ...innerTextStyle }}>
            {load.origin_city || "—"}
            {load.origin_state ? `, ${load.origin_state}` : ""}
          </div>
          <div style={{ margin: "3px 0", color: "#94a3b8" }}>↓</div>
          <div style={{ fontWeight: 700, ...innerTextStyle }}>
            {load.destination_city || "—"}
            {load.destination_state ? `, ${load.destination_state}` : ""}
          </div>
        </td>

        <td style={cellStyle}>
          <div style={{ whiteSpace: "nowrap" }}>
            <span style={{ color: "#94a3b8", fontSize: 11 }}>
              {text.pickup}
            </span>{" "}
            <strong>
              {formatDate(load.pickup_date)}
              {load.pickup_date
                ? ` · ${formatTime(load.pickup_date)} ET`
                : ""}
            </strong>
          </div>
          <div style={{ marginTop: 5, whiteSpace: "nowrap" }}>
            <span style={{ color: "#94a3b8", fontSize: 11 }}>
              {text.delivery}
            </span>{" "}
            <strong>
              {formatDate(load.delivery_date)}
              {load.delivery_date
                ? ` · ${formatTime(load.delivery_date)} ET`
                : ""}
            </strong>
          </div>
        </td>

        <td style={cellStyle}>
          <div style={{ fontWeight: 700, ...innerTextStyle }}>
            {driverName(load.driver_id)}
          </div>
        </td>

        <td style={cellStyle}>
          <div style={{ fontWeight: 700, ...innerTextStyle }}>
            {truckName(load.truck_id)}
          </div>
        </td>

        <td style={cellStyle}>
          <div style={{ fontWeight: 700, ...innerTextStyle }}>
            {trailerName(load.trailer_id)}
          </div>
        </td>

        <td style={cellStyle}>
          <strong>{formatNumber(load.miles)}</strong>
        </td>

        <td style={cellStyle}>
          <strong>{formatCurrency(load.rate)}</strong>
        </td>

        <td style={cellStyle}>
          <button
            type="button"
            onClick={(event) => toggleStatusMenu(load.id, event)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              minWidth: 125,
              justifyContent: "space-between",
              padding: "7px 10px",
              borderRadius: 999,
              border: `1px solid ${style.border}`,
              background: style.background,
              color: style.color,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>{statusLabel(load.status)}</span>
            <span style={{ fontSize: 10 }}>▾</span>
          </button>
        </td>

        <td style={cellStyle}>
          <button
            type="button"
            onClick={() => openEditForm(load)}
            style={{
              height: 34,
              padding: "0 12px",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {text.edit}
          </button>
        </td>
      </tr>
    );
  })}
</tbody>

              </table>
            </div>
          )}
        </section>

        
{activeStatusLoad?.status === "pending_review" && (
  <button
    type="button"
    onClick={() => {
      if (!activeStatusLoad) return;
      void releaseLoadToDispatch(activeStatusLoad);
    }}
    style={{
      width: "100%",
      marginTop: 6,
      padding: "10px 8px",
      border: "none",
      borderRadius: 8,
      background: "#0f766e",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      textAlign: "center",
    }}
  >
    {isES ? "Liberar a Dispatch" : "Release to Dispatch"}
  </button>
)}


        

        {/* CREATE LOAD MODAL */}
        {showForm && (
          <div
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeCreateForm();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(15, 23, 42, 0.42)",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding: 20,
              zIndex: 5000,
            }}
          >
            <div
              style={{
                width:
                  "min(1100px, 100%)",
                maxHeight: "92vh",
                overflowY:
                  "auto",
                background:
                  "#ffffff",
                borderRadius: 16,
                boxShadow:
                  "0 25px 70px rgba(15, 23, 42, 0.25)",
              }}
            >
              <div
                style={{
                  padding:
                    "20px 22px",
                  borderBottom:
                    "1px solid #e5e7eb",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 15,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 19,
                      fontWeight: 800,
                    }}
                  >
                    {
                      text.createLoadTitle
                    }
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 12,
                      color:
                        "#64748b",
                    }}
                  >
                    {
                      text.createLoadDescription
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCreateForm
                  }
                  disabled={
                    saving
                  }
                  style={{
                    width: 34,
                    height: 34,
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: 8,
                    background:
                      "#ffffff",
                    color:
                      "#64748b",
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 18,
                  }}
                >
                  
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleCreateLoad
                }
              >
                <div
                  style={{
                    padding: 22,
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: 18,
                  }}
                >
                  {/* BASIC LOAD INFORMATION */}
                  <Field
                    label={text.company}
                  >
                    <select
                      value={
                        form.company_id
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            company_id:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      style={
                        inputStyle
                      }
                    >
                      <option value="">
                        {
                          text.selectCompany
                        }
                      </option>

                      {companies.map(
                        (company) => (
                          <option
                            key={
                              company.id
                            }
                            value={
                              company.id
                            }
                          >
                            {
                              company.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field
                    label={
                      text.loadNumber
                    }
                  >
                    <input
                      value={
                        form.load_number
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            load_number:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="PL-1001"
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label={text.broker}
                  >
                    <input
                      value={
                        form.broker_name
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            broker_name:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder={
                        isES
                          ? "Nombre del broker"
                          : "Broker name"
                      }
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label={
                      text.customer
                    }
                  >
                    <input
                      value={
                        form.customer_name
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            customer_name:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder={
                        isES
                          ? "Nombre del cliente"
                          : "Customer name"
                      }
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  {/* ROUTE & STOPS */}
                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                      border:
                        "1px solid #dbe3ec",
                      borderRadius:
                        14,
                      background:
                        "#f8fafc",
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: 15,
                        marginBottom: 15,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight:
                              800,
                            color:
                              "#0f172a",
                          }}
                        >
                          {
                            text.routeStops
                          }
                        </h3>

                        <p
                          style={{
                            margin:
                              "5px 0 0",
                            fontSize: 11,
                            lineHeight:
                              1.5,
                            color:
                              "#64748b",
                          }}
                        >
                          {
                            text.routeStopsDescription
                          }
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: 12,
                      }}
                    >
                      {stops.map(
                        (
                          stop,
                          index
                        ) => {
                          const isFirst =
                            index === 0;

                          const isLast =
                            index ===
                            stops.length - 1;

                          const isPickup =
                            stop.stop_type ===
                            "pickup";

                          return (
                            <div
                              key={
                                `${stop.stop_order}-${index}`
                              }
                              style={{
                                border:
                                  "1px solid #e2e8f0",
                                borderRadius:
                                  12,
                                background:
                                  "#ffffff",
                                padding:
                                  14,
                              }}
                            >
                              {/* STOP HEADER */}
                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap: 12,
                                  marginBottom:
                                    12,
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap: 10,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 30,
                                      height: 30,
                                      display:
                                        "inline-flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      borderRadius:
                                        "50%",
                                      background:
                                        isPickup
                                          ? "#dbeafe"
                                          : "#d1fae5",
                                      color:
                                        isPickup
                                          ? "#1d4ed8"
                                          : "#047857",
                                      fontSize:
                                        11,
                                      fontWeight:
                                        800,
                                    }}
                                  >
                                    {index +
                                      1}
                                  </span>

                                  <div>
                                    <div
                                      style={{
                                        fontSize:
                                          13,
                                        fontWeight:
                                          800,
                                        color:
                                          "#0f172a",
                                      }}
                                    >
                                      {
                                        text.stop
                                      }{" "}
                                      {index +
                                        1}
                                    </div>

                                    <div
                                      style={{
                                        marginTop:
                                          2,
                                        fontSize:
                                          10,
                                        fontWeight:
                                          700,
                                        color:
                                          isPickup
                                            ? "#1d4ed8"
                                            : "#047857",
                                      }}
                                    >
                                      {isPickup
                                        ? text.pickupStop
                                        : text.deliveryStop}
                                    </div>
                                  </div>
                                </div>

                                {!isFirst &&
                                  !isLast && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeStop(
                                          index
                                        )
                                      }
                                      disabled={
                                        saving
                                      }
                                      style={{
                                        border:
                                          "none",
                                        background:
                                          "transparent",
                                        color:
                                          "#dc2626",
                                        fontSize:
                                          11,
                                        fontWeight:
                                          700,
                                        cursor:
                                          saving
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    >
                                      {
                                        text.remove
                                      }
                                    </button>
                                  )}
                              </div>

                              {/* INDIVIDUAL STOP */}
                              <div
                                style={{
                                  display:
                                    "grid",
                                  gridTemplateColumns:
                                    "1.1fr 2fr 1.25fr 0.75fr 0.9fr 0.9fr",
                                  gap: 10,
                                  alignItems:
                                    "end",
                                }}
                              >
                                {/* STOP TYPE */}
                                <Field
                                  label={
                                    text.stopType
                                  }
                                >
                                  <select
                                    value={
                                      stop.stop_type
                                    }
                                    disabled={
                                      saving
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStop(
                                        index,
                                        "stop_type",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    style={{
                                      ...inputStyle,
                                      cursor:
                                        saving
                                          ? "not-allowed"
                                          : "pointer",
                                      background:
                                        saving
                                          ? "#f8fafc"
                                          : "#ffffff",
                                    }}
                                  >
                                    <option value="pickup">
                                      {
                                        text.pickupStop
                                      }
                                    </option>

                                    <option value="delivery">
                                      {
                                        text.deliveryStop
                                      }
                                    </option>
                                  </select>
                                </Field>

                                {/* ADDRESS */}
                                <Field
                                  label={
                                    text.address
                                  }
                                >
                                  <input
                                    value={
                                      stop.address
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStop(
                                        index,
                                        "address",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="123 Main St"
                                    disabled={
                                      saving
                                    }
                                    style={
                                      inputStyle
                                    }
                                  />
                                </Field>

                                {/* CITY */}
                                <Field
                                  label={
                                    text.city
                                  }
                                >
                                  <input
                                    value={
                                      stop.city
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStop(
                                        index,
                                        "city",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Miami"
                                    disabled={
                                      saving
                                    }
                                    style={
                                      inputStyle
                                    }
                                  />
                                </Field>

                                {/* STATE */}
                                <Field
                                  label={
                                    text.state
                                  }
                                >
                                  <input
                                    value={
                                      stop.state
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStop(
                                        index,
                                        "state",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="FL"
                                    disabled={
                                      saving
                                    }
                                    style={
                                      inputStyle
                                    }
                                  />
                                </Field>

                                {/* ZIP CODE */}
                                <Field label={text.zipCode}>
                                  <input
                                    value={stop.zip_code}
                                    onChange={(event) => updateStop(index, "zip_code", event.target.value)}
                                    placeholder="33126"
                                    disabled={saving}
                                    style={inputStyle}
                                  />
                                </Field>

                                {/* PICKUP NUMBER */}
                                {stop.stop_type === "pickup" && (
                                  <Field label={text.pickupNumber}>
                                    <input
                                      value={stop.pickup_number}
                                      onChange={(event) => updateStop(index, "pickup_number", event.target.value)}
                                      placeholder="PU number"
                                      disabled={saving}
                                      style={inputStyle}
                                    />
                                  </Field>
                                )}

                                {/* DATE */}
                                <Field
                                  label={
                                    text.date
                                  }
                                >
                                  <input
                                    type="date"
                                    value={
                                      stop.scheduled_date
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStop(
                                        index,
                                        "scheduled_date",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                    style={
                                      inputStyle
                                    }
                                  />
                                </Field>

                                {/* TIME */}
                                <Field
                                  label={
                                    text.time
                                  }
                                >
                                  <input
                                    type="time"
                                    value={
                                      stop.scheduled_time
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStop(
                                        index,
                                        "scheduled_time",
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                    style={
                                      inputStyle
                                    }
                                  />
                                </Field>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* ADD STOP */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  }}
>
  <button
    type="button"
    onClick={() => addStop("pickup")}
    disabled={saving}
    style={{
      height: 38,
      padding: "0 16px",
      border: "1px solid #cbd5e1",
      borderRadius: 9,
      background: "#ffffff",
      color: "#1d4ed8",
      fontSize: 12,
      fontWeight: 700,
      cursor: saving ? "not-allowed" : "pointer",
    }}
  >
    + Add Pickup
  </button>

  <button
    type="button"
    onClick={() => addStop("delivery")}
    disabled={saving}
    style={{
      height: 38,
      padding: "0 16px",
      border: "1px solid #cbd5e1",
      borderRadius: 9,
      background: "#ffffff",
      color: "#047857",
      fontSize: 12,
      fontWeight: 700,
      cursor: saving ? "not-allowed" : "pointer",
    }}
  >
    + Add Delivery
  </button>
</div>
                  </div>

                  {/* MILES + RATE */}
                  <Field
                    label={text.miles}
                  >
                    <input
                      type="number"
                      min="0"
                      value={form.miles}
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            miles:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="1250"
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label={text.rate}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.rate}
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            rate:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="2500"
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  {/* COMPLETE ASSIGNMENT */}
                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                      padding: 16,
                      border:
                        "1px solid #dbeafe",
                      background:
                        "#f8fbff",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color:
                            "#0f172a",
                        }}
                      >
                        {
                          text.equipmentAssignment
                        }
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color:
                            "#64748b",
                        }}
                      >
                        {
                          text.equipmentDescription
                        }
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: 14,
                      }}
                    >
                      <Field
                        label={
                          text.driver
                        }
                      >
                        <select
                          value={
                            form.driver_id
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                driver_id:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={
                            inputStyle
                          }
                        >
                          <option value="">
                            {
                              text.unassigned
                            }
                          </option>

                          {drivers.map(
                            (
                              driver
                            ) => (
                              <option
                                key={
                                  driver.id
                                }
                                value={
                                  driver.id
                                }
                              >
                                {
                                  driver.full_name
                                }

                                {driver.driver_number
                                  ? ` · ${driver.driver_number}`
                                  : ""}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label={
                          text.truck
                        }
                      >
                        <select
                          value={
                            form.truck_id
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                truck_id:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={
                            inputStyle
                          }
                        >
                          <option value="">
                            {
                              text.unassigned
                            }
                          </option>

                          {trucks.map(
                            (
                              truck
                            ) => (
                              <option
                                key={
                                  truck.id
                                }
                                value={
                                  truck.id
                                }
                              >
                                {
                                  truck.unit_number
                                }

                                {truck.make ||
                                truck.model
                                  ? ` · ${[
                                      truck.make,
                                      truck.model,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        " "
                                      )}`
                                  : ""}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label={
                          text.trailer
                        }
                      >
                        <select
                          value={
                            form.trailer_id
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                trailer_id:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={
                            inputStyle
                          }
                        >
                          <option value="">
                            {
                              text.unassigned
                            }
                          </option>

                          {trailers.map(
                            (
                              trailer
                            ) => (
                              <option
                                key={
                                  trailer.id
                                }
                                value={
                                  trailer.id
                                }
                              >
                                {
                                  trailer.unit_number
                                }

                                {trailer.trailer_type
                                  ? ` · ${trailer.trailer_type}`
                                  : ""}
                              </option>
                            )
                          )}
                        </select>
                      </Field>
                    </div>
                  </div>

                  {/* INITIAL STATUS */}
                  <Field
                    label={
                      text.initialStatus
                    }
                  >
                    <select
                      value={
                        form.status
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            status:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      style={
                        inputStyle
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>

                {/* FORM ACTIONS */}
                <div
                  style={{
                    padding:
                      "16px 22px 20px",
                    borderTop:
                      "1px solid #e5e7eb",
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      closeCreateForm
                    }
                    disabled={
                      saving
                    }
                    style={{
                      height: 42,
                      padding:
                        "0 16px",
                      border:
                        "1px solid #dbe3ec",
                      borderRadius: 9,
                      background:
                        "#ffffff",
                      color:
                        "#475569",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor:
                        saving
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {
                      text.cancel
                    }
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    style={{
                      height: 42,
                      padding:
                        "0 18px",
                      border: "none",
                      borderRadius: 9,
                      background:
                        saving
                          ? "#94a3b8"
                          : "#0f172a",
                      color:
                        "#ffffff",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor:
                        saving
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {saving
                      ? (editingLoadId ? text.savingChanges : text.creating)
                      : (editingLoadId ? text.saveChanges : text.createLoad)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FOOTER INFORMATION */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <InfoCard
            title={text.loadFlow}
            text={text.loadFlowText}
          />

          <InfoCard
            title={text.assignment}
            text={text.assignmentText}
          />

          <InfoCard
            title={text.operations}
            text={text.operationsText}
          />
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent = "#0f172a",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "16px 17px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 27,
          lineHeight: 1,
          fontWeight: 850,
          color: accent,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: "#64748b",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px",
  verticalAlign: "middle",
  fontSize: 12,
  color: "#334155",
};