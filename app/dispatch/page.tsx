"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type Load = {
  id: string;
  load_number: string;
  broker_name: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  miles: number | null;
  rate: number | null;
  status: string | null;
  driver_id: string | null;
  truck_id: string | null;
  trailer_id: string | null;
};

type LoadStop = {
  id: string;
  load_id: string;
  stop_order: number;
  stop_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  pickup_number: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

type Driver = {
  id: string;
  full_name: string;
  driver_number: string | null;
  status: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
  status: string | null;
};

type Trailer = {
  id: string;
  unit_number: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trailer_type: string | null;
  status: string | null;
};

type SequenceStop = {
  loadStop: LoadStop;
  load: Load;
  stopCode: string;
};

export default function DispatchPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const [loads, setLoads] = useState<Load[]>([]);
  const [loadStops, setLoadStops] = useState<LoadStop[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sequenceSaving, setSequenceSaving] = useState(false);

  const [selectedLoad, setSelectedLoad] =
    useState<Load | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedTrailer, setSelectedTrailer] =
    useState("");

  const [selectedSequenceLoadIds, setSelectedSequenceLoadIds] =
    useState<string[]>([]);

  const [sequenceDriver, setSequenceDriver] =
    useState("");
  const [sequenceTruck, setSequenceTruck] =
    useState("");
  const [sequenceTrailer, setSequenceTrailer] =
    useState("");

  const [sequenceStops, setSequenceStops] =
    useState<SequenceStop[]>([]);

  const [sequenceOpen, setSequenceOpen] =
    useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const text = {
    eyebrow: "PROJECT LOGISTICS",

    title: isES ? "Despacho" : "Project Dispatch",

    subtitle: isES
      ? "Administra cargas, conductores y camiones desde un solo centro de control."
      : "Dispatch loads, drivers and trucks from one command center.",

    refresh: isES ? "Actualizar" : "Refresh",

    available: isES ? "Disponibles" : "Available",

    availableDetail: isES
      ? "Cargas esperando despacho"
      : "Loads waiting for dispatch",

    assigned: isES ? "Asignadas" : "Assigned",

    assignedDetail: isES
      ? "Conductor y camión asignados"
      : "Driver and truck assigned",

    inTransit: isES ? "En tránsito" : "In Transit",

    inTransitDetail: isES
      ? "Cargas actualmente en movimiento"
      : "Loads currently moving",

    availableDrivers: isES
      ? "Conductores disponibles"
      : "Available Drivers",

    availableDriversDetail: isES
      ? "Conductores listos para despacho"
      : "Drivers ready for dispatch",

    searchPlaceholder: isES
      ? "Buscar carga, broker o ruta..."
      : "Search load, broker or route...",

    dispatchBoard: isES
      ? "Panel de despacho"
      : "Dispatch Board",

    dispatchBoardSubtitle: isES
      ? "Administra cargas individuales y construye secuencias operacionales."
      : "Manage individual loads and build operational sequences.",

    loadingBoard: isES
      ? "Cargando panel de despacho..."
      : "Loading dispatch board...",

    noLoads: isES
      ? "No se encontraron cargas."
      : "No loads found.",

    load: isES ? "Carga" : "Load",

    route: isES ? "Ruta / Paradas" : "Route / Stops",

    broker: isES ? "Broker" : "Broker",

    driver: isES ? "Conductor" : "Driver",

    truck: isES ? "Camión" : "Truck",

    miles: isES ? "Millas" : "Miles",

    rate: isES ? "Tarifa" : "Rate",

    status: isES ? "Estado" : "Status",

    action: isES ? "Acción" : "Action",

    manage: isES ? "Administrar" : "Manage",

    dispatch: isES ? "Despachar" : "Dispatch",

    driverAssignment: isES
      ? "Asignación de conductor"
      : "Driver Assignment",

    driverAssignmentText: isES
      ? "Selecciona el conductor responsable de la carga."
      : "Select the driver responsible for the load.",

    truckAssignment: isES
      ? "Asignación de camión"
      : "Truck Assignment",

    truckAssignmentText: isES
      ? "Conecta cada carga despachada con el camión que realizará el viaje."
      : "Connect each dispatched load to the truck that will perform the trip.",

    aiDispatch: isES
      ? "Copiloto IA de despacho"
      : "AI Dispatch Copilot",

    aiDispatchText: isES
      ? "La futura IA evaluará HOS, ubicación, millas vacías, tarifa, combustible y rentabilidad."
      : "The future AI layer will evaluate HOS, location, deadhead, rate, fuel and profitability.",

    dispatchLoad: isES
      ? "Despachar carga"
      : "Dispatch Load",

    cancel: isES ? "Cancelar" : "Cancel",
        cancelLoad: isES
      ? "Cancelar carga"
      : "Cancel Load",

    confirmCancelLoad: isES
      ? "¿Confirmas que deseas cancelar esta carga? Esta acción no se puede deshacer desde Dispatch."
      : "Are you sure you want to cancel this load? This action cannot be undone from Dispatch.",

    cancelReasonPrompt: isES
      ? "Escribe el motivo de la cancelación:"
      : "Enter the reason for cancellation:",

    cancelReasonRequired: isES
      ? "Debes indicar el motivo de la cancelación."
      : "You must provide a cancellation reason.",

    loadCancelled: isES
      ? "se canceló correctamente."
      : "was cancelled successfully.",

    selectDriver: isES
      ? "Seleccionar conductor"
      : "Select driver",

    selectTruck: isES
      ? "Seleccionar camión"
      : "Select truck",

    selectTrailer: isES
      ? "Seleccionar remolque"
      : "Select trailer",

    driverRequired: isES
      ? "Selecciona un conductor."
      : "Please select a driver.",

    truckRequired: isES
      ? "Selecciona un camión."
      : "Please select a truck.",

    assignedSuccessfully: isES
      ? "se asignó correctamente."
      : "assigned successfully.",

    unknownDriver: isES
      ? "Conductor desconocido"
      : "Unknown Driver",

    unknownTruck: isES
      ? "Camión desconocido"
      : "Unknown Truck",

    unassigned: isES
      ? "Sin asignar"
      : "Unassigned",

    unknown: isES ? "Desconocido" : "Unknown",

    noBroker: isES ? "Sin broker" : "No broker",

    milesNotEntered: isES
      ? "Millas no ingresadas"
      : "Miles not entered",

    pickup: "Pickup",

    delivery: isES ? "Entrega" : "Delivery",

    noStops: isES
      ? "No hay paradas registradas."
      : "No stops recorded.",

    stop: isES ? "Parada" : "Stop",

    pending: isES ? "Pendiente" : "Pending",

    selectForSequence: isES
      ? "Seleccionar"
      : "Select",

    selected: isES
      ? "seleccionadas"
      : "selected",

    createSequence: isES
      ? "Crear secuencia operacional"
      : "Create Operational Sequence",

    sequenceTitle: isES
      ? "Secuencia operacional"
      : "Operational Sequence",

    sequenceSubtitle: isES
      ? "Combina varias PLs en una sola operación física."
      : "Combine multiple PLs into one physical operation.",

    sequenceDriver: isES
      ? "Conductor de la secuencia"
      : "Sequence Driver",

    sequenceTruck: isES
      ? "Camión de la secuencia"
      : "Sequence Truck",

    sequenceTrailer: isES
      ? "Remolque de la secuencia"
      : "Sequence Trailer",

    sequenceOrder: isES
      ? "Orden físico"
      : "Physical Order",

    moveUp: isES ? "Subir" : "Move Up",

    moveDown: isES ? "Bajar" : "Move Down",

    sequenceRequiresTwoLoads: isES
      ? "Selecciona al menos dos PLs para crear una secuencia operacional."
      : "Select at least two loads to create an operational sequence.",

    sequenceDriverRequired: isES
      ? "Selecciona el conductor de la secuencia."
      : "Select the sequence driver.",

    sequenceTruckRequired: isES
      ? "Selecciona el camión de la secuencia."
      : "Select the sequence truck.",

    sequenceNoStops: isES
      ? "Las PLs seleccionadas no tienen paradas registradas."
      : "The selected loads have no recorded stops.",

    sequenceDeliveredLoad: isES
      ? "Una carga entregada no puede incluirse en una nueva secuencia operacional."
      : "A delivered load cannot be included in a new operational sequence.",

    sequenceCreated: isES
      ? "Secuencia operacional creada correctamente."
      : "Operational sequence created successfully.",

    sequenceCreateError: isES
      ? "No se pudo crear la secuencia operacional."
      : "The operational sequence could not be created.",

    close: isES ? "Cerrar" : "Close",

    sequence: isES ? "Secuencia" : "Sequence",

    loadNumber: "PL",

    stopCode: isES ? "Código" : "Code",

    zipCode: "ZIP",

    pickupNumber: "PU",

    statusUpdated: isES
      ? "ahora está"
      : "is now",
  };

 
  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const errors: string[] = [];

    try {
      const [
        loadsResult,
        driversResult,
        trucksResult,
        trailersResult,
      ] = await Promise.all([
        supabase
          .from("loads")
          .select(
            "id, load_number, broker_name, origin_city, origin_state, destination_city, destination_state, miles, rate, status, driver_id, truck_id, trailer_id"
          )
          .order("load_number", {
            ascending: false,
          }),

        supabase
          .from("drivers")
          .select(
            "id, full_name, driver_number, status"
          )
          .order("full_name", {
            ascending: true,
          }),

        supabase
          .from("trucks")
          .select(
            "id, unit_number, make, model, status"
          )
          .order("unit_number", {
            ascending: true,
          }),

        (supabase as any)
          .from("trailers")
          .select(
            "id, unit_number, year, make, model, trailer_type, status"
          )
          .order("unit_number", {
            ascending: true,
          }),
      ]);

      if (loadsResult.error) {
        errors.push(
          `Loads: ${loadsResult.error.message}`
        );

        setLoads([]);
        setLoadStops([]);
      } else {
        const loadedLoads =
          (loadsResult.data || []) as Load[];

        setLoads(loadedLoads);

        const loadIds = loadedLoads.map(
          (load) => load.id
        );

        if (loadIds.length > 0) {
          const {
            data: stopsData,
            error: stopsError,
          } = await supabase
            .from("load_stops")
            .select(
              "id, load_id, stop_order, stop_type, address, city, state, zip_code, pickup_number, scheduled_date, scheduled_time, status"
            )
            .in("load_id", loadIds)
            .order("stop_order", {
              ascending: true,
            });

          if (stopsError) {
            errors.push(
              `Load stops: ${stopsError.message}`
            );

            setLoadStops([]);
          } else {
            setLoadStops(
              (stopsData || []) as LoadStop[]
            );
          }
        } else {
          setLoadStops([]);
        }
      }

      if (driversResult.error) {
        errors.push(
          `Drivers: ${driversResult.error.message}`
        );

        console.error(
          "DISPATCH DRIVERS QUERY ERROR:",
          driversResult.error
        );
      } else {
        const fetchedDrivers =
          (driversResult.data || []) as Driver[];

        console.log(
          "DISPATCH DRIVERS QUERY RESULT:",
          fetchedDrivers.map((driver) => ({
            id: driver.id,
            name: driver.full_name,
            status: driver.status,
          }))
        );

        setDrivers(fetchedDrivers);
      }

      if (trucksResult.error) {
        errors.push(
          `Trucks: ${trucksResult.error.message}`
        );
      } else {
        setTrucks(
          (trucksResult.data || []) as Truck[]
        );
      }

      if (trailersResult.error) {
        errors.push(
          `Trailers: ${trailersResult.error.message}`
        );
      } else {
        setTrailers(
          (trailersResult.data || []) as Trailer[]
        );
      }

      setErrorMessage(
        errors.length > 0
          ? errors.join(" | ")
          : ""
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error loading Dispatch data.";

      console.error(
        "DISPATCH LOAD DATA ERROR:",
        error
      );

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    const channel = supabase
      .channel("dispatch-drivers-test")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drivers",
        },
        (payload) => {
          if (!active) return;

          console.log(
            "DISPATCH DRIVERS TEST: EVENT RECEIVED",
            payload
          );

          if (payload.eventType === "DELETE") {
            const deleted = payload.old as Partial<Driver>;

            if (!deleted.id) {
              void loadData();
              return;
            }

            setDrivers((currentDrivers) =>
              currentDrivers.filter(
                (driver) => driver.id !== deleted.id
              )
            );

            return;
          }

          const changed =
            payload.new as Partial<Driver>;

          if (!changed.id) {
            void loadData();
            return;
          }

          if (payload.eventType === "INSERT") {
            const inserted = changed as Driver;

            setDrivers((currentDrivers) => {
              const exists = currentDrivers.some(
                (driver) => driver.id === inserted.id
              );

              const nextDrivers = exists
                ? currentDrivers.map((driver) =>
                    driver.id === inserted.id
                      ? { ...driver, ...inserted }
                      : driver
                  )
                : [...currentDrivers, inserted];

              return nextDrivers.sort((a, b) =>
                (a.full_name || "").localeCompare(
                  b.full_name || ""
                )
              );
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            setDrivers((currentDrivers) =>
              currentDrivers.map((driver) =>
                driver.id === changed.id
                  ? { ...driver, ...changed }
                  : driver
              )
            );
          }
        }
      )
      .subscribe((status, error) => {
        console.log(
          "DISPATCH DRIVERS TEST STATUS:",
          status
        );

        if (error) {
          console.error(
            "DISPATCH DRIVERS TEST ERROR:",
            error
          );
        }
      });

    void loadData();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);


  const dispatchLoads = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    return loads.filter((load) => {
      return (
        !value ||
        load.load_number
          .toLowerCase()
          .includes(value) ||
        (load.broker_name || "")
          .toLowerCase()
          .includes(value) ||
        (load.origin_city || "")
          .toLowerCase()
          .includes(value) ||
        (load.destination_city || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [loads, search]);

  const availableLoads = loads.filter(
    (load) =>
      (load.status || "").toLowerCase() ===
      "available"
  );

  const assignedLoads = loads.filter(
    (load) =>
      (load.status || "").toLowerCase() ===
      "assigned"
  );

  const inTransitLoads = loads.filter(
    (load) =>
      (load.status || "").toLowerCase() ===
      "in_transit"
  );

 const availableDrivers = drivers.filter(
  (driver) =>
    (driver.status || "").toLowerCase() ===
    "available"
);

  const availableTrucks = trucks.filter(
    (truck) =>
      !truck.status ||
      [
        "available",
        "active",
        "ready",
      ].includes(
        truck.status.toLowerCase()
      )
  );

  const availableTrailers = useMemo(
    () =>
      trailers.filter(
        (trailer) =>
          !trailer.status ||
          [
            "available",
            "active",
            "ready",
          ].includes(
            trailer.status.toLowerCase()
          )
      ),
    [trailers]
  );

  function stopsForLoad(loadId: string) {
    return loadStops
      .filter(
        (stop) => stop.load_id === loadId
      )
      .sort(
        (a, b) =>
          a.stop_order - b.stop_order
      );
  }

  function stopTypeLabel(stopType: string) {
    return stopType.toLowerCase() ===
      "pickup"
      ? text.pickup
      : text.delivery;
  }

  function openDispatch(load: Load) {
    setSelectedLoad(load);
    setSelectedDriver(
      load.driver_id || ""
    );
    setSelectedTruck(
      load.truck_id || ""
    );
    setSelectedTrailer(
      load.trailer_id || ""
    );
    setMessage("");
    setErrorMessage("");
  }

  function closeDispatch() {
    setSelectedLoad(null);
    setSelectedDriver("");
    setSelectedTruck("");
    setSelectedTrailer("");
  }

  async function assignLoad() {
    if (!selectedLoad) return;

    if (!selectedDriver) {
      setErrorMessage(
        text.driverRequired
      );
      return;
    }

    if (!selectedTruck) {
      setErrorMessage(
        text.truckRequired
      );
      return;
    }

    if (
      (selectedLoad.status || "").toLowerCase() ===
      "delivered"
    ) {
      setErrorMessage(
        isES
          ? "Una carga entregada no puede volver a asignarse."
          : "A delivered load cannot be assigned again."
      );
      return;
    }

    const selectedDriverRecord =
      drivers.find(
        (driver) =>
          driver.id === selectedDriver
      );

    const driverStatus = (
      selectedDriverRecord?.status || ""
    ).toLowerCase();

    if (driverStatus !== "available") {
      setErrorMessage(
        isES
          ? "Este conductor no está disponible para recibir una carga."
          : "This driver is not available to receive a load."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const {
      data: updatedLoad,
      error,
    } = await supabase
      .from("loads")
      .update({
        driver_id: selectedDriver,
        truck_id: selectedTruck,
        trailer_id:
          selectedTrailer || null,
        status: "assigned",
      })
      .eq("id", selectedLoad.id)
      .select(
        "id, load_number, driver_id, status"
      )
      .single();

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    if (!updatedLoad) {
      setErrorMessage(
        isES
          ? "No se pudo confirmar la asignación."
          : "The assignment could not be confirmed."
      );
      setSaving(false);
      return;
    }

    setMessage(
      `${selectedLoad.load_number} ${text.assignedSuccessfully}`
    );

    setSaving(false);

    closeDispatch();

    await loadData();
  }

  async function changeStatus(
    load: Load,
    status: string
  ) {
    if (
      status.toLowerCase() === "delivered" &&
      (load.status || "").toLowerCase() !==
        "delivered"
    ) {
      const confirmed = window.confirm(
        isES
          ? `¿Confirmar que ${load.load_number} está Delivered?`
          : `Confirm that ${load.load_number} is Delivered?`
      );

      if (!confirmed) {
        return;
      }
    }

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("loads")
      .update({ status })
      .eq("id", load.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      `${load.load_number} ${text.statusUpdated} ${formatStatus(
        status
      )}.`
    );

    await loadData();
  }

    async function cancelLoad(load: Load) {
    const currentStatus = (
      load.status || ""
    ).toLowerCase();

    if (currentStatus === "cancelled") {
      setErrorMessage(
        isES
          ? "Esta carga ya está cancelada."
          : "This load is already cancelled."
      );
      return;
    }

    if (currentStatus === "delivered") {
      setErrorMessage(
        isES
          ? "Una carga entregada no se puede cancelar."
          : "A delivered load cannot be cancelled."
      );
      return;
    }

    const confirmed = window.confirm(
      `${text.confirmCancelLoad}\n\n${load.load_number}`
    );

    if (!confirmed) return;

    const reason = window.prompt(
      text.cancelReasonPrompt
    );

    if (reason === null) return;

    const cancellationReason = reason.trim();

    if (!cancellationReason) {
      setErrorMessage(text.cancelReasonRequired);
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      // Verifica que la carga todavía tenga el estado
      // que vimos antes de confirmar la cancelación.
      const { data: currentLoad, error: readError } =
        await supabase
          .from("loads")
          .select("id, status")
          .eq("id", load.id)
          .single();

      if (readError) {
        throw new Error(readError.message);
      }

      const latestStatus = (
        currentLoad?.status || ""
      ).toLowerCase();

      if (
        latestStatus === "cancelled" ||
        latestStatus === "delivered"
      ) {
        throw new Error(
          isES
            ? "El estado de la carga cambió. Actualiza Dispatch antes de continuar."
            : "The load status changed. Refresh Dispatch before continuing."
        );
      }

      // Por ahora, solo actualizamos el estado.
      // El motivo todavía no se guarda en la base de datos:
      // primero hay que verificar qué columna o tabla de
      // auditoría existe para almacenarlo correctamente.
      const { data: updatedLoad, error: updateError } =
  await supabase
    .from("loads")
    .update({ status: "cancelled" })
    .eq("id", load.id)
    .in("status", ["available", "assigned", "in_transit"])
    .select("id, status")
    .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedLoad) {
        throw new Error(
          isES
            ? "No se pudo confirmar la cancelación en la base de datos."
            : "The cancellation could not be confirmed in the database."
        );
      }

      setMessage(
        `${load.load_number} ${text.loadCancelled} ${
          isES ? "Motivo" : "Reason"
        }: ${cancellationReason}`
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isES
            ? "No se pudo cancelar la carga."
            : "The load could not be cancelled."
      );
    } finally {
      setSaving(false);
    }
  }

  function driverName(
    driverId: string | null
  ) {
    if (!driverId) {
      return text.unassigned;
    }

    const driver = drivers.find(
      (item) => item.id === driverId
    );

    return driver
      ? driver.full_name
      : text.unknownDriver;
  }

  function truckName(
    truckId: string | null
  ) {
    if (!truckId) {
      return text.unassigned;
    }

    const truck = trucks.find(
      (item) => item.id === truckId
    );

    return truck
      ? truck.unit_number
      : text.unknownTruck;
  }

  function formatStatus(
    status: string | null
  ) {
    if (!status) return text.unknown;

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function formatMoney(
    value: number | null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return value.toLocaleString(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }
    );
  }

  function statusBackground(
    status: string | null
  ) {
    const value = (
      status || ""
    ).toLowerCase();

    if (value === "available")
      return "#fff7ed";

    if (value === "assigned")
      return "#f5f3ff";

    if (value === "in_transit")
      return "#eff6ff";

    if (value === "delivered")
      return "#ecfdf5";

    return "#f8fafc";
  }

  function statusColor(
    status: string | null
  ) {
    const value = (
      status || ""
    ).toLowerCase();

    if (value === "available")
      return "#c2410c";

    if (value === "assigned")
      return "#6d28d9";

    if (value === "in_transit")
      return "#1d4ed8";

    if (value === "delivered")
      return "#047857";

    return "#64748b";
  }

  function toggleSequenceLoad(
    loadId: string
  ) {
    setSelectedSequenceLoadIds(
      (current) => {
        if (current.includes(loadId)) {
          return current.filter(
            (id) => id !== loadId
          );
        }

        return [...current, loadId];
      }
    );
  }

  function buildSequenceStops(
    loadIds: string[]
  ) {
    const result: SequenceStop[] = [];

    const selectedLoads = loadIds
      .map((id) =>
        loads.find(
          (load) => load.id === id
        )
      )
      .filter(
        (load): load is Load =>
          Boolean(load)
      );

    selectedLoads.forEach(
      (load, loadIndex) => {
        const relationshipNumber =
          loadIndex + 1;

        const stops = stopsForLoad(
          load.id
        );

        let pickupCounter = 0;
        let deliveryCounter = 0;

        const totalPickups =
          stops.filter(
            (item) =>
              item.stop_type.toLowerCase() ===
              "pickup"
          ).length;

        const totalDeliveries =
          stops.filter(
            (item) =>
              item.stop_type.toLowerCase() ===
              "delivery"
          ).length;

        /*
         * IMPORTANT:
         * load_stops.stop_order is the source
         * order for the stops inside each load.
         *
         * We preserve that order here.
         *
         * After the sequence builder opens, the
         * dispatcher can change the physical order
         * with Move Up / Move Down.
         */
        stops.forEach((stop) => {
          const stopType =
            stop.stop_type.toLowerCase();

          const isPickup =
            stopType === "pickup";

          if (!isPickup &&
              stopType !== "delivery") {
            return;
          }

          if (isPickup) {
            pickupCounter += 1;

            const stopCode =
              totalPickups === 1
                ? `PU-${relationshipNumber}`
                : `PU-${relationshipNumber}.${pickupCounter}`;

            result.push({
              loadStop: stop,
              load,
              stopCode,
            });
          } else {
            deliveryCounter += 1;

            const stopCode =
              totalDeliveries === 1
                ? `DEL-${relationshipNumber}`
                : `DEL-${relationshipNumber}.${deliveryCounter}`;

            result.push({
              loadStop: stop,
              load,
              stopCode,
            });
          }
        });
      }
    );

    return result;
  }

  function openSequenceBuilder() {
    setMessage("");
    setErrorMessage("");

    if (
      selectedSequenceLoadIds.length < 2
    ) {
      setErrorMessage(
        text.sequenceRequiresTwoLoads
      );
      return;
    }

    const selectedLoadRecords =
      selectedSequenceLoadIds
        .map((id) =>
          loads.find(
            (load) => load.id === id
          )
        )
        .filter(
          (load): load is Load =>
            Boolean(load)
        );

    const deliveredLoad =
      selectedLoadRecords.find(
        (load) =>
          (load.status || "").toLowerCase() ===
          "delivered"
      );

    if (deliveredLoad) {
      setErrorMessage(
        `${deliveredLoad.load_number}: ${text.sequenceDeliveredLoad}`
      );
      return;
    }

    const generatedStops =
      buildSequenceStops(
        selectedSequenceLoadIds
      );

    if (generatedStops.length === 0) {
      setErrorMessage(
        text.sequenceNoStops
      );
      return;
    }

    const commonDriver =
      selectedLoadRecords.length > 0 &&
      selectedLoadRecords.every(
        (load) =>
          load.driver_id &&
          load.driver_id ===
            selectedLoadRecords[0]
              ?.driver_id
      )
        ? selectedLoadRecords[0]
            ?.driver_id || ""
        : "";

    const commonTruck =
      selectedLoadRecords.length > 0 &&
      selectedLoadRecords.every(
        (load) =>
          load.truck_id &&
          load.truck_id ===
            selectedLoadRecords[0]
              ?.truck_id
      )
        ? selectedLoadRecords[0]
            ?.truck_id || ""
        : "";

    const commonTrailer =
      selectedLoadRecords.length > 0 &&
      selectedLoadRecords.every(
        (load) =>
          load.trailer_id &&
          load.trailer_id ===
            selectedLoadRecords[0]
              ?.trailer_id
      )
        ? selectedLoadRecords[0]
            ?.trailer_id || ""
        : "";

    setSequenceDriver(
      commonDriver
    );

    setSequenceTruck(
      commonTruck
    );

    setSequenceTrailer(
      commonTrailer
    );

    setSequenceStops(
      generatedStops
    );

    setSequenceOpen(true);
  }

  function moveSequenceStop(
    index: number,
    direction: "up" | "down"
  ) {
    setSequenceStops((current) => {
      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];

      const temp = next[index];

      next[index] =
        next[targetIndex];

      next[targetIndex] = temp;

      return next;
    });
  }

  async function createOperationalSequence() {
    if (
      selectedSequenceLoadIds.length < 2
    ) {
      setErrorMessage(
        text.sequenceRequiresTwoLoads
      );
      return;
    }

    if (!sequenceDriver) {
      setErrorMessage(
        text.sequenceDriverRequired
      );
      return;
    }

    if (!sequenceTruck) {
      setErrorMessage(
        text.sequenceTruckRequired
      );
      return;
    }

    if (sequenceStops.length === 0) {
      setErrorMessage(
        text.sequenceNoStops
      );
      return;
    }

    const selectedLoadRecords =
      selectedSequenceLoadIds
        .map((id) =>
          loads.find(
            (load) => load.id === id
          )
        )
        .filter(
          (load): load is Load =>
            Boolean(load)
        );

    const deliveredLoad =
      selectedLoadRecords.find(
        (load) =>
          (load.status || "").toLowerCase() ===
          "delivered"
      );

    if (deliveredLoad) {
      setErrorMessage(
        `${deliveredLoad.load_number}: ${text.sequenceDeliveredLoad}`
      );
      return;
    }

    setSequenceSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const selectedDriverRecord =
        drivers.find(
          (driver) =>
            driver.id === sequenceDriver
        );

      const driverStatus = (
        selectedDriverRecord?.status || ""
      ).toLowerCase();

      if (
        driverStatus !== "available" &&
        driverStatus !== "assigned"
      ) {
        throw new Error(
          isES
            ? "El conductor seleccionado no está disponible para recibir la secuencia."
            : "The selected driver is not available to receive the sequence."
        );
      }

      const {
        data: sequence,
        error: sequenceError,
      } = await supabase
        .from("operational_sequences")
        .insert({
          driver_id: sequenceDriver,
          truck_id: sequenceTruck,
          trailer_id:
            sequenceTrailer || null,
          status: "planned",
        })
        .select(
          "id, sequence_number, driver_id, truck_id, trailer_id, status"
        )
        .single();

      if (sequenceError) {
        throw new Error(
          sequenceError.message
        );
      }

      if (!sequence) {
        throw new Error(
          text.sequenceCreateError
        );
      }

      /*
       * sequenceStops is already in the exact
       * physical order selected in the builder.
       *
       * Therefore sequence_order is written
       * directly from the final UI order.
       */
      const sequenceRows =
        sequenceStops.map(
          (item, index) => ({
            sequence_id:
              sequence.id,
            sequence_order:
              index + 1,
            load_stop_id:
              item.loadStop.id,
            stop_code:
              item.stopCode,
            status: "pending",
          })
        );

      const {
        error: sequenceStopsError,
      } = await supabase
        .from(
          "operational_sequence_stops"
        )
        .insert(sequenceRows);

      if (sequenceStopsError) {
        await supabase
          .from(
            "operational_sequences"
          )
          .delete()
          .eq(
            "id",
            sequence.id
          );

        throw new Error(
          sequenceStopsError.message
        );
      }

      const {
        error: loadsUpdateError,
      } = await supabase
        .from("loads")
        .update({
          driver_id:
            sequenceDriver,
          truck_id:
            sequenceTruck,
          trailer_id:
            sequenceTrailer ||
            null,
          status: "assigned",
        })
        .in(
          "id",
          selectedSequenceLoadIds
        );

      if (loadsUpdateError) {
        await supabase
          .from(
            "operational_sequence_stops"
          )
          .delete()
          .eq(
            "sequence_id",
            sequence.id
          );

        await supabase
          .from(
            "operational_sequences"
          )
          .delete()
          .eq(
            "id",
            sequence.id
          );

        throw new Error(
          loadsUpdateError.message
        );
      }

      setMessage(
        `${text.sequenceCreated} ${text.sequence} #${sequence.sequence_number}`
      );

      setSequenceOpen(false);
      setSelectedSequenceLoadIds([]);
      setSequenceStops([]);
      setSequenceDriver("");
      setSequenceTruck("");
      setSequenceTrailer("");

      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text.sequenceCreateError
      );
    } finally {
      setSequenceSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#172033",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e5e7eb",
          padding: "22px 30px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#64748b",
              marginBottom: 7,
            }}
          >
            {text.eyebrow}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 850,
            }}
          >
            {text.title}
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            {text.subtitle}
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: "11px 16px",
            borderRadius: 9,
            border:
              "1px solid #d1d5db",
            background: "#ffffff",
            color: "#374151",
            fontWeight: 700,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          {text.refresh}
        </button>
      </header>

      <div style={{ padding: 30 }}>
        {message && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 15px",
              borderRadius: 10,
              background: "#ecfdf5",
              border:
                "1px solid #a7f3d0",
              color: "#047857",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 15px",
              borderRadius: 10,
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard
            title={text.available}
            value={availableLoads.length}
            detail={
              text.availableDetail
            }
          />

          <StatCard
            title={text.assigned}
            value={assignedLoads.length}
            detail={
              text.assignedDetail
            }
          />

          <StatCard
            title={text.inTransit}
            value={
              inTransitLoads.length
            }
            detail={
              text.inTransitDetail
            }
          />

          <StatCard
            title={
              text.availableDrivers
            }
            value={
              availableDrivers.length
            }
            detail={
              text.availableDriversDetail
            }
          />
        </div>

        <section
          style={{
            background: "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 18,
            marginBottom: 22,
          }}
        >
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={
              text.searchPlaceholder
            }
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              padding:
                "12px 14px",
              borderRadius: 9,
              border:
                "1px solid #cbd5e1",
              color: "#111827",
              background:
                "#ffffff",
              fontSize: 13,
              outline: "none",
            }}
          />
        </section>

        <section
          style={{
            background: "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding:
                "18px 20px",
              borderBottom:
                "1px solid #e5e7eb",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 20,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                }}
              >
                {
                  text.dispatchBoard
                }
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#64748b",
                  fontSize: 12,
                }}
              >
                {
                  text.dispatchBoardSubtitle
                }
              </p>
            </div>

            <button
              onClick={
                openSequenceBuilder
              }
              disabled={
                selectedSequenceLoadIds.length <
                2
              }
              style={{
                padding:
                  "10px 14px",
                borderRadius: 9,
                border: 0,
                background:
                  selectedSequenceLoadIds.length >=
                  2
                    ? "#111827"
                    : "#cbd5e1",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 12,
                cursor:
                  selectedSequenceLoadIds.length >=
                  2
                    ? "pointer"
                    : "not-allowed",
                whiteSpace:
                  "nowrap",
              }}
            >
              {
                text.createSequence
              }

              {selectedSequenceLoadIds.length >
              0
                ? ` (${selectedSequenceLoadIds.length})`
                : ""}
            </button>
          </div>

          {loading ? (
            <div
              style={{
                padding: 45,
                textAlign:
                  "center",
                color:
                  "#64748b",
              }}
            >
              {
                text.loadingBoard
              }
            </div>
          ) : dispatchLoads.length ===
            0 ? (
            <div
              style={{
                padding: 50,
                textAlign:
                  "center",
                color:
                  "#64748b",
              }}
            >
              {text.noLoads}
            </div>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
                width: "100%",
              }}
            >
              <div
                style={{
                  minWidth: 1500,
                }}
              >
                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "58px 105px 430px 150px 155px 105px 90px 105px 140px 105px",
                    background:
                      "#f8fafc",
                    borderBottom:
                      "1px solid #e5e7eb",
                    alignItems:
                      "stretch",
                  }}
                >
                  <div
                    style={{
                      padding:
                        "13px 10px",
                      fontSize: 10,
                      fontWeight: 800,
                      color:
                        "#64748b",
                      textAlign:
                        "center",
                    }}
                  >
                    SEQ
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.load}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.route}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.broker}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.driver}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.truck}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.miles}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.rate}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.status}
                  </div>

                  <div
                    style={
                      headerStyle
                    }
                  >
                    {text.action}
                  </div>
                </div>

                {dispatchLoads.map(
                  (load) => {
                    const stops =
                      stopsForLoad(
                        load.id
                      );

                    const isSelected =
                      selectedSequenceLoadIds.includes(
                        load.id
                      );

                    return (
                      <div
                        key={load.id}
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "58px 105px 430px 150px 155px 105px 90px 105px 140px 105px",
                          background:
                            isSelected
                              ? "#f8fafc"
                              : "#ffffff",
                          borderBottom:
                            "1px solid #f1f5f9",
                          alignItems:
                            "stretch",
                        }}
                      >
                        <div
                          style={{
                            padding: 10,
                            textAlign:
                              "center",
                            display:
                              "flex",
                            alignItems:
                              "flex-start",
                            justifyContent:
                              "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              toggleSequenceLoad(
                                load.id
                              )
                            }
                            title={
                              text.selectForSequence
                            }
                            style={{
                              width: 16,
                              height: 16,
                              marginTop: 3,
                              cursor:
                                "pointer",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            padding: 15,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight:
                                850,
                              fontSize: 13,
                              whiteSpace:
                                "nowrap",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {
                              load.load_number
                            }
                          </div>
                        </div>

                        <div
                          style={{
                            padding: 12,
                            minWidth: 0,
                            boxSizing:
                              "border-box",
                          }}
                        >
                          {stops.length >
                          0 ? (
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                width:
                                  "100%",
                                minWidth:
                                  0,
                              }}
                            >
                              {stops.map(
                                (
                                  stop,
                                  index
                                ) => {
                                  const stopType =
                                    stop.stop_type.toLowerCase();

                                  const isPickup =
                                    stopType ===
                                    "pickup";

                                  const isDelivery =
                                    stopType ===
                                    "delivery";

                                  if (
                                    !isPickup &&
                                    !isDelivery
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={
                                        stop.id
                                      }
                                      style={{
                                        position:
                                          "relative",
                                        display:
                                          "flex",
                                        gap: 10,
                                        padding:
                                          "7px 4px",
                                        minWidth:
                                          0,
                                      }}
                                    >
                                      {index <
                                        stops.length -
                                          1 && (
                                        <div
                                          style={{
                                            position:
                                              "absolute",
                                            left: 15,
                                            top: 31,
                                            bottom:
                                              -7,
                                            width: 1,
                                            background:
                                              "#cbd5e1",
                                          }}
                                        />
                                      )}

                                      <div
                                        style={{
                                          position:
                                            "relative",
                                          zIndex: 1,
                                          width: 24,
                                          height: 24,
                                          minWidth: 24,
                                          borderRadius:
                                            999,
                                          background:
                                            isPickup
                                              ? "#fff7ed"
                                              : "#eff6ff",
                                          color:
                                            isPickup
                                              ? "#c2410c"
                                              : "#1d4ed8",
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          justifyContent:
                                            "center",
                                          fontSize: 10,
                                          fontWeight: 900,
                                        }}
                                      >
                                        {
                                          stop.stop_order
                                        }
                                      </div>

                                      <div
                                        style={{
                                          minWidth:
                                            0,
                                          flex: 1,
                                          boxSizing:
                                            "border-box",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            alignItems:
                                              "center",
                                            gap: 7,
                                            flexWrap:
                                              "wrap",
                                            minWidth:
                                              0,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 900,
                                              color:
                                                isPickup
                                                  ? "#c2410c"
                                                  : "#1d4ed8",
                                              textTransform:
                                                "uppercase",
                                              letterSpacing:
                                                0.4,
                                            }}
                                          >
                                            {stopTypeLabel(
                                              stop.stop_type
                                            )}
                                          </span>

                                          {isPickup &&
                                            stop.pickup_number && (
                                              <span
                                                style={{
                                                  display:
                                                    "inline-flex",
                                                  alignItems:
                                                    "center",
                                                  padding:
                                                    "2px 6px",
                                                  borderRadius:
                                                    5,
                                                  background:
                                                    "#fff7ed",
                                                  color:
                                                    "#9a3412",
                                                  fontSize:
                                                    9,
                                                  fontWeight:
                                                    900,
                                                }}
                                              >
                                                PU{" "}
                                                {
                                                  stop.pickup_number
                                                }
                                              </span>
                                            )}
                                        </div>

                                        <div
                                          style={{
                                            marginTop:
                                              2,
                                            fontSize:
                                              12,
                                            fontWeight:
                                              750,
                                            whiteSpace:
                                              "nowrap",
                                            overflow:
                                              "hidden",
                                            textOverflow:
                                              "ellipsis",
                                          }}
                                          title={
                                            stop.address ||
                                            ""
                                          }
                                        >
                                          {
                                            stop.address ||
                                            "—"
                                          }
                                        </div>

                                        <div
                                          style={{
                                            marginTop:
                                              1,
                                            display:
                                              "flex",
                                            gap: 6,
                                            flexWrap:
                                              "wrap",
                                            fontSize:
                                              11,
                                            color:
                                              "#64748b",
                                          }}
                                        >
                                          <span>
                                            {
                                              stop.city ||
                                              "—"
                                            }

                                            {stop.state
                                              ? `, ${stop.state}`
                                              : ""}
                                          </span>

                                          {stop.zip_code && (
                                            <span
                                              style={{
                                                color:
                                                  "#475569",
                                                fontWeight:
                                                  700,
                                              }}
                                            >
                                              ZIP{" "}
                                              {
                                                stop.zip_code
                                              }
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize:
                                  12,
                                color:
                                  "#64748b",
                              }}
                            >
                              {
                                text.noStops
                              }
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            padding: 15,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace:
                                "nowrap",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                            title={
                              load.broker_name ||
                              ""
                            }
                          >
                            {load.broker_name ||
                              text.noBroker}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: 15,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace:
                                "nowrap",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {driverName(
                              load.driver_id
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: 15,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace:
                                "nowrap",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {truckName(
                              load.truck_id
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: 15,
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {load.miles !==
                          null
                            ? `${load.miles} mi`
                            : "—"}
                        </div>

                        <div
                          style={{
                            padding: 15,
                            fontSize: 12,
                            fontWeight: 800,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatMoney(
                            load.rate
                          )}
                        </div>

                        <div
                          style={{
                            padding: 10,
                            minWidth: 0,
                          }}
                        >
                          <select
                            value={
                              load.status ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              changeStatus(
                                load,
                                event.target
                                  .value
                              )
                            }
                            style={{
                              width:
                                "100%",
                              minWidth:
                                0,
                              boxSizing:
                                "border-box",
                              padding:
                                "8px 9px",
                              borderRadius:
                                8,
                              border:
                                "1px solid #e2e8f0",
                              background:
                                statusBackground(
                                  load.status
                                ),
                              color:
                                statusColor(
                                  load.status
                                ),
                              fontSize:
                                11,
                              fontWeight:
                                800,
                              outline:
                                "none",
                              cursor:
                                "pointer",
                            }}
                          >
                            <option value="available">
                              Available
                            </option>

                            <option value="assigned">
                              Assigned
                            </option>

                            <option value="in_transit">
                              In Transit
                            </option>

                            <option value="delivered">
                              Delivered
                            </option>
                          </select>
                        </div>

                       
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "stretch",
  }}
>
  <button
    onClick={() => openDispatch(load)}
    style={{
      padding: "8px 10px",
      borderRadius: 7,
      border: "none",
      background: "#2563eb",
      color: "#ffffff",
      fontSize: 11,
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    {load.driver_id && load.truck_id
      ? text.manage
      : text.dispatch}
  </button>

  <button
    onClick={() => cancelLoad(load)}
    disabled={
      saving ||
      ["cancelled", "delivered"].includes(
        (load.status || "").toLowerCase()
      )
    }
    style={{
      padding: "8px 10px",
      borderRadius: 7,
      border: "1px solid #fecaca",
      background:
        saving ||
        ["cancelled", "delivered"].includes(
          (load.status || "").toLowerCase()
        )
          ? "#f1f5f9"
          : "#fef2f2",
      color:
        saving ||
        ["cancelled", "delivered"].includes(
          (load.status || "").toLowerCase()
        )
          ? "#94a3b8"
          : "#b91c1c",
      fontSize: 11,
      fontWeight: 800,
      cursor:
        saving ||
        ["cancelled", "delivered"].includes(
          (load.status || "").toLowerCase()
        )
          ? "not-allowed"
          : "pointer",
    }}
  >
    {text.cancelLoad}
  </button>
</div>

                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginTop: 22,
          }}
        >
          <InfoCard
            title={
              text.driverAssignment
            }
            text={
              text.driverAssignmentText
            }
          />

          <InfoCard
            title={
              text.truckAssignment
            }
            text={
              text.truckAssignmentText
            }
          />

          <InfoCard
            title={text.aiDispatch}
            text={
              text.aiDispatchText
            }
          />
        </div>
      </div>

      {selectedLoad && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width:
                "min(620px, 100%)",
              maxHeight: "90vh",
              overflowY:
                "auto",
              background:
                "#ffffff",
              borderRadius: 16,
              boxShadow:
                "0 25px 60px rgba(15,23,42,0.22)",
            }}
          >
            <div
              style={{
                padding:
                  "20px 22px",
                borderBottom:
                  "1px solid #e5e7eb",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap: 15,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    color:
                      "#64748b",
                  }}
                >
                  {text.dispatch}
                </div>

                <h2
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: 22,
                    fontWeight: 850,
                  }}
                >
                  {
                    selectedLoad.load_number
                  }
                </h2>
              </div>

              <button
                onClick={
                  closeDispatch
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border:
                    "1px solid #e2e8f0",
                  background:
                    "#ffffff",
                  color:
                    "#475569",
                  fontSize: 18,
                  cursor:
                    "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 22,
              }}
            >
              <div
                style={{
                  marginBottom: 20,
                  padding: 14,
                  borderRadius: 10,
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color:
                      "#64748b",
                    marginBottom:
                      9,
                    textTransform:
                      "uppercase",
                  }}
                >
                  {text.route}
                </div>

                {stopsForLoad(
                  selectedLoad.id
                ).length > 0 ? (
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: 10,
                    }}
                  >
                    {stopsForLoad(
                      selectedLoad.id
                    ).map(
                      (
                        stop,
                        index
                      ) => {
                        const isPickup =
                          stop.stop_type
                            .toLowerCase() ===
                          "pickup";

                        return (
                          <div
                            key={
                              stop.id
                            }
                            style={{
                              display:
                                "flex",
                              gap: 11,
                              position:
                                "relative",
                            }}
                          >
                            {index <
                              stopsForLoad(
                                selectedLoad.id
                              ).length -
                                1 && (
                              <div
                                style={{
                                  position:
                                    "absolute",
                                  left: 12,
                                  top: 27,
                                  bottom:
                                    -10,
                                  width: 1,
                                  background:
                                    "#cbd5e1",
                                }}
                              />
                            )}

                            <div
                              style={{
                                width: 24,
                                height: 24,
                                minWidth: 24,
                                borderRadius:
                                  999,
                                background:
                                  isPickup
                                    ? "#fff7ed"
                                    : "#eff6ff",
                                color:
                                  isPickup
                                    ? "#c2410c"
                                    : "#1d4ed8",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontSize:
                                  10,
                                fontWeight:
                                  900,
                                position:
                                  "relative",
                                zIndex:
                                  1,
                              }}
                            >
                              {
                                stop.stop_order
                              }
                            </div>

                            <div
                              style={{
                                minWidth:
                                  0,
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 7,
                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize:
                                      10,
                                    fontWeight:
                                      900,
                                    color:
                                      isPickup
                                        ? "#c2410c"
                                        : "#1d4ed8",
                                    textTransform:
                                      "uppercase",
                                  }}
                                >
                                  {stopTypeLabel(
                                    stop.stop_type
                                  )}
                                </span>

                                {isPickup &&
                                  stop.pickup_number && (
                                    <span
                                      style={{
                                        padding:
                                          "2px 6px",
                                        borderRadius:
                                          5,
                                        background:
                                          "#fff7ed",
                                        color:
                                          "#9a3412",
                                        fontSize:
                                          9,
                                        fontWeight:
                                          900,
                                      }}
                                    >
                                      PU{" "}
                                      {
                                        stop.pickup_number
                                      }
                                    </span>
                                  )}
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    2,
                                  fontSize:
                                    12,
                                  fontWeight:
                                    750,
                                }}
                              >
                                {
                                  stop.address ||
                                  "—"
                                }
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    2,
                                  display:
                                    "flex",
                                  gap: 8,
                                  flexWrap:
                                    "wrap",
                                  fontSize:
                                    11,
                                  color:
                                    "#64748b",
                                }}
                              >
                                <span>
                                  {
                                    stop.city ||
                                    "—"
                                  }

                                  {stop.state
                                    ? `, ${stop.state}`
                                    : ""}
                                </span>

                                {stop.zip_code && (
                                  <span
                                    style={{
                                      fontWeight:
                                        700,
                                      color:
                                        "#475569",
                                    }}
                                  >
                                    ZIP{" "}
                                    {
                                      stop.zip_code
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        "#64748b",
                    }}
                  >
                    {text.noStops}
                  </div>
                )}
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gap: 18,
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        11,
                      fontWeight:
                        800,
                      color:
                        "#475569",
                      marginBottom:
                        7,
                    }}
                  >
                    {
                      text.driverAssignment
                    }
                  </label>

                  <select
                    value={
                      selectedDriver
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedDriver(
                        event.target
                          .value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "11px 12px",
                      borderRadius:
                        9,
                      border:
                        "1px solid #cbd5e1",
                      background:
                        "#ffffff",
                      color:
                        "#111827",
                      fontSize:
                        13,
                    }}
                  >
                    <option value="">
                      {
                        text.selectDriver
                      }
                    </option>

                    {availableDrivers.map(
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
                            ? ` • ${driver.driver_number}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      fontSize:
                        11,
                      color:
                        "#64748b",
                    }}
                  >
                    {
                      text.driverAssignmentText
                    }
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        11,
                      fontWeight:
                        800,
                      color:
                        "#475569",
                      marginBottom:
                        7,
                    }}
                  >
                    {
                      text.truckAssignment
                    }
                  </label>

                  <select
                    value={
                      selectedTruck
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedTruck(
                        event.target
                          .value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "11px 12px",
                      borderRadius:
                        9,
                      border:
                        "1px solid #cbd5e1",
                      background:
                        "#ffffff",
                      color:
                        "#111827",
                      fontSize:
                        13,
                    }}
                  >
                    <option value="">
                      {
                        text.selectTruck
                      }
                    </option>

                    {availableTrucks.map(
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

                          {truck.make
                            ? ` • ${truck.make}`
                            : ""}

                          {truck.model
                            ? ` ${truck.model}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      fontSize:
                        11,
                      color:
                        "#64748b",
                    }}
                  >
                    {
                      text.truckAssignmentText
                    }
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        11,
                      fontWeight:
                        800,
                      color:
                        "#475569",
                      marginBottom:
                        7,
                    }}
                  >
                    {
                      text.selectTrailer
                    }
                  </label>

                  <select
                    value={
                      selectedTrailer
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedTrailer(
                        event.target
                          .value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "11px 12px",
                      borderRadius:
                        9,
                      border:
                        "1px solid #cbd5e1",
                      background:
                        "#ffffff",
                      color:
                        "#111827",
                      fontSize:
                        13,
                    }}
                  >
                    <option value="">
                      {
                        text.selectTrailer
                      }
                    </option>

                    {availableTrailers.map(
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
                            ? ` • ${trailer.trailer_type}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 18,
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
                  onClick={
                    closeDispatch
                  }
                  disabled={
                    saving
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      9,
                    border:
                      "1px solid #d1d5db",
                    background:
                      "#ffffff",
                    color:
                      "#374151",
                    fontWeight:
                      700,
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {text.cancel}
                </button>

                <button
                  onClick={
                    assignLoad
                  }
                  disabled={
                    saving
                  }
                  style={{
                    padding:
                      "11px 18px",
                    borderRadius:
                      9,
                    border: 0,
                    background:
                      saving
                        ? "#94a3b8"
                        : "#111827",
                    color:
                      "#ffffff",
                    fontWeight:
                      800,
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {saving
                    ? "..."
                    : text.dispatchLoad}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sequenceOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
            zIndex: 1100,
          }}
        >
          <div
            style={{
              width:
                "min(820px, 100%)",
              maxHeight: "90vh",
              overflowY:
                "auto",
              background:
                "#ffffff",
              borderRadius: 16,
              boxShadow:
                "0 25px 60px rgba(15,23,42,0.22)",
            }}
          >
            <div
              style={{
                padding:
                  "20px 22px",
                borderBottom:
                  "1px solid #e5e7eb",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap: 15,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    color:
                      "#64748b",
                  }}
                >
                  {text.sequence}
                </div>

                <h2
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: 22,
                    fontWeight: 850,
                  }}
                >
                  {
                    text.sequenceTitle
                  }
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize: 12,
                    color:
                      "#64748b",
                  }}
                >
                  {
                    text.sequenceSubtitle
                  }
                </p>
              </div>

              <button
                onClick={() =>
                  setSequenceOpen(
                    false
                  )
                }
                disabled={
                  sequenceSaving
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border:
                    "1px solid #e2e8f0",
                  background:
                    "#ffffff",
                  color:
                    "#475569",
                  fontSize: 18,
                  cursor:
                    sequenceSaving
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 22,
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <SequenceSelect
                  label={
                    text.sequenceDriver
                  }
                  value={
                    sequenceDriver
                  }
                  onChange={
                    setSequenceDriver
                  }
                  placeholder={
                    text.selectDriver
                  }
                  options={availableDrivers.map(
                    (driver) => ({
                      value:
                        driver.id,
                      label:
                        driver.full_name,
                    })
                  )}
                />

                <SequenceSelect
                  label={
                    text.sequenceTruck
                  }
                  value={
                    sequenceTruck
                  }
                  onChange={
                    setSequenceTruck
                  }
                  placeholder={
                    text.selectTruck
                  }
                  options={availableTrucks.map(
                    (truck) => ({
                      value:
                        truck.id,
                      label:
                        truck.unit_number,
                    })
                  )}
                />

                <SequenceSelect
                  label={
                    text.sequenceTrailer
                  }
                  value={
                    sequenceTrailer
                  }
                  onChange={
                    setSequenceTrailer
                  }
                  placeholder={
                    text.selectTrailer
                  }
                  options={availableTrailers.map(
                    (trailer) => ({
                      value:
                        trailer.id,
                      label:
                        trailer.unit_number,
                    })
                  )}
                />
              </div>

              <div
                style={{
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow:
                    "hidden",
                }}
              >
                <div
                  style={{
                    padding:
                      "13px 15px",
                    background:
                      "#f8fafc",
                    borderBottom:
                      "1px solid #e2e8f0",
                    fontSize: 11,
                    fontWeight: 800,
                    color:
                      "#475569",
                  }}
                >
                  {
                    text.sequenceOrder
                  }
                </div>

                <div>
                  {sequenceStops.map(
                    (
                      item,
                      index
                    ) => {
                      const isPickup =
                        item.loadStop.stop_type
                          .toLowerCase() ===
                        "pickup";

                      return (
                        <div
                          key={`${item.loadStop.id}-${index}`}
                          style={{
                            padding:
                              "14px 15px",
                            borderBottom:
                              index <
                              sequenceStops.length -
                                1
                                ? "1px solid #f1f5f9"
                                : "none",
                            display:
                              "flex",
                            gap: 13,
                            alignItems:
                              "center",
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              minWidth: 34,
                              borderRadius:
                                9,
                              background:
                                "#f1f5f9",
                              color:
                                "#334155",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize:
                                12,
                              fontWeight:
                                900,
                            }}
                          >
                            {index + 1}
                          </div>

                          <div
                            style={{
                              minWidth:
                                0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize:
                                    10,
                                  fontWeight:
                                    900,
                                  color:
                                    isPickup
                                      ? "#c2410c"
                                      : "#1d4ed8",
                                }}
                              >
                                {
                                  item.stopCode
                                }
                              </span>

                              <span
                                style={{
                                  fontSize:
                                    10,
                                  fontWeight:
                                    800,
                                  color:
                                    "#64748b",
                                }}
                              >
                                {
                                  item.load
                                    .load_number
                                }
                              </span>

                              {isPickup &&
                                item.loadStop
                                  .pickup_number && (
                                  <span
                                    style={{
                                      fontSize:
                                        9,
                                      fontWeight:
                                        900,
                                      color:
                                        "#9a3412",
                                      background:
                                        "#fff7ed",
                                      padding:
                                        "2px 6px",
                                      borderRadius:
                                        5,
                                    }}
                                  >
                                    PU{" "}
                                    {
                                      item
                                        .loadStop
                                        .pickup_number
                                    }
                                  </span>
                                )}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  4,
                                fontSize:
                                  12,
                                fontWeight:
                                  750,
                              }}
                            >
                              {
                                item.loadStop
                                  .address ||
                                "—"
                              }
                            </div>

                            <div
                              style={{
                                marginTop:
                                  2,
                                display:
                                  "flex",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                                fontSize:
                                  11,
                                color:
                                  "#64748b",
                              }}
                            >
                              <span>
                                {
                                  item
                                    .loadStop
                                    .city ||
                                  "—"
                                }

                                {item
                                  .loadStop
                                  .state
                                  ? `, ${item.loadStop.state}`
                                  : ""}
                              </span>

                              {item.loadStop
                                .zip_code && (
                                <span
                                  style={{
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  ZIP{" "}
                                  {
                                    item
                                      .loadStop
                                      .zip_code
                                  }
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              gap: 5,
                            }}
                          >
                            <button
                              onClick={() =>
                                moveSequenceStop(
                                  index,
                                  "up"
                                )
                              }
                              disabled={
                                index ===
                                  0 ||
                                sequenceSaving
                              }
                              style={{
                                padding:
                                  "5px 8px",
                                borderRadius:
                                  6,
                                border:
                                  "1px solid #dbe2ea",
                                background:
                                  "#ffffff",
                                color:
                                  index ===
                                    0
                                    ? "#cbd5e1"
                                    : "#334155",
                                fontSize:
                                  10,
                                fontWeight:
                                  800,
                                cursor:
                                  index ===
                                    0 ||
                                  sequenceSaving
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              ↑{" "}
                              {
                                text.moveUp
                              }
                            </button>

                            <button
                              onClick={() =>
                                moveSequenceStop(
                                  index,
                                  "down"
                                )
                              }
                              disabled={
                                index ===
                                  sequenceStops.length -
                                    1 ||
                                sequenceSaving
                              }
                              style={{
                                padding:
                                  "5px 8px",
                                borderRadius:
                                  6,
                                border:
                                  "1px solid #dbe2ea",
                                background:
                                  "#ffffff",
                                color:
                                  index ===
                                    sequenceStops.length -
                                      1
                                    ? "#cbd5e1"
                                    : "#334155",
                                fontSize:
                                  10,
                                fontWeight:
                                  800,
                                cursor:
                                  index ===
                                    sequenceStops.length -
                                      1 ||
                                  sequenceSaving
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              ↓{" "}
                              {
                                text.moveDown
                              }
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: 22,
                  paddingTop: 18,
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
                  onClick={() =>
                    setSequenceOpen(
                      false
                    )
                  }
                  disabled={
                    sequenceSaving
                  }
                  style={{
                    padding:
                      "11px 16px",
                    borderRadius:
                      9,
                    border:
                      "1px solid #d1d5db",
                    background:
                      "#ffffff",
                    color:
                      "#374151",
                    fontWeight:
                      700,
                    cursor:
                      sequenceSaving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {text.cancel}
                </button>

                <button
                  onClick={
                    createOperationalSequence
                  }
                  disabled={
                    sequenceSaving
                  }
                  style={{
                    padding:
                      "11px 18px",
                    borderRadius:
                      9,
                    border: 0,
                    background:
                      sequenceSaving
                        ? "#94a3b8"
                        : "#111827",
                    color:
                      "#ffffff",
                    fontWeight:
                      800,
                    cursor:
                      sequenceSaving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {sequenceSaving
                    ? "..."
                    : text.createSequence}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const headerStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "13px 15px",
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  borderBottom:
    "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  overflow: "hidden",
};

function StatCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border:
          "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#64748b",
          textTransform:
            "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 7,
          fontSize: 28,
          fontWeight: 850,
          color: "#111827",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          color: "#64748b",
        }}
      >
        {detail}
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
        border:
          "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 7,
          fontSize: 11,
          lineHeight: 1.6,
          color: "#64748b",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SequenceSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 10,
          fontWeight: 800,
          color: "#475569",
          marginBottom: 7,
        }}
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={{
          width: "100%",
          boxSizing:
            "border-box",
          padding:
            "10px 11px",
          borderRadius: 8,
          border:
            "1px solid #cbd5e1",
          background:
            "#ffffff",
          color: "#111827",
          fontSize: 12,
        }}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
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
  );
}