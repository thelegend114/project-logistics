"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

const TruckMap = dynamic(() => import("./TruckMap"), {
  ssr: false,
});

type Driver = {
  id: string;
  company_id: string | null;
  full_name: string;
  driver_number: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  medical_card_expiration: string | null;
  status: string | null;
  current_load_id: string | null;
};

type Alert = {
  id: string;
  driver_id: string | null;
  load_id: string | null;
  alert_type: string | null;
  severity: string | null;
  title: string | null;
  message: string | null;
  status: string | null;
  seen_at: string | null;
  created_at: string;
};

type Load = {
  id: string;
  load_number: string | null;
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
  pickup_unlocked: boolean;
};

type HOS = {
  id: string;
  event_type: string | null;
  event_time: string | null;
  location: string | null;
};

// Renombrado: "Document" tapaba el tipo global del DOM.
type LoadDocument = {
  id: string;
  load_id: string | null;
  driver_id: string | null;
  document_type: string | null;
  file_name: string | null;
  storage_path: string | null;
  status: string | null;
  uploaded_at: string | null;
};

type GPSLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
};

type SequenceStop = {
  id: string;
  load_id: string;
  stop_order: number;
  stop_type: string;
  address: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
};

type DocumentStop = {
  id: string;
  stop_order: number;
  stop_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
};

type DriverWorkStatus = "off_duty" | "hold" | "available" | "on_duty" | "driving";

const LOAD_SELECT =
  "id, load_number, broker_name, customer_name, origin_city, origin_state, pickup_address, destination_city, destination_state, delivery_address, pickup_date, delivery_date, miles, rate, status, driver_id, truck_id, trailer_id, pickup_unlocked";

function calculateDistanceMiles(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const earthRadiusMiles = 3958.8;

  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;

  const deltaLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const deltaLng = ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

async function getCurrentSequenceStop(loadId: string): Promise<SequenceStop | null> {
  try {
    const { data, error: stopsError } = await supabase
      .from("load_stops")
      .select("id, load_id, stop_order, stop_type, address, city, state, latitude, longitude, status")
      .eq("load_id", loadId)
      .order("stop_order", { ascending: true });

    if (stopsError) {
      console.error("SEQUENCE ENGINE - LOAD STOPS ERROR:", stopsError);
      return null;
    }

    if (!data || data.length === 0) {
      console.error("SEQUENCE ENGINE - NO LOAD STOPS:", loadId);
      return null;
    }

    const finishedStatuses = ["completed", "complete", "delivered", "cancelled", "canceled"];

    const stops: SequenceStop[] = data.map((stop) => ({
      id: String(stop.id),
      load_id: String(stop.load_id),
      stop_order: Number(stop.stop_order),
      stop_type: String(stop.stop_type ?? "").trim().toLowerCase(),
      address: stop.address ?? null,
      city: String(stop.city ?? ""),
      state: String(stop.state ?? ""),
      latitude:
        stop.latitude != null && Number.isFinite(Number(stop.latitude))
          ? Number(stop.latitude)
          : null,
      longitude:
        stop.longitude != null && Number.isFinite(Number(stop.longitude))
          ? Number(stop.longitude)
          : null,
      status: String(stop.status ?? "pending").trim().toLowerCase(),
    }));

    const invalidStop = stops.find(
      (stop) => !Number.isFinite(stop.stop_order) || !["pickup", "delivery"].includes(stop.stop_type)
    );

    if (invalidStop) {
      console.error("SEQUENCE ENGINE - INVALID STOP DATA:", invalidStop);
      return null;
    }

    const currentStop = stops.find((stop) => !finishedStatuses.includes(stop.status)) ?? null;

    console.log("SEQUENCE ENGINE - CURRENT STOP:", {
      loadId,
      totalStops: stops.length,
      currentStop,
    });

    return currentStop;
  } catch (error) {
    console.error("SEQUENCE ENGINE - UNEXPECTED ERROR:", error);
    return null;
  }
}

async function checkSequenceArrival(
  loadId: string,
  location: GPSLocation
): Promise<{
  arrived: boolean;
  stop: SequenceStop | null;
  distanceMiles: number | null;
}> {
  try {
    if (
      !loadId.trim() ||
      !Number.isFinite(location.lat) ||
      !Number.isFinite(location.lng) ||
      Math.abs(location.lat) > 90 ||
      Math.abs(location.lng) > 180
    ) {
      console.error("SEQUENCE ENGINE - INVALID GPS INPUT:", { loadId, location });
      return { arrived: false, stop: null, distanceMiles: null };
    }

    const currentStop = await getCurrentSequenceStop(loadId);

    if (!currentStop) {
      return { arrived: false, stop: null, distanceMiles: null };
    }

    if (
      currentStop.latitude === null ||
      currentStop.longitude === null ||
      !Number.isFinite(currentStop.latitude) ||
      !Number.isFinite(currentStop.longitude) ||
      Math.abs(currentStop.latitude) > 90 ||
      Math.abs(currentStop.longitude) > 180
    ) {
      console.error("SEQUENCE ENGINE - INVALID OR MISSING STOP COORDINATES:", currentStop);
      return { arrived: false, stop: currentStop, distanceMiles: null };
    }

    const distanceMiles = calculateDistanceMiles(
      location.lat,
      location.lng,
      currentStop.latitude,
      currentStop.longitude
    );

    if (!Number.isFinite(distanceMiles) || distanceMiles < 0) {
      console.error("SEQUENCE ENGINE - INVALID DISTANCE:", { loadId, currentStop, distanceMiles });
      return { arrived: false, stop: currentStop, distanceMiles: null };
    }

    const arrivalRadiusMiles = 0.1;
    const arrived = distanceMiles <= arrivalRadiusMiles;

    console.log("SEQUENCE ENGINE - ARRIVAL CHECK:", {
      loadId,
      stopId: currentStop.id,
      stopOrder: currentStop.stop_order,
      stopType: currentStop.stop_type,
      stopStatus: currentStop.status,
      distanceMiles,
      arrivalRadiusMiles,
      arrived,
    });

    return { arrived, stop: currentStop, distanceMiles };
  } catch (error) {
    console.error("SEQUENCE ENGINE - ARRIVAL CHECK ERROR:", error);
    return { arrived: false, stop: null, distanceMiles: null };
  }
}

export default function DriverPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    driverOperations: isES ? "Operaciones del conductor" : "Driver Operations",
    title: isES ? "Aplicación del Conductor" : "Driver App",
    subtitle: isES
      ? "Operaciones del conductor, HOS, documentos y monitoreo GPS."
      : "Driver operations, HOS, documents and GPS monitoring.",

    activeDriver: isES ? "Conductor activo" : "Active Driver",
    driver: isES ? "Conductor" : "Driver",
    driverProfile: isES ? "Perfil del conductor" : "Driver Profile",
    driverNumber: isES ? "Conductor #" : "Driver #",
    phone: isES ? "Teléfono" : "Phone",
    email: isES ? "Correo electrónico" : "Email",
    license: isES ? "Licencia" : "License",
    state: isES ? "Estado" : "State",
    licenseExpiration: isES ? "Vencimiento de licencia" : "License Expiration",
    medicalCard: isES ? "Tarjeta médica" : "Medical Card",
    status: isES ? "Estado" : "Status",
    noDriverSelected: isES ? "No hay conductor seleccionado." : "No driver selected.",

    dispatch: isES ? "Despacho" : "Dispatch",
    currentLoad: isES ? "Carga actual" : "Current Load",
    gpsAssociated: isES ? "El GPS está asociado con la carga activa." : "GPS is associated with the active load.",
    selectLoad: isES ? "Seleccionar carga" : "Select load",
    noBroker: isES ? "Sin broker" : "No broker",
    unknown: isES ? "Desconocido" : "Unknown",
    load: isES ? "Carga" : "Load",
    origin: isES ? "Origen" : "Origin",
    destination: isES ? "Destino" : "Destination",
    miles: isES ? "Millas" : "Miles",
    rate: isES ? "Tarifa" : "Rate",
    pickup: isES ? "Recogida" : "Pickup",
    delivery: isES ? "Entrega" : "Delivery",
    noLoadAssigned: isES ? "No hay carga asignada" : "No load assigned",
    noLoadAssignedDetail: isES
      ? "No hay ninguna carga asignada actualmente a este conductor."
      : "No load is currently assigned to this driver.",

    location: isES ? "Ubicación" : "Location",
    gpsTracking: isES ? "Seguimiento GPS" : "GPS Tracking",
    live: "LIVE",
    off: "OFF",
    gpsNotActive: isES ? "GPS no activo" : "GPS not active",
    gpsActive: isES ? "GPS activo" : "GPS active",
    requestingGps: isES ? "Solicitando permiso de GPS..." : "Requesting GPS permission...",
    gpsWaiting: isES ? "GPS activo — esperando ubicación..." : "GPS active — waiting for location...",
    gpsSyncError: isES
      ? "GPS activo — error de sincronización con la base de datos"
      : "GPS active — database sync error",
    gpsConnectionError: isES
      ? "GPS activo — error de conexión con la base de datos"
      : "GPS active — database connection error",
    trackingLoad: isES ? "Cargando seguimiento:" : "Tracking load:",
    noActiveLoad: isES ? "No hay carga activa seleccionada." : "No active load selected.",
    browserLocationWarning: isES
      ? "La ubicación está siendo recibida por el navegador, pero la última ubicación no pudo sincronizarse con la base de datos."
      : "Location is being received by the browser, but the latest location could not be synchronized with the database.",
    latitude: isES ? "Latitud" : "Latitude",
    longitude: isES ? "Longitud" : "Longitude",
    accuracy: isES ? "Precisión" : "Accuracy",
    speed: isES ? "Velocidad" : "Speed",
    heading: isES ? "Dirección" : "Heading",

    safety: isES ? "Seguridad" : "Safety",
    hosDutyStatus: isES ? "Estado de servicio HOS" : "HOS Duty Status",
    hosSubtitle: isES
      ? "Actualiza el estado de servicio actual del conductor activo."
      : "Update the active driver's current duty status.",
    offDuty: isES ? "Fuera de servicio" : "Off Duty",
    sleeper: isES ? "Durmiendo" : "Sleeper",
    driving: isES ? "Conduciendo" : "Driving",
    onDuty: isES ? "En servicio" : "On Duty",
    recentHosEvents: isES ? "Eventos HOS recientes" : "Recent HOS Events",
    records: isES ? "registros" : "records",
    noHosEvents: isES ? "No hay eventos HOS registrados." : "No HOS events recorded.",

    hoursOfService: isES ? "Horas de servicio" : "Hours of Service",
    hosClocks: isES ? "Relojes HOS" : "HOS Clocks",
    hosClockSubtitle: isES
      ? "Cálculos operativos HOS para el conductor activo."
      : "Operational HOS calculations for the active driver.",
    driveClock: isES ? "Reloj de conducción" : "Drive Clock",
    driveClockDescription: isES ? "Tiempo disponible para conducir." : "Time available for driving.",
    shiftClock: isES ? "Reloj de turno" : "Shift Clock",
    shiftClockDescription: isES ? "Tiempo disponible en el turno actual." : "Time available in the current shift.",
    cycleClock: isES ? "Reloj de ciclo" : "Cycle Clock",
    cycleClockDescription: isES
      ? "Tiempo disponible en el ciclo de 70 horas."
      : "Time available in the 70-hour cycle.",
    breakClock: isES ? "Reloj de descanso" : "Break Clock",
    breakClockDescription: isES
      ? "Tiempo restante para un descanso de 30 minutos."
      : "Time remaining toward a 30-minute break.",
    latestStatus: isES ? "Último estado" : "Latest status",
    shiftLimitReached: isES ? "Límite de turno alcanzado." : "Shift limit reached.",
    currentShiftCalculation: isES ? "Cálculo del turno actual." : "Current shift calculation.",
    calculatedFromHos: isES
      ? "Calculado a partir del historial disponible de eventos HOS."
      : "Calculated from available HOS event history.",
    breakAvailable: isES ? "Descanso de 30 minutos disponible." : "30-minute break available.",
    breakSatisfied: isES
      ? "Requisito de descanso de 30 minutos satisfecho."
      : "30-minute break requirement satisfied.",
    hosDisclaimer: isES
      ? "Estos relojes son cálculos operativos para la visibilidad de la aplicación del conductor. No son un registro ELD oficial hasta que se conecte una integración ELD autorizada."
      : "These clocks are operational calculations for Driver App visibility. They are not an official ELD record until an authorized ELD integration is connected.",

    loadAdministration: isES ? "Administración de carga" : "Load Administration",
    loadDocuments: isES ? "Documentos de carga" : "Load Documents",
    documentsSubtitle: isES
      ? "POD, BOL, confirmaciones de tarifa y otros documentos de carga."
      : "POD, BOL, rate confirmations and other load documents.",
    uploadDocument: isES ? "Subir documento" : "Upload Document",
    noDocuments: isES ? "No hay documentos" : "No documents",
    noDocumentsDetail: isES
      ? "No se han cargado documentos para esta carga."
      : "No documents uploaded for this load.",
    type: isES ? "Tipo" : "Type",
    file: isES ? "Archivo" : "File",
    uploaded: isES ? "Cargado" : "Uploaded",
    action: isES ? "Acción" : "Action",
    view: isES ? "Ver" : "View",

    uploadLoadDocument: isES ? "Subir documento de carga" : "Upload Load Document",
    attachDocumentation: isES
      ? "Adjunta documentación a la carga seleccionada."
      : "Attach documentation to the selected load.",
    documentType: isES ? "Tipo de documento" : "Document Type",
    chooseFile: isES ? "Archivo" : "File",
    fileRequirements: isES ? "PDF, JPG, PNG o WEBP. Máximo 15 MB." : "PDF, JPG, PNG or WEBP. Maximum 15 MB.",
    selected: isES ? "Seleccionado:" : "Selected:",
    cancel: isES ? "Cancelar" : "Cancel",
    upload: isES ? "Subir" : "Upload",
    uploading: isES ? "Subiendo..." : "Uploading...",

    deliveryStop: isES ? "Parada de entrega (POD)" : "Delivery stop (POD)",
    selectDeliveryStop: isES ? "Seleccionar parada de entrega" : "Select delivery stop",
    noDeliveryStops: isES
      ? "Esta carga no tiene paradas de entrega registradas."
      : "This load has no delivery stops registered.",
    invalidFileType: isES
      ? "Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP."
      : "File type not allowed. Use PDF, JPG, PNG or WEBP.",
    dismiss: isES ? "Cerrar" : "Dismiss",
    gotIt: isES ? "Entendido" : "Got it",

    selectDriverFirst: isES ? "Selecciona primero un conductor." : "Select a driver first.",
    selectLoadFirst: isES ? "Selecciona primero una carga." : "Select a load first.",
    chooseFileFirst: isES ? "Selecciona primero un archivo." : "Choose a file first.",
    maxFileSize: isES ? "El tamaño máximo del archivo es 15 MB." : "Maximum file size is 15 MB.",
    browserNoGps: isES ? "Este navegador no admite GPS." : "This browser does not support GPS.",
    assignLoadBeforeGps: isES
      ? "Selecciona o asigna una carga antes de iniciar el GPS."
      : "Select or assign a load before starting GPS.",
    gpsPermissionDenied: isES
      ? "El permiso de GPS fue rechazado por el navegador."
      : "GPS permission was denied by the browser.",
    gpsUnavailable: isES
      ? "La ubicación GPS no está disponible actualmente."
      : "GPS location is currently unavailable.",
    gpsTimeout: isES ? "La solicitud de GPS agotó el tiempo de espera." : "GPS request timed out.",
    gpsCouldNotObtain: isES ? "No se pudo obtener la ubicación GPS." : "Could not obtain GPS location.",

    documentUploadSuccess: isES ? "Documento cargado correctamente." : "Document uploaded successfully.",
    noStoragePath: isES ? "No hay ruta de almacenamiento disponible." : "No storage path available.",
    unexpectedUploadError: isES ? "Error inesperado al cargar el documento." : "Unexpected document upload error.",
  };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [hosEvents, setHosEvents] = useState<HOS[]>([]);
  const [documents, setDocuments] = useState<LoadDocument[]>([]);
  const [previousLoadDocuments, setPreviousLoadDocuments] = useState<LoadDocument[]>([]);

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedLoadId, setSelectedLoadId] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadAlerts, setLoadAlerts] = useState<Alert[]>([]);
  const [userRole, setUserRole] = useState("");
  const [authUserId, setAuthUserId] = useState("");

  const [driverWorkStatus, setDriverWorkStatus] = useState<DriverWorkStatus>("off_duty");

  const isDriveBlocked = (status: DriverWorkStatus): boolean => {
    return status === "off_duty" || status === "hold";
  };

  const [authReady, setAuthReady] = useState(false);

  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(text.gpsNotActive);
  const [gpsDatabaseError, setGpsDatabaseError] = useState(false);
  const [lastLocation, setLastLocation] = useState<GPSLocation | null>(null);
  const [lastGpsReceivedAt, setLastGpsReceivedAt] = useState<number | null>(null);
  const [gpsClockNow, setGpsClockNow] = useState(Date.now());

  const [navigationStop, setNavigationStop] = useState<SequenceStop | null>(null);

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState("POD");

  const [documentStops, setDocumentStops] = useState<DocumentStop[]>([]);
  const [selectedDocumentStopId, setSelectedDocumentStopId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [clockNow, setClockNow] = useState(Date.now());
  const [realtimeRetryKey, setRealtimeRetryKey] = useState(0);

  const gpsWatchId = useRef<number | null>(null);
  const gpsInsertInProgress = useRef(false);
  const sequenceProcessing = useRef(false);
  const messageTimer = useRef<number | null>(null);
  const realtimeRetryCount = useRef(0);
  const startGpsRef = useRef<() => void>(() => {});

  function normalizeLoadStatus(status: string | null) {
    return status?.toLowerCase().replace(/ /g, "_") || "";
  }

  // CORREGIDO: cancela el temporizador anterior para que un mensaje nuevo
  // no sea borrado antes de tiempo por el timeout del mensaje previo.
  function showMessage(value: string) {
    if (messageTimer.current !== null) {
      window.clearTimeout(messageTimer.current);
      messageTimer.current = null;
    }

    setMessage(value);

    messageTimer.current = window.setTimeout(() => {
      setMessage("");
      messageTimer.current = null;
    }, 6000);
  }

  function dismissMessage() {
    if (messageTimer.current !== null) {
      window.clearTimeout(messageTimer.current);
      messageTimer.current = null;
    }
    setMessage("");
  }

  function getCurrentLoad(loadList: Load[]) {
    return (
      loadList.find((load) => {
        const status = normalizeLoadStatus(load.status);

        return (
          status === "assigned" ||
          status === "in_progress" ||
          status === "at_pickup" ||
          status === "in_transit" ||
          status === "at_delivery"
        );
      }) || null
    );
  }

  function getNextLoad(loadList: Load[]) {
    const now = Date.now();
    return (
      loadList
        .filter((load) => {
          if (normalizeLoadStatus(load.status) !== "assigned") return false;
          if (!load.pickup_date) return false;
          const pickupTime = new Date(load.pickup_date).getTime();
          return pickupTime <= now;
        })
        .sort((a, b) => {
          const aDate = new Date(a.pickup_date!).getTime();
          const bDate = new Date(b.pickup_date!).getTime();
          return aDate - bDate;
        })[0] || null
    );
  }

  async function loadDriverHos(driverId: string) {
    const { data, error } = await supabase
      .from("hos_events")
      .select("id, event_type, event_time, location")
      .eq("driver_id", driverId)
      .order("event_time", { ascending: false })
      .limit(500);

    if (error) {
      showMessage(`HOS error: ${error.message}`);
      return;
    }

    setHosEvents((data || []) as HOS[]);
  }

  async function loadDocuments(loadId: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, load_id, driver_id, document_type, file_name, storage_path, status, uploaded_at")
      .eq("load_id", loadId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      showMessage(`Documents error: ${error.message}`);
      return;
    }

    setDocuments((data || []) as LoadDocument[]);
  }

  async function loadPreviousLoadDocuments(loadId: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, load_id, driver_id, document_type, file_name, storage_path, status, uploaded_at")
      .eq("load_id", loadId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Previous load documents error:", error);
      setPreviousLoadDocuments([]);
      return;
    }

    setPreviousLoadDocuments((data || []) as LoadDocument[]);
  }

  async function dismissLoadAlert(alert: Alert) {
    // Se quita de pantalla de inmediato y luego se marca como vista en la base de datos.
    setLoadAlerts((current) =>
      current.filter((item) => String(item.load_id) !== String(alert.load_id))
    );

    if (!selectedDriverId || !alert.load_id) return;

    const { error } = await supabase
      .from("alerts")
      .update({ seen_at: new Date().toISOString() })
      .eq("driver_id", selectedDriverId)
      .eq("load_id", alert.load_id)
      .eq("alert_type", "load_assigned")
      .is("seen_at", null);

    if (error) {
      console.error("ALERT MARK SEEN ERROR:", error);
    }
  }

  async function setCurrentLoad(loadId: string): Promise<boolean> {
    if (!selectedDriverId) {
      showMessage(text.selectDriverFirst);
      return false;
    }

    const currentLoadId = loadId || null;

    if (currentLoadId) {
      const selectedLoad = loads.find((load) => String(load.id) === String(currentLoadId));

      if (!selectedLoad) {
        showMessage(isES ? "No se encontró la carga seleccionada." : "The selected load was not found.");
        return false;
      }

      if (String(selectedLoad.driver_id) !== String(selectedDriverId)) {
        showMessage(
          isES
            ? "Esta carga no está asignada a este conductor."
            : "This load is not assigned to this driver."
        );
        return false;
      }

      const status = normalizeLoadStatus(selectedLoad.status);

      if (
        !["assigned", "in_progress", "at_pickup", "in_transit", "at_delivery"].includes(status)
      ) {
        showMessage(
          isES
            ? "Esta carga no está disponible para iniciar."
            : "This load is not available to start."
        );
        return false;
      }

      const currentDriver = drivers.find((driver) => String(driver.id) === String(selectedDriverId));
      const savedLoadId = currentDriver?.current_load_id;

      if (savedLoadId && String(savedLoadId) !== String(currentLoadId)) {
        const savedLoad = loads.find((load) => String(load.id) === String(savedLoadId));

        if (
          savedLoad &&
          ["at_pickup", "in_transit", "at_delivery"].includes(normalizeLoadStatus(savedLoad.status))
        ) {
          showMessage(
            isES
              ? "Termina la operación actual antes de cambiar de carga."
              : "Finish the current operation before changing loads."
          );
          return false;
        }
      }
    }

    const { data, error } = await supabase
      .from("drivers")
      .update({ current_load_id: currentLoadId })
      .eq("id", selectedDriverId)
      .select("id, current_load_id")
      .single();

    if (error) {
      console.error("CURRENT LOAD SAVE ERROR:", error);
      showMessage(
        isES
          ? `No se pudo guardar Current Load: ${error.message}`
          : `Could not save Current Load: ${error.message}`
      );
      return false;
    }

    if (
      !data ||
      String(data.id) !== String(selectedDriverId) ||
      String(data.current_load_id || "") !== String(currentLoadId || "")
    ) {
      console.error("CURRENT LOAD VERIFICATION FAILED:", { data, selectedDriverId, currentLoadId });
      showMessage(
        isES ? "Current Load no pudo ser verificado." : "Current Load could not be verified."
      );
      return false;
    }

    setSelectedLoadId(currentLoadId || "");

    setDrivers((current) =>
      current.map((driver) =>
        String(driver.id) === String(selectedDriverId)
          ? { ...driver, current_load_id: currentLoadId }
          : driver
      )
    );

    return true;
  }

  async function setHosStatus(status: string): Promise<boolean> {
    if (!selectedDriver) {
      showMessage(text.selectDriverFirst);
      return false;
    }

    const location = lastLocation
      ? JSON.stringify({
          latitude: lastLocation.lat,
          longitude: lastLocation.lng,
          accuracy: lastLocation.accuracy,
        })
      : null;

    const { error } = await supabase.from("hos_events").insert({
      driver_id: selectedDriver.id,
      event_type: status,
      event_time: new Date().toISOString(),
      location,
      source: "Project Driver",
    });

    if (error) {
      showMessage(
        isES
          ? `No se pudo guardar el evento HOS: ${error.message}`
          : `Could not save HOS event: ${error.message}`
      );
      return false;
    }

    await loadDriverHos(selectedDriver.id);
    return true;
  }

  async function updateDriverWorkStatus(nextStatus: "off_duty" | "hold" | "available") {
    if (!selectedDriverId) {
      showMessage(isES ? "No hay un conductor seleccionado." : "No driver is selected.");
      return;
    }

    const { data: driverProfile, error: driverError } = await supabase
      .from("drivers")
      .select("id, full_name, status")
      .eq("id", selectedDriverId)
      .single();

    if (driverError || !driverProfile) {
      showMessage(
        isES
          ? "No se encontró el perfil del conductor."
          : "The driver's profile could not be found."
      );
      return;
    }

    console.log("WORK STATUS: starting update", {
      driverId: driverProfile.id,
      previousStatus: driverProfile.status,
      requestedStatus: nextStatus,
    });

    const { data, error } = await supabase
      .from("drivers")
      .update({ status: nextStatus })
      .eq("id", driverProfile.id)
      .select("id, full_name, status")
      .single();

    if (error || !data) {
      console.error("WORK STATUS: UPDATE FAILED", {
        driverId: driverProfile.id,
        requestedStatus: nextStatus,
        error,
        data,
      });

      showMessage(
        isES
          ? `No se pudo actualizar el estado: ${error?.message || "Supabase no devolvió el registro."}`
          : `Status update failed: ${error?.message || "Supabase returned no record."}`
      );
      return;
    }

    const normalizedWorkStatus = String(data.status).trim().toLowerCase();

    setDrivers((currentDrivers) =>
      currentDrivers.map((driver) =>
        String(driver.id) === String(data.id) ? { ...driver, status: data.status } : driver
      )
    );

    if (String(selectedDriverId) === String(data.id)) {
      setDriverWorkStatus(normalizedWorkStatus as DriverWorkStatus);
    }

    if (nextStatus === "hold" || nextStatus === "off_duty") {
      stopGpsTracking();
    }

    if (nextStatus === "available") {
      const { data: assignedLoads, error: assignedLoadsError } = await supabase
        .from("loads")
        .select("id, load_number, status, pickup_date, pickup_unlocked, driver_id")
        .eq("driver_id", driverProfile.id)
        .eq("status", "assigned")
        .order("pickup_date", { ascending: true, nullsFirst: true });

      if (assignedLoadsError) {
        console.error("AVAILABLE: error loading assigned loads:", assignedLoadsError);
        showMessage(
          isES
            ? "No se pudieron verificar las cargas asignadas."
            : "Could not verify assigned loads."
        );
      } else {
        const firstEligibleLoad = (assignedLoads ?? [])[0];

        if (firstEligibleLoad && !firstEligibleLoad.pickup_unlocked) {
          const { data: unlockedLoad, error: unlockError } = await supabase
            .from("loads")
            .update({ pickup_unlocked: true })
            .eq("id", firstEligibleLoad.id)
            .eq("driver_id", driverProfile.id)
            .eq("status", "assigned")
            .eq("pickup_unlocked", false)
            .select("id, load_number, status, pickup_date, pickup_unlocked, driver_id")
            .maybeSingle();

          if (unlockError) {
            console.error("AVAILABLE: failed to unlock load:", unlockError);
            showMessage(
              isES
                ? "No se pudo desbloquear la primera carga."
                : "Could not unlock the first load."
            );
          } else if (unlockedLoad) {
            setLoads((currentLoads) =>
              currentLoads.map((load) =>
                load.id === unlockedLoad.id
                  ? { ...load, pickup_unlocked: unlockedLoad.pickup_unlocked }
                  : load
              )
            );
          } else {
            await loadInitialData();
          }
        }
      }
    }

    setSelectedDriverId(data.id);
  }

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) || null,
    [drivers, selectedDriverId]
  );

  const driverLoads = useMemo(() => {
    return loads
      .filter(
        (load) =>
          String(load.driver_id) === String(selectedDriverId) &&
          normalizeLoadStatus(load.status) !== "cancelled"
      )
      .sort((a, b) => {
        const aTime = a.pickup_date ? new Date(a.pickup_date).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.pickup_date ? new Date(b.pickup_date).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
  }, [loads, selectedDriverId]);

  const selectableLoads = useMemo(
    () =>
      driverLoads.filter((load) =>
        ["assigned", "at_pickup", "in_transit", "at_delivery"].includes(
          normalizeLoadStatus(load.status)
        )
      ),
    [driverLoads]
  );

  const selectedLoad = useMemo(
    () => driverLoads.find((load) => String(load.id) === String(selectedLoadId)) || null,
    [driverLoads, selectedLoadId]
  );

  const activeLoad = useMemo(() => getCurrentLoad(driverLoads), [driverLoads]);

  const previousDocumentsComplete = useMemo(() => {
    return ["POD", "BOL"].every((type) =>
      previousLoadDocuments.some(
        (doc) => doc.document_type === type && doc.status === "uploaded"
      )
    );
  }, [previousLoadDocuments]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGpsClockNow(Date.now());
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  const gpsReceivingRecently =
    lastGpsReceivedAt !== null && gpsClockNow - lastGpsReceivedAt < 90000;

  const gpsSignalActive = gpsTracking || gpsReceivingRecently;

  const gpsDisplayStatus = gpsTracking
    ? gpsStatus
    : gpsReceivingRecently
      ? isES
        ? "GPS recibido en tiempo real"
        : "GPS received in real time"
      : gpsStatus;

  // CORREGIDO: antes faltaba el addEventListener, por lo que la reconexión
  // del GPS al volver a la aplicación nunca se ejecutaba.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      // "available" no se incluye: el botón Available detiene el GPS a propósito.
      const isShiftActive = driverWorkStatus === "driving" || driverWorkStatus === "on_duty";

      if (isShiftActive && gpsWatchId.current === null) {
        console.log("Uber Guard: Reconectando GPS tras volver a la aplicación...");
        startGpsRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [driverWorkStatus]);

  useEffect(() => {
    const rawStatus = selectedDriver?.status;

    if (!rawStatus) return;

    const normalizedStatus = String(rawStatus)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    const validStatuses = ["off_duty", "hold", "available", "on_duty", "driving"] as const;

    const isValidStatus = (status: string): status is DriverWorkStatus => {
      return validStatuses.some((validStatus) => validStatus === status);
    };

    if (!isValidStatus(normalizedStatus)) {
      console.warn("DRIVE: estado de conductor no reconocido:", rawStatus);
      return;
    }

    setDriverWorkStatus(normalizedStatus);
  }, [selectedDriver?.id, selectedDriver?.status]);

  useEffect(() => {
    void loadInitialData();

    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 60000);

    return () => {
      window.clearInterval(timer);
      if (messageTimer.current !== null) {
        window.clearTimeout(messageTimer.current);
        messageTimer.current = null;
      }
      if (gpsWatchId.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchId.current);
        gpsWatchId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedDriverId) return;

    let isActive = true;
    let retryTimer: number | null = null;
    const driverId = String(selectedDriverId);

    const channel = supabase.channel(`driver-channel-${driverId}`);

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "drivers",
        filter: `id=eq.${driverId}`,
      },
      (payload) => {
        if (!isActive) return;

        console.log("REALTIME RAW DRIVERS EVENT:", payload);

        const updatedDriver = payload.new as {
          id: string;
          status: string | null;
          current_load_id: string | null;
        };

        const receivedDriverId = String(updatedDriver.id);

        console.log("REALTIME DRIVER ID RECEIVED:", receivedDriverId);
        console.log("REALTIME DRIVER STATUS RECEIVED:", updatedDriver.status);

        // Doble seguridad: ignorar cualquier otro conductor.
        if (receivedDriverId !== driverId) {
          console.log("REALTIME DRIVER IGNORED: different driver", {
            receivedDriverId,
            expectedDriverId: driverId,
          });
          return;
        }

        const normalizedStatus = String(updatedDriver.status ?? "")
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");

        console.log("DRIVE REALTIME DRIVER UPDATE:", {
          id: receivedDriverId,
          status: normalizedStatus,
          current_load_id: updatedDriver.current_load_id,
        });

        setDrivers((currentDrivers) =>
          currentDrivers.map((driver) =>
            String(driver.id) === receivedDriverId
              ? {
                  ...driver,
                  status: updatedDriver.status ?? driver.status,
                  current_load_id: updatedDriver.current_load_id,
                }
              : driver
          )
        );

        const validStatuses = ["off_duty", "hold", "available", "on_duty", "driving"] as const;

        if (validStatuses.some((status) => status === normalizedStatus)) {
          setDriverWorkStatus(normalizedStatus as DriverWorkStatus);
        }

        setSelectedLoadId(updatedDriver.current_load_id ?? "");
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "loads",
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        if (!isActive) return;

        console.log("DRIVE REALTIME LOAD EVENT RECEIVED:", payload);

        if (payload.eventType === "DELETE") {
          const deletedLoad = payload.old as { id?: string };
          if (!deletedLoad.id) return;

          const deletedLoadId = String(deletedLoad.id);

          setLoads((currentLoads) =>
            currentLoads.filter((load) => String(load.id) !== deletedLoadId)
          );

          setSelectedLoadId((currentId) => (String(currentId) === deletedLoadId ? "" : currentId));
          return;
        }

        const newLoad = payload.new as Load;
        if (!newLoad?.id) return;

        const newLoadId = String(newLoad.id);
        const normalizedStatus = normalizeLoadStatus(newLoad.status);
        const isCancelled = normalizedStatus === "cancelled";

        setLoads((currentLoads) => {
          const exists = currentLoads.some((load) => String(load.id) === newLoadId);

          if (exists) {
            return currentLoads.map((load) =>
              String(load.id) === newLoadId ? { ...load, ...newLoad } : load
            );
          }

          return [newLoad, ...currentLoads];
        });

        if (isCancelled) {
          setSelectedLoadId((currentId) => (String(currentId) === newLoadId ? "" : currentId));
        }
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        if (!isActive) return;

        const newAlert = payload.new as Alert;
        if (newAlert.alert_type !== "load_assigned") return;

        setLoadAlerts((current) =>
          current.some((alert) => String(alert.id) === String(newAlert.id))
            ? current
            : [newAlert, ...current]
        );
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "gps_events",
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        console.log("REALTIME RAW GPS EVENT:", payload);

        if (!isActive) {
          console.log("GPS REALTIME IGNORED: subscription inactive");
          return;
        }

        const gpsEvent = payload.new as {
          id?: string;
          driver_id?: string;
          load_id?: string | null;
          latitude: number;
          longitude: number;
          recorded_at?: string | null;
        };

        console.log("GPS REALTIME COORDINATES:", {
          eventId: gpsEvent.id,
          driverIdReceived: gpsEvent.driver_id,
          loadIdReceived: gpsEvent.load_id,
          latitude: gpsEvent.latitude,
          longitude: gpsEvent.longitude,
          recordedAt: gpsEvent.recorded_at,
          receivedAt: new Date().toISOString(),
        });

        setLastLocation({
          lat: gpsEvent.latitude,
          lng: gpsEvent.longitude,
          accuracy: 0,
          speed: null,
          heading: null,
        });

        setLastGpsReceivedAt(Date.now());
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "hos_events",
        filter: `driver_id=eq.${driverId}`,
      },
      async () => {
        if (!isActive) return;
        await loadDriverHos(driverId);
      }
    );

    channel.subscribe((status, err) => {
      if (!isActive) return;
      console.log("DRIVE REALTIME SUBSCRIBE STATUS:", status, err);

      if (status === "SUBSCRIBED") {
        realtimeRetryCount.current = 0;
        return;
      }

      if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("DRIVE REALTIME CONNECTION FAILED:", { status, error: err });

        // CORREGIDO: antes solo se eliminaba el canal y nunca se volvía a suscribir.
        // Ahora se reinicia este efecto (máximo 5 intentos) para crear un canal nuevo.
        if (realtimeRetryCount.current < 5 && retryTimer === null) {
          realtimeRetryCount.current += 1;

          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            if (!isActive) return;
            console.log("Intentando reconectar canal de Realtime...");
            setRealtimeRetryKey((key) => key + 1);
          }, 5000);
        }
      }
    });

    return () => {
      isActive = false;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [selectedDriverId, realtimeRetryKey]);

  useEffect(() => {
    if (!selectedDriverId) {
      setSelectedLoadId("");
      return;
    }

    const driverLoadsForEffect = loads.filter(
      (load) =>
        String(load.driver_id) === String(selectedDriverId) &&
        ["assigned", "in_progress", "at_pickup", "in_transit", "at_delivery"].includes(
          normalizeLoadStatus(load.status)
        )
    );

    const currentDriver = drivers.find((driver) => String(driver.id) === String(selectedDriverId));

    const selectedLoadForEffect = driverLoadsForEffect.find(
      (load) => String(load.id) === String(selectedLoadId)
    );

    if (selectedLoadForEffect) return;

    const savedCurrentLoad = currentDriver?.current_load_id
      ? driverLoadsForEffect.find(
          (load) => String(load.id) === String(currentDriver.current_load_id)
        )
      : null;

    if (savedCurrentLoad) {
      setSelectedLoadId(savedCurrentLoad.id);
      return;
    }

    const active = driverLoadsForEffect.find((load) =>
      ["in_progress", "at_pickup", "in_transit", "at_delivery"].includes(
        normalizeLoadStatus(load.status)
      )
    );

    if (active) {
      setSelectedLoadId(active.id);
      return;
    }

    const assignedLoad = driverLoadsForEffect.find(
      (load) => normalizeLoadStatus(load.status) === "assigned"
    );

    setSelectedLoadId(assignedLoad?.id ?? "");
  }, [selectedDriverId, loads, drivers, selectedLoadId]);

  useEffect(() => {
    if (!selectedDriverId) {
      setLoadAlerts([]);
      return;
    }

    setLoadAlerts((current) =>
      current.filter((alert) => {
        if (!alert.load_id) return false;

        const relatedLoad = loads.find((load) => String(load.id) === String(alert.load_id));

        if (!relatedLoad) return true;

        return normalizeLoadStatus(relatedLoad.status) === "assigned";
      })
    );
  }, [loads, selectedDriverId]);

  useEffect(() => {
    if (!gpsTracking) {
      setGpsStatus(text.gpsNotActive);
    }
  }, [language, gpsTracking]);

  useEffect(() => {
    if (selectedLoadId) {
      void loadDocuments(selectedLoadId);
    } else {
      setDocuments([]);
    }
  }, [selectedLoadId]);

  // NUEVO: cargar las paradas de la carga cuando se abre el modal de documentos.
  // Sin esto el selector de parada del POD no tenía datos ni existía en pantalla.
  useEffect(() => {
    if (!documentModalOpen || !selectedLoadId) {
      setDocumentStops([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("load_stops")
        .select("id, stop_order, stop_type, address, city, state")
        .eq("load_id", selectedLoadId)
        .order("stop_order", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("DOCUMENT STOPS LOAD ERROR:", error);
        setDocumentStops([]);
        return;
      }

      setDocumentStops(
        (data || []).map((stop) => ({
          id: String(stop.id),
          stop_order: Number(stop.stop_order),
          stop_type: String(stop.stop_type ?? "").trim().toLowerCase(),
          address: stop.address ?? null,
          city: stop.city ?? null,
          state: stop.state ?? null,
        }))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [documentModalOpen, selectedLoadId]);

  const deliveryStops = useMemo(
    () =>
      documentStops.filter((stop) => ["delivery", "dropoff", "drop_off"].includes(stop.stop_type)),
    [documentStops]
  );

  // Si el POD solo tiene una parada de entrega posible, se selecciona sola.
  useEffect(() => {
    if (!documentModalOpen) return;
    if (String(documentType).trim().toUpperCase() !== "POD") return;
    if (selectedDocumentStopId) return;

    if (deliveryStops.length === 1) {
      setSelectedDocumentStopId(deliveryStops[0].id);
    }
  }, [documentModalOpen, documentType, deliveryStops, selectedDocumentStopId]);

  async function loadInitialData() {
    setLoading(true);
    setAuthReady(false);
    setMessage("");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData?.user ?? null;

      if (authError) {
        showMessage(`Authentication error: ${authError.message}`);
        return;
      }

      if (!user) {
        setUserRole("");
        setDrivers([]);
        setLoads([]);
        setSelectedDriverId("");
        setSelectedLoadId("");
        return;
      }

      setAuthUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        showMessage(`Profile error: ${profileError.message}`);
      }

      const role = profile?.role?.toLowerCase() || "";
      setUserRole(role);

      const driverSelect =
        "id, company_id, full_name, driver_number, phone, email, license_number, license_state, license_expiration, medical_card_expiration, status, current_load_id";

      if (role === "driver") {
        const { data: driverByUser } = await supabase
          .from("drivers")
          .select(driverSelect)
          .eq("user_id", user.id)
          .maybeSingle();

        let currentDriver = driverByUser as Driver | null;

        if (!currentDriver && user.email) {
          const { data: driverByEmail } = await supabase
            .from("drivers")
            .select(driverSelect)
            .ilike("email", user.email)
            .maybeSingle();

          currentDriver = driverByEmail as Driver | null;
        }

        if (!currentDriver) {
          showMessage(
            isES
              ? "No se encontró el perfil del conductor."
              : "No driver profile was found for this account."
          );
          return;
        }

        const driver = currentDriver;
        setDrivers([driver]);
        setSelectedDriverId(driver.id);

        const { data: alertData, error: alertsError } = await supabase
          .from("alerts")
          .select("id, driver_id, load_id, alert_type, severity, title, message, status, seen_at, created_at")
          .eq("driver_id", driver.id)
          .eq("alert_type", "load_assigned")
          .is("seen_at", null)
          .order("created_at", { ascending: false });

        if (alertsError) {
          console.error("ALERTS LOAD ERROR:", alertsError);
        }

        setLoadAlerts((alertData || []) as Alert[]);

        const { data: driverLoadData, error: driverLoadsError } = await supabase
          .from("loads")
          .select(LOAD_SELECT)
          .eq("driver_id", driver.id)
          .order("pickup_date", { ascending: true, nullsFirst: true });

        if (driverLoadsError) {
          showMessage(`Load error: ${driverLoadsError.message}`);
          return;
        }

        let driverLoadList = (driverLoadData || []) as Load[];

        const firstAssignedLoad = driverLoadList.find(
          (load) => load.status === "assigned" && !load.pickup_unlocked
        );

        if (firstAssignedLoad) {
          const { data: unlockedData, error: unlockErr } = await supabase
            .from("loads")
            .update({ pickup_unlocked: true })
            .eq("id", firstAssignedLoad.id)
            .select(LOAD_SELECT)
            .maybeSingle();

          if (!unlockErr && unlockedData) {
            driverLoadList = driverLoadList.map((load) =>
              load.id === unlockedData.id ? (unlockedData as Load) : load
            );
          }
        }

        setLoads(driverLoadList);

        if (driver.current_load_id) {
          const savedCurrent = driverLoadList.find(
            (load) => String(load.id) === String(driver.current_load_id)
          );

          if (savedCurrent) {
            setSelectedLoadId(savedCurrent.id);
          }
        } else {
          const active = driverLoadList.find((load) => {
            const status = normalizeLoadStatus(load.status);
            return status === "at_pickup" || status === "in_transit" || status === "at_delivery";
          });

          setSelectedLoadId(active?.id || "");
        }

        const normalizedDriverStatus = String(driver.status || "off_duty")
          .toLowerCase()
          .replace(/ /g, "_");

        if (["off_duty", "hold", "available", "on_duty", "driving"].includes(normalizedDriverStatus)) {
          setDriverWorkStatus(normalizedDriverStatus as DriverWorkStatus);
        }

        await loadDriverHos(driver.id);
        return;
      }

      const [driversResult, loadsResult] = await Promise.all([
        supabase.from("drivers").select(driverSelect).order("full_name", { ascending: true }),
        supabase.from("loads").select(LOAD_SELECT).order("created_at", { ascending: false }),
      ]);

      if (driversResult.error) {
        showMessage(`Driver error: ${driversResult.error.message}`);
      }

      if (loadsResult.error) {
        showMessage(`Load error: ${loadsResult.error.message}`);
      }

      const driverData = (driversResult.data || []) as Driver[];
      const loadData = (loadsResult.data || []) as Load[];

      setDrivers(driverData);
      setLoads(loadData);

      if (driverData.length > 0) {
        const savedDriverId =
          typeof window !== "undefined"
            ? localStorage.getItem("project-logistics-admin-selected-driver")
            : null;

        const defaultDriver =
          driverData.find((driver) => String(driver.id) === String(savedDriverId)) || driverData[0];

        setSelectedDriverId(defaultDriver.id);

        const defaultLoads = loadData.filter(
          (load) => String(load.driver_id) === String(defaultDriver.id)
        );

        const savedCurrent = defaultDriver.current_load_id
          ? defaultLoads.find((load) => String(load.id) === String(defaultDriver.current_load_id))
          : null;

        const driverStatus = normalizeLoadStatus(defaultDriver.status);

        if (["off_duty", "hold", "available"].includes(driverStatus)) {
          setSelectedLoadId("");
        } else if (savedCurrent) {
          setSelectedLoadId(savedCurrent.id);
        } else {
          const active = defaultLoads.find((load) =>
            ["assigned", "at_pickup", "in_transit", "at_delivery"].includes(
              normalizeLoadStatus(load.status)
            )
          );

          setSelectedLoadId(active?.id || "");
        }

        await loadDriverHos(defaultDriver.id);
      }
    } catch (error) {
      console.error("DRIVE INITIALIZATION ERROR:", error);
      showMessage(
        error instanceof Error
          ? `Drive initialization error: ${error.message}`
          : "Drive initialization error."
      );

      setDrivers([]);
      setLoads([]);
      setSelectedDriverId("");
      setSelectedLoadId("");
      setHosEvents([]);
      setDocuments([]);
    } finally {
      setAuthReady(true);
      setLoading(false);
    }
  }

 
async function startDrive(): Promise<boolean> {
  if (!selectedLoad) {
    showMessage(text.selectLoadFirst);
    return false;
  }

  if (!selectedDriver) {
    showMessage(text.selectDriverFirst);
    return false;
  }

  if (!navigator.geolocation) {
    showMessage(text.browserNoGps);
    return false;
  }

  if (gpsWatchId.current !== null && !gpsTracking) {
    showMessage(
      isES
        ? "El estado del GPS no está sincronizado. Detén el GPS e inténtalo nuevamente."
        : "GPS state is not synchronized. Stop GPS and try again."
    );
    return false;
  }

  if (
    latestHosEvent?.event_type?.trim().toLowerCase() === "home time"
  ) {
    showMessage(
      isES
        ? "No puedes iniciar la conducción mientras tu estado HOS sea Home Time."
        : "You cannot start driving while your HOS status is Home Time."
    );
    return false;
  }

  const loadId = selectedLoad.id;
  const driverId = selectedDriver.id;
  const loadNumber = selectedLoad.load_number || "";
  const previousDriverStatus = selectedDriver.status;
  const previousCurrentLoadId = selectedDriver.current_load_id ?? null;
  const currentStatus = normalizeLoadStatus(selectedLoad.status);

  // START DRIVE puede comenzar una carga asignada o continuar
  // una carga cuyo flujo de paradas ya está en progreso.
  if (!["assigned", "in_progress"].includes(currentStatus)) {
    showMessage(
      isES
        ? "START DRIVE solo puede iniciar una carga asignada o continuar una carga en progreso."
        : "START DRIVE can only begin an assigned load or continue a load in progress."
    );
    return false;
  }

  if (!selectedLoad.pickup_unlocked) {
    showMessage(
      isES
        ? "Esta carga está bloqueada hasta que corresponda iniciar el período de trabajo."
        : "This load is locked until it is eligible to begin the work period."
    );
    return false;
  }

  if (selectedLoad.pickup_date) {
    const pickupTime = new Date(selectedLoad.pickup_date).getTime();

    if (!Number.isNaN(pickupTime) && pickupTime > Date.now()) {
      showMessage(
        isES
          ? "Esta carga todavía es futura."
          : "This load is still scheduled for the future."
      );
      return false;
    }
  }

  // Verificar en Supabase que la carga continúa asignada al conductor.
  const { data: loadCheck, error: loadCheckError } = await supabase
    .from("loads")
    .select("id, driver_id, status, pickup_unlocked, pickup_date")
    .eq("id", loadId)
    .eq("driver_id", driverId)
    .maybeSingle();

  if (
    loadCheckError ||
    !loadCheck ||
    !["assigned", "in_progress"].includes(
      normalizeLoadStatus(loadCheck.status)
    )
  ) {
    console.error("START DRIVE LOAD CHECK:", loadCheckError, loadCheck);

    showMessage(
      isES
        ? "La carga ya no está disponible para iniciar o continuar."
        : "The load is no longer available to start or continue."
    );
    return false;
  }

  if (!loadCheck.pickup_unlocked) {
    showMessage(
      isES
        ? "La carga continúa bloqueada en Supabase."
        : "The load is still locked in Supabase."
    );
    return false;
  }

  if (loadCheck.pickup_date) {
    const pickupTime = new Date(loadCheck.pickup_date).getTime();

    if (!Number.isNaN(pickupTime) && pickupTime > Date.now()) {
      showMessage(
        isES
          ? "La fecha de recogida todavía es futura."
          : "The pickup date is still in the future."
      );
      return false;
    }
  }

  // Conservar el vínculo de la carga activa con el conductor.
  const currentLoadSaved = await setCurrentLoad(loadId);

  if (!currentLoadSaved) {
    return false;
  }

  const { data: driverData, error: driverError } = await supabase
    .from("drivers")
    .update({ status: "driving" })
    .eq("id", driverId)
    .select("id, status")
    .maybeSingle();

  if (
    driverError ||
    !driverData ||
    driverData.status !== "driving"
  ) {
    console.error("START DRIVE DRIVER UPDATE:", driverError, driverData);

    showMessage(
      isES
        ? `No se pudo guardar Driving: ${driverError?.message ?? "No se confirmó la actualización."}`
        : `Could not save Driving: ${driverError?.message ?? "The update was not confirmed."}`
    );
    return false;
  }

  // Registrar HOS antes de iniciar el GPS.
  const hosSaved = await setHosStatus("Driving");

  if (!hosSaved) {
    console.error("START DRIVE HOS FAILED");

    const { error: rollbackError } = await supabase
      .from("drivers")
      .update({
        status: previousDriverStatus,
        current_load_id: previousCurrentLoadId,
      })
      .eq("id", driverId)
      .eq("status", "driving");

    if (rollbackError) {
      console.error("START DRIVE ROLLBACK FAILED:", rollbackError);

      showMessage(
        isES
          ? "Falló HOS y no se pudo restaurar el conductor. Verifica Supabase antes de continuar."
          : "HOS failed and the driver could not be restored. Verify Supabase before continuing."
      );
      return false;
    }

    setDrivers((current) =>
      current.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              status: previousDriverStatus,
              current_load_id: previousCurrentLoadId,
            }
          : driver
      )
    );

   setDriverWorkStatus(
  (previousDriverStatus ?? "available") as DriverWorkStatus
);

    showMessage(
      isES
        ? "No se guardó HOS. Se restauró el estado anterior del conductor y no se inició el GPS."
        : "HOS was not saved. The driver's previous status was restored and GPS was not started."
    );

    return false;
  }

  setDrivers((current) =>
    current.map((driver) =>
      driver.id === driverId
        ? { ...driver, status: "driving", current_load_id: loadId }
        : driver
    )
  );

  setDriverWorkStatus("driving");

  // Mantener la función de rastreo existente sin cambios.
  startGpsTracking();

  showMessage(
    isES
      ? `START DRIVE iniciado para ${loadNumber}.`
      : `START DRIVE started for ${loadNumber}.`
  );

  return true;
}


  async function processSequenceArrival(arrivedStop: {
    id: string;
    stop_order: number;
    stop_type: string;
  }): Promise<boolean> {
    if (sequenceProcessing.current) {
      console.warn("SEQUENCE ENGINE - ARRIVAL SKIPPED: already processing");
      return false;
    }

    sequenceProcessing.current = true;

    try {
      if (!selectedDriverId || !selectedLoadId || !arrivedStop?.id) {
        console.warn("SEQUENCE ENGINE - ARRIVAL SKIPPED: missing ids", {
          selectedDriverId,
          selectedLoadId,
          arrivedStopId: arrivedStop?.id ?? null,
        });
        return false;
      }

      const driverId = selectedDriverId;
      const loadId = selectedLoadId;

      const { data: loadRecord, error: loadCheckError } = await supabase
        .from("loads")
        .select("id, driver_id, status")
        .eq("id", loadId)
        .eq("driver_id", driverId)
        .neq("status", "cancelled")
        .maybeSingle();

      if (loadCheckError || !loadRecord) {
        console.error("SEQUENCE ENGINE - LOAD CHECK ERROR:", loadCheckError);
        return false;
      }

      const currentStop = await getCurrentSequenceStop(loadId);

      if (!currentStop || currentStop.id !== arrivedStop.id) {
        console.warn("SEQUENCE ENGINE - STALE ARRIVAL IGNORED:", {
          arrivedStopId: arrivedStop.id,
          currentStopId: currentStop?.id ?? null,
        });
        return false;
      }

      const stopType = String(currentStop.stop_type ?? "")
        .trim()
        .toLowerCase();

      if (stopType !== "pickup" && stopType !== "delivery") {
        console.error("SEQUENCE ENGINE - UNKNOWN STOP TYPE:", currentStop.stop_type);
        return false;
      }

      const nextStopStatus = stopType === "pickup" ? "at_pickup" : "at_delivery";

      // CORREGIDO: antes solo aceptaba "pending". Una parada "in_progress"
      // (como la parada 1 de tu carga) se tomaba como ya procesada y la llegada
      // nunca se registraba. Ahora ambos estados pueden recibir la llegada.
      const arrivableStatuses = ["pending", "in_progress"];

      // No volver a procesar una parada que ya cambió de estado (at_pickup, completed...).
      if (!arrivableStatuses.includes(currentStop.status)) {
        console.log("SEQUENCE ENGINE - STOP ALREADY PROCESSED:", {
          stopId: currentStop.id,
          status: currentStop.status,
        });
        return false;
      }

      // Registrar la llegada a la parada exacta confirmada por el mapa.
      const { data: updatedStop, error: stopError } = await supabase
        .from("load_stops")
        .update({ status: nextStopStatus })
        .eq("id", currentStop.id)
        .eq("load_id", loadId)
        .eq("status", currentStop.status)
        .select("id, status")
        .maybeSingle();

      if (stopError || !updatedStop) {
        console.error("SEQUENCE ENGINE - STOP UPDATE ERROR:", stopError);
        return false;
      }

      // Sincronizar el estado de la carga.
      const { data: updatedLoad, error: loadError } = await supabase
        .from("loads")
        .update({ status: nextStopStatus })
        .eq("id", loadId)
        .eq("driver_id", driverId)
        .select(LOAD_SELECT)
        .maybeSingle();

      if (loadError || !updatedLoad) {
        console.error("SEQUENCE ENGINE - LOAD UPDATE ERROR:", loadError);

        await supabase
          .from("load_stops")
          .update({ status: currentStop.status })
          .eq("id", currentStop.id)
          .eq("status", nextStopStatus);

        return false;
      }

      const { data: updatedDriver, error: driverError } = await supabase
        .from("drivers")
        .update({ status: "on_duty" })
        .eq("id", driverId)
        .select("id, status")
        .maybeSingle();

      if (driverError || !updatedDriver) {
        console.error("SEQUENCE ENGINE - DRIVER UPDATE ERROR:", driverError);

        await supabase
          .from("loads")
          .update({ status: loadRecord.status })
          .eq("id", loadId)
          .eq("driver_id", driverId)
          .eq("status", nextStopStatus);

        await supabase
          .from("load_stops")
          .update({ status: currentStop.status })
          .eq("id", currentStop.id)
          .eq("status", nextStopStatus);

        return false;
      }

      const hosSaved = await setHosStatus("On Duty");

      if (!hosSaved) {
        console.error("SEQUENCE ENGINE - HOS ON DUTY EVENT FAILED");

        await supabase
          .from("drivers")
          .update({ status: "driving" })
          .eq("id", driverId)
          .eq("status", "on_duty");

        await supabase
          .from("loads")
          .update({ status: loadRecord.status })
          .eq("id", loadId)
          .eq("driver_id", driverId)
          .eq("status", nextStopStatus);

        await supabase
          .from("load_stops")
          .update({ status: currentStop.status })
          .eq("id", currentStop.id)
          .eq("status", nextStopStatus);

        setDriverWorkStatus("driving");
        return false;
      }

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === driverId ? { ...driver, status: "on_duty" } : driver
        )
      );

      setDriverWorkStatus("on_duty");

      setLoads((current) =>
        current.map((load) => (load.id === updatedLoad.id ? (updatedLoad as Load) : load))
      );

      showMessage(
        isES
          ? `Llegada confirmada: ${stopType === "pickup" ? "Pickup" : "Delivery"} #${currentStop.stop_order}.`
          : `Arrival confirmed: ${stopType === "pickup" ? "Pickup" : "Delivery"} #${currentStop.stop_order}.`
      );

      return true;
    } catch (error) {
      console.error("SEQUENCE ENGINE - UNEXPECTED ERROR:", error);
      return false;
    } finally {
      sequenceProcessing.current = false;
    }
  }

  

async function updateLoadStatus(status: string): Promise<boolean> {
  if (!selectedLoad) {
    showMessage(text.selectLoadFirst);
    return false;
  }

  if (!selectedDriverId) {
    showMessage(
      isES
        ? "No hay un conductor seleccionado."
        : "No driver is selected."
    );
    return false;
  }

  const loadId = selectedLoad.id;
  const driverId = selectedDriverId;
  const requestedStatus = String(status).trim().toLowerCase();

  const targetStatus =
    requestedStatus === "done"
      ? "delivered"
      : normalizeLoadStatus(requestedStatus);

  const allowedTargets = [
    "at_pickup",
    "in_transit",
    "at_delivery",
    "delivered",
  ];

  if (!allowedTargets.includes(targetStatus)) {
    showMessage(
      isES ? "Estado solicitado no válido." : "Invalid requested status."
    );
    return false;
  }

  const finishedStatuses = [
    "completed",
    "complete",
    "delivered",
    "cancelled",
    "canceled",
  ];

  try {
    // 1. Leer el estado real de la carga en Supabase.
    const { data: loadRecord, error: loadError } = await supabase
      .from("loads")
      .select("id, driver_id, status, load_number")
      .eq("id", loadId)
      .eq("driver_id", driverId)
      .maybeSingle();

    if (loadError || !loadRecord) {
      console.error("MANUAL STATUS - LOAD VALIDATION:", loadError);
      showMessage(
        isES ? "No se pudo verificar la carga." : "Could not verify the load."
      );
      return false;
    }

    const originalLoadStatus = String(
      loadRecord.status ?? "assigned"
    ).trim();

    const currentLoadStatus = normalizeLoadStatus(originalLoadStatus);

    const { data: driverRecord, error: driverReadError } = await supabase
      .from("drivers")
      .select("id, status, current_load_id")
      .eq("id", driverId)
      .maybeSingle();

    if (driverReadError || !driverRecord) {
      console.error("MANUAL STATUS - DRIVER VALIDATION:", driverReadError);
      showMessage(
        isES
          ? "No se pudo verificar el conductor."
          : "Could not verify the driver."
      );
      return false;
    }

    if (
      driverRecord.current_load_id &&
      driverRecord.current_load_id !== loadId
    ) {
      showMessage(
        isES
          ? "El conductor tiene otra carga activa."
          : "The driver has another active load."
      );
      return false;
    }

    // 2. Leer y ordenar las paradas desde la fuente de verdad.
    const { data: stopData, error: stopError } = await supabase
      .from("load_stops")
      .select(
        "id, load_id, stop_order, stop_type, address, city, state, latitude, longitude, status"
      )
      .eq("load_id", loadId)
      .order("stop_order", { ascending: true });

    if (stopError || !stopData || stopData.length === 0) {
      console.error("MANUAL STATUS - STOPS:", stopError);
      showMessage(
        isES
          ? "No se pudieron verificar las paradas."
          : "Could not verify stops."
      );
      return false;
    }

    const stops = stopData.map((stop) => ({
      ...stop,
      stop_order: Number(stop.stop_order),
      stop_type: String(stop.stop_type ?? "").trim().toLowerCase(),
      status: normalizeLoadStatus(stop.status ?? "pending"),
    }));

    const invalidStop = stops.find(
      (stop) =>
        !Number.isFinite(stop.stop_order) ||
        !["pickup", "delivery"].includes(stop.stop_type)
    );

    if (invalidStop) {
      console.error("MANUAL STATUS - INVALID STOP:", invalidStop);
      showMessage(
        isES
          ? "Hay una parada con datos inválidos. No se puede continuar."
          : "A stop contains invalid data. Cannot continue."
      );
      return false;
    }

    const currentStop = stops.find(
      (stop) => !finishedStatuses.includes(stop.status)
    );

    if (!currentStop) {
      showMessage(
        isES
          ? "No quedan paradas pendientes."
          : "There are no remaining stops."
      );
      return false;
    }

    const refreshLoadInUI = (updatedLoad: typeof selectedLoad) => {
      setLoads((current) =>
        current.map((load) =>
          load.id === updatedLoad.id
            ? (updatedLoad as Load)
            : load
        )
      );
    };

    const refreshNavigation = async () => {
      const nextStop = await getCurrentSequenceStop(loadId);
      setNavigationStop(nextStop);
    };

    // 3. AT PICKUP: solo para la siguiente recogida de la secuencia.
    if (targetStatus === "at_pickup") {
      if (currentStop.stop_type !== "pickup") {
        showMessage(
          isES
            ? "La siguiente parada no es una recogida."
            : "The next stop is not a pickup."
        );
        return false;
      }

      if (
        ![
          "assigned",
          "in_progress",
          "at_pickup",
          "in_transit",
        ].includes(currentLoadStatus)
      ) {
        showMessage(
          isES
            ? "No se puede confirmar la recogida en el estado actual."
            : "Pickup cannot be confirmed in the current state."
        );
        return false;
      }

      if (currentStop.status === "at_pickup") {
        showMessage(
          isES ? "La recogida ya está confirmada." : "Pickup is already confirmed."
        );
        return true;
      }

      if (finishedStatuses.includes(currentStop.status)) {
        showMessage(
          isES
            ? "Esta parada ya está completada."
            : "This stop is already completed."
        );
        return false;
      }

      const { data: updatedStop, error: updateStopError } = await supabase
        .from("load_stops")
        .update({ status: "at_pickup" })
        .eq("id", currentStop.id)
        .eq("load_id", loadId)
        .eq("status", currentStop.status)
        .select("id")
        .maybeSingle();

      if (updateStopError || !updatedStop) {
        console.error("MANUAL AT PICKUP:", updateStopError);
        showMessage(
          isES
            ? "No se pudo actualizar la recogida."
            : "Could not update the pickup."
        );
        return false;
      }

      const { data: updatedLoad, error: updateLoadError } = await supabase
        .from("loads")
        .update({ status: "at_pickup" })
        .eq("id", loadId)
        .eq("driver_id", driverId)
        .select(LOAD_SELECT)
        .maybeSingle();

      if (updateLoadError || !updatedLoad) {
        console.error("MANUAL AT PICKUP LOAD:", updateLoadError);

        const { error: rollbackError } = await supabase
          .from("load_stops")
          .update({ status: currentStop.status })
          .eq("id", currentStop.id)
          .eq("status", "at_pickup");

        if (rollbackError) {
          console.error("AT PICKUP ROLLBACK FAILED:", rollbackError);
        }

        showMessage(
          isES
            ? "No se pudo guardar el estado de la carga."
            : "Could not save the load status."
        );
        return false;
      }

      refreshLoadInUI(updatedLoad as typeof selectedLoad);
      await refreshNavigation();

      showMessage(
        isES
          ? "Recogida confirmada. Pulsa DONE al terminar esta parada."
          : "Pickup confirmed. Press DONE when this stop is complete."
      );
      return true;
    }

    // 4. START TRIP: exige que la siguiente parada sea una entrega
    // y que no queden recogidas pendientes en la secuencia.
    if (targetStatus === "in_transit") {
      if (currentStop.stop_type !== "delivery") {
        showMessage(
          isES
            ? "Completa primero la recogida actual con DONE."
            : "Complete the current pickup with DONE first."
        );
        return false;
      }

      const unfinishedPickups = stops.some(
        (stop) =>
          stop.stop_type === "pickup" &&
          !finishedStatuses.includes(stop.status)
      );

      if (unfinishedPickups) {
        showMessage(
          isES
            ? "Completa todas las recogidas pendientes antes de iniciar el viaje."
            : "Complete all pending pickups before starting the trip."
        );
        return false;
      }

      if (
        ![
          "assigned",
          "in_progress",
          "at_pickup",
          "in_transit",
        ].includes(currentLoadStatus)
      ) {
        showMessage(
          isES
            ? "No se puede iniciar el viaje en el estado actual."
            : "Cannot start the trip in the current state."
        );
        return false;
      }

      if (currentLoadStatus === "in_transit") {
        showMessage(
          isES ? "El viaje ya está en curso." : "The trip is already in progress."
        );
        return true;
      }

      const { data: updatedLoad, error: updateLoadError } = await supabase
        .from("loads")
        .update({ status: "in_transit" })
        .eq("id", loadId)
        .eq("driver_id", driverId)
        .select(LOAD_SELECT)
        .maybeSingle();

      if (updateLoadError || !updatedLoad) {
        console.error("MANUAL START TRIP LOAD:", updateLoadError);
        showMessage(
          isES
            ? "No se pudo iniciar el viaje."
            : "Could not start the trip."
        );
        return false;
      }

      const { data: updatedDriver, error: updateDriverError } = await supabase
        .from("drivers")
        .update({
          status: "driving",
          current_load_id: loadId,
        })
        .eq("id", driverId)
        .select("id, status, current_load_id")
        .maybeSingle();

      if (updateDriverError || !updatedDriver) {
        console.error("MANUAL START TRIP DRIVER:", updateDriverError);

        const { error: rollbackError } = await supabase
          .from("loads")
          .update({ status: originalLoadStatus })
          .eq("id", loadId)
          .eq("status", "in_transit");

        if (rollbackError) {
          console.error("START TRIP LOAD ROLLBACK FAILED:", rollbackError);
        }

        showMessage(
          isES
            ? "No se pudo actualizar el conductor."
            : "Could not update the driver."
        );
        return false;
      }

      const hosSaved = await setHosStatus("Driving");

      if (!hosSaved) {
        console.error("MANUAL START TRIP: HOS SAVE FAILED");

        const { error: driverRollbackError } = await supabase
          .from("drivers")
          .update({
            status: driverRecord.status,
            current_load_id: driverRecord.current_load_id,
          })
          .eq("id", driverId);

        const { error: loadRollbackError } = await supabase
          .from("loads")
          .update({ status: originalLoadStatus })
          .eq("id", loadId)
          .eq("status", "in_transit");

        if (driverRollbackError) {
          console.error("START TRIP DRIVER ROLLBACK FAILED:", driverRollbackError);
        }

        if (loadRollbackError) {
          console.error("START TRIP LOAD ROLLBACK FAILED:", loadRollbackError);
        }

        showMessage(
          isES
            ? "No se guardó HOS. Se intentó restaurar los estados anteriores."
            : "HOS was not saved. The previous states were restored where possible."
        );
        return false;
      }

      refreshLoadInUI(updatedLoad as typeof selectedLoad);

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === driverId
            ? {
                ...driver,
                status: "driving",
                current_load_id: loadId,
              }
            : driver
        )
      );

      setDriverWorkStatus("driving");
      await refreshNavigation();

      showMessage(
        isES ? "Viaje iniciado." : "Trip started."
      );
      return true;
    }

    // 5. AT DELIVERY: solo para la siguiente entrega de la secuencia.
    if (targetStatus === "at_delivery") {
      if (currentStop.stop_type !== "delivery") {
        showMessage(
          isES
            ? "La siguiente parada no es una entrega."
            : "The next stop is not a delivery."
        );
        return false;
      }

      if (!["in_transit", "at_delivery"].includes(currentLoadStatus)) {
        showMessage(
          isES
            ? "Inicia el viaje antes de confirmar la entrega."
            : "Start the trip before confirming delivery."
        );
        return false;
      }

      if (currentStop.status === "at_delivery") {
        showMessage(
          isES ? "La entrega ya está confirmada." : "Delivery is already confirmed."
        );
        return true;
      }

      if (finishedStatuses.includes(currentStop.status)) {
        showMessage(
          isES
            ? "Esta parada ya está completada."
            : "This stop is already completed."
        );
        return false;
      }

      const { data: updatedStop, error: updateStopError } = await supabase
        .from("load_stops")
        .update({ status: "at_delivery" })
        .eq("id", currentStop.id)
        .eq("load_id", loadId)
        .eq("status", currentStop.status)
        .select("id")
        .maybeSingle();

      if (updateStopError || !updatedStop) {
        console.error("MANUAL AT DELIVERY STOP:", updateStopError);
        showMessage(
          isES
            ? "No se pudo actualizar la entrega."
            : "Could not update the delivery."
        );
        return false;
      }

      const { data: updatedLoad, error: updateLoadError } = await supabase
        .from("loads")
        .update({ status: "at_delivery" })
        .eq("id", loadId)
        .eq("driver_id", driverId)
        .select(LOAD_SELECT)
        .maybeSingle();

      if (updateLoadError || !updatedLoad) {
        console.error("MANUAL AT DELIVERY LOAD:", updateLoadError);

        const { error: rollbackError } = await supabase
          .from("load_stops")
          .update({ status: currentStop.status })
          .eq("id", currentStop.id)
          .eq("status", "at_delivery");

        if (rollbackError) {
          console.error("AT DELIVERY ROLLBACK FAILED:", rollbackError);
        }

        showMessage(
          isES
            ? "No se pudo guardar el estado de la carga."
            : "Could not save the load status."
        );
        return false;
      }

      refreshLoadInUI(updatedLoad as typeof selectedLoad);
      await refreshNavigation();

      showMessage(
        isES
          ? "Entrega confirmada. Pulsa DONE para completar esta parada."
          : "Delivery confirmed. Press DONE to complete this stop."
      );
      return true;
    }

    // 6. DONE: validar primero la parada y los documentos.
    if (targetStatus === "delivered") {
      const expectedStopStatus =
        currentStop.stop_type === "pickup"
          ? "at_pickup"
          : "at_delivery";

      if (currentStop.status !== expectedStopStatus) {
        showMessage(
          isES
            ? "Confirma la llegada con AT PICKUP o AT DELIVERY antes de pulsar DONE."
            : "Confirm arrival with AT PICKUP or AT DELIVERY before pressing DONE."
        );
        return false;
      }

      const nextStop = stops.find(
        (stop) =>
          stop.stop_order > currentStop.stop_order &&
          !finishedStatuses.includes(stop.status)
      );

           // Si esta es la última parada, validar documentos ANTES de
      // marcarla completada. "uploaded" por sí solo no es validación.
      if (!nextStop) {
        const { data: documentRows, error: documentError } = await supabase
          .from("documents")
          .select("id, document_type, status, storage_path, load_stop_id")
          .eq("load_id", loadId);

        if (documentError || !documentRows) {
          console.error("MANUAL DONE DOCUMENT QUERY:", documentError);
          showMessage(
            isES
              ? "No se pudieron verificar POD y BOL."
              : "Could not verify POD and BOL."
          );
          return false;
        }

        const validatedDocuments = documentRows.filter((doc) => {
          const type = String(doc.document_type ?? "")
            .trim()
            .toUpperCase();

          const docStatus = String(doc.status ?? "")
            .trim()
            .toLowerCase();

          return (
            ["POD", "BOL"].includes(type) &&
            ["reviewed", "approved"].includes(docStatus) &&
            Boolean(String(doc.storage_path ?? "").trim())
          );
        });

        const hasPOD = validatedDocuments.some(
          (doc) =>
            String(doc.document_type ?? "").trim().toUpperCase() === "POD"
        );

        const hasBOL = validatedDocuments.some(
          (doc) =>
            String(doc.document_type ?? "").trim().toUpperCase() === "BOL"
        );

        if (!hasPOD || !hasBOL) {
          const missing = [
            ...(!hasPOD ? ["POD"] : []),
            ...(!hasBOL ? ["BOL"] : []),
          ].join(" y ");

          showMessage(
            isES
              ? `No se puede finalizar. Falta cargar y validar: ${missing}.`
              : `Cannot finalize. The following must be uploaded and validated: ${missing}.`
          );
          return false;
        }
      }
            // Completar la parada actual con protección contra cambios simultáneos.
      const { data: completedStop, error: completeStopError } = await supabase
        .from("load_stops")
        .update({ status: "completed" })
        .eq("id", currentStop.id)
        .eq("load_id", loadId)
        .eq("status", expectedStopStatus)
        .select("id")
        .maybeSingle();

      if (completeStopError || !completedStop) {
        console.error("MANUAL DONE STOP:", completeStopError);
        showMessage(
          isES
            ? "No se pudo completar la parada. Verifica su estado actual."
            : "Could not complete the stop. Verify its current state."
        );
        return false;
      }

      // Todavía quedan paradas: conservar la carga activa.
      if (nextStop) {
        const nextLoadStatus =
          nextStop.stop_type === "pickup"
            ? "in_progress"
            : "in_transit";

        const { data: updatedLoad, error: nextLoadError } = await supabase
          .from("loads")
          .update({ status: nextLoadStatus })
          .eq("id", loadId)
          .eq("driver_id", driverId)
          .select(LOAD_SELECT)
          .maybeSingle();

        if (nextLoadError || !updatedLoad) {
          console.error("MANUAL DONE NEXT LOAD:", nextLoadError);

          const { error: rollbackError } = await supabase
            .from("load_stops")
            .update({ status: expectedStopStatus })
            .eq("id", currentStop.id)
            .eq("status", "completed");

          if (rollbackError) {
            console.error("DONE STOP ROLLBACK FAILED:", rollbackError);
          }

          showMessage(
            isES
              ? "No se pudo avanzar. Se intentó restaurar la parada anterior."
              : "Could not advance. The previous stop was restored where possible."
          );
          return false;
        }

        refreshLoadInUI(updatedLoad as typeof selectedLoad);
        await refreshNavigation();

        showMessage(
          isES
            ? `Parada ${currentStop.stop_order} completada. Siguiente parada: ${nextStop.stop_order}.`
            : `Stop ${currentStop.stop_order} completed. Next stop: ${nextStop.stop_order}.`
        );
        return true;
      }

      // Última parada: verificar POD y BOL revisados antes de finalizar.
      const { data: requiredDocuments, error: documentsError } = await supabase
        .from("documents")
        .select("document_type, status, storage_path")
        .eq("load_id", loadId)
        .in("document_type", ["POD", "BOL"])
        .in("status", ["reviewed", "approved"]);

      if (documentsError) {
        console.error("FINAL LOAD DOCUMENTS:", documentsError);

        showMessage(
          isES
            ? "No se pudieron verificar los documentos POD/BOL."
            : "Could not verify POD/BOL documents."
        );
        return false;
      }

      const hasPOD = (requiredDocuments ?? []).some(
        (document) =>
          document.document_type?.toUpperCase() === "POD" &&
          Boolean(document.storage_path)
      );

      const hasBOL = (requiredDocuments ?? []).some(
        (document) =>
          document.document_type?.toUpperCase() === "BOL" &&
          Boolean(document.storage_path)
      );

      if (!hasPOD || !hasBOL) {
        // Restaurar la parada para que DONE pueda intentarse de nuevo
        // después de que ambos documentos estén revisados.
        const { error: stopRollbackError } = await supabase
          .from("load_stops")
          .update({ status: expectedStopStatus })
          .eq("id", currentStop.id)
          .eq("status", "completed");

        if (stopRollbackError) {
          console.error("DOCUMENT STOP ROLLBACK FAILED:", stopRollbackError);
        }

        showMessage(
          isES
            ? "Faltan documentos POD/BOL revisados. La carga no se finalizó."
            : "POD/BOL documents are missing or not reviewed. The load was not finalized."
        );
        return false;
      }

      // Cerrar la carga solo después de confirmar POD y BOL.
      const { data: updatedLoad, error: finalLoadError } = await supabase
        .from("loads")
        .update({ status: "delivered" })
        .eq("id", loadId)
        .eq("driver_id", driverId)
        .select(LOAD_SELECT)
        .maybeSingle();

      if (finalLoadError || !updatedLoad) {
        console.error("MANUAL DONE FINAL LOAD:", finalLoadError);

        const { error: rollbackError } = await supabase
          .from("load_stops")
          .update({ status: expectedStopStatus })
          .eq("id", currentStop.id)
          .eq("status", "completed");

        if (rollbackError) {
          console.error("FINAL STOP ROLLBACK FAILED:", rollbackError);
        }

        showMessage(
          isES
            ? "No se pudo finalizar la carga."
            : "Could not finalize the load."
        );
        return false;
      }

      // Buscar la siguiente carga asignada pendiente del mismo conductor.
      // No se activa otra carga si no se pueden verificar los documentos.
      const { data: pendingLoads, error: pendingLoadsError } = await supabase
        .from("loads")
        .select(LOAD_SELECT)
        .eq("driver_id", driverId)
        .neq("id", loadId)
        .in("status", ["assigned", "pending"])
        .order("scheduled_pickup_at", { ascending: true, nullsFirst: false })
        .limit(20);

      if (pendingLoadsError) {
        console.error("NEXT ASSIGNED LOAD LOOKUP:", pendingLoadsError);

        showMessage(
          isES
            ? "La carga terminó, pero no se pudo determinar la siguiente carga. El conductor permanece disponible."
            : "The load is complete, but the next load could not be determined. The driver remains available."
        );
      }

      let nextAssignedLoad: (typeof pendingLoads extends (infer T)[] | null ? T : never) | null =
        null;

      for (const candidate of pendingLoads ?? []) {
        const { data: candidateDocuments, error: candidateDocumentsError } =
          await supabase
            .from("documents")
            .select("document_type, status, storage_path")
            .eq("load_id", candidate.id)
            .in("document_type", ["POD", "BOL"]);

        if (candidateDocumentsError) {
          console.error(
            "NEXT LOAD DOCUMENT CHECK:",
            candidate.id,
            candidateDocumentsError
          );
          continue;
        }

        // Una carga futura no debe saltarse si tiene documentos requeridos
        // y estos todavía no han sido revisados.
        const candidatePOD = (candidateDocuments ?? []).some(
          (document) =>
            document.document_type?.toUpperCase() === "POD" &&
            Boolean(document.storage_path) &&
            ["reviewed", "approved"].includes(
              String(document.status).toLowerCase()
            )
        );

        const candidateBOL = (candidateDocuments ?? []).some(
          (document) =>
            document.document_type?.toUpperCase() === "BOL" &&
            Boolean(document.storage_path) &&
            ["reviewed", "approved"].includes(
              String(document.status).toLowerCase()
            )
        );

        const hasAnyCandidateDocs = (candidateDocuments ?? []).length > 0;

        if (hasAnyCandidateDocs && (!candidatePOD || !candidateBOL)) {
          continue;
        }

        nextAssignedLoad = candidate;
        break;
      }

      if (pendingLoadsError) {
        // No cambiar current_load_id si la consulta falló.
        showMessage(
          isES
            ? `Carga ${updatedLoad.load_number || ""} completada. Revisa la siguiente carga asignada.`
            : `Load ${updatedLoad.load_number || ""} completed. Check the next assigned load.`
        );
        refreshLoadInUI(updatedLoad as typeof selectedLoad);
        return true;
      }

      if (nextAssignedLoad) {
        // Activar la siguiente carga y mantener al conductor ocupado.
        const { data: activatedLoad, error: activateLoadError } = await supabase
          .from("loads")
          .update({ status: "in_progress" })
          .eq("id", nextAssignedLoad.id)
          .eq("driver_id", driverId)
          .in("status", ["assigned", "pending"])
          .select(LOAD_SELECT)
          .maybeSingle();

        if (activateLoadError || !activatedLoad) {
          console.error("NEXT LOAD ACTIVATION:", activateLoadError);

          showMessage(
            isES
              ? `Carga ${updatedLoad.load_number || ""} completada. No se pudo activar la siguiente carga.`
              : `Load ${updatedLoad.load_number || ""} completed. Could not activate the next load.`
          );
          refreshLoadInUI(updatedLoad as typeof selectedLoad);
          return true;
        }

        const { data: updatedDriver, error: nextDriverError } = await supabase
          .from("drivers")
          .update({
            current_load_id: activatedLoad.id,
            status: "on_duty",
          })
          .eq("id", driverId)
          .eq("current_load_id", loadId)
          .select("id, status, current_load_id")
          .maybeSingle();

        if (nextDriverError || !updatedDriver) {
          console.error("NEXT LOAD DRIVER UPDATE:", nextDriverError);

          // Compensar la activación para no dejar dos cargas activas.
          const { error: loadRollbackError } = await supabase
            .from("loads")
            .update({ status: "assigned" })
            .eq("id", activatedLoad.id)
            .eq("status", "in_progress");

          if (loadRollbackError) {
            console.error("NEXT LOAD ACTIVATION ROLLBACK:", loadRollbackError);
          }

          showMessage(
            isES
              ? "La carga anterior terminó, pero no se pudo asignar la siguiente al conductor."
              : "The previous load is complete, but the next load could not be assigned to the driver."
          );
          refreshLoadInUI(updatedLoad as typeof selectedLoad);
          return true;
        }

        refreshLoadInUI(updatedLoad as typeof selectedLoad);

        setDrivers((current) =>
          current.map((driver) =>
            driver.id === driverId
              ? {
                  ...driver,
                  status: "on_duty",
                  current_load_id: activatedLoad.id,
                }
              : driver
          )
        );

        setSelectedLoadId(String(activatedLoad.id));
        setDriverWorkStatus("on_duty");
        await refreshNavigation();

        showMessage(
          isES
            ? `Carga ${updatedLoad.load_number || ""} completada. Siguiente carga activada: ${activatedLoad.load_number || ""}.`
            : `Load ${updatedLoad.load_number || ""} completed. Next load activated: ${activatedLoad.load_number || ""}.`
        );
        return true;
      }

      // No hay otra carga elegible: liberar al conductor.
      const { data: updatedDriver, error: finalDriverError } = await supabase
        .from("drivers")
        .update({
          current_load_id: null,
          status: "available",
        })
        .eq("id", driverId)
        .eq("current_load_id", loadId)
        .select("id, status, current_load_id")
        .maybeSingle();

      if (finalDriverError || !updatedDriver) {
        console.error("MANUAL DONE FINAL DRIVER:", finalDriverError);

        const { error: loadRollbackError } = await supabase
          .from("loads")
          .update({ status: originalLoadStatus })
          .eq("id", loadId)
          .eq("status", "delivered");

        const { error: stopRollbackError } = await supabase
          .from("load_stops")
          .update({ status: expectedStopStatus })
          .eq("id", currentStop.id)
          .eq("status", "completed");

        if (loadRollbackError) {
          console.error("FINAL LOAD ROLLBACK FAILED:", loadRollbackError);
        }

        if (stopRollbackError) {
          console.error("FINAL STOP ROLLBACK FAILED:", stopRollbackError);
        }

        showMessage(
          isES
            ? "No se pudo liberar al conductor. Verifica los estados en Supabase."
            : "Could not release the driver. Verify the states in Supabase."
        );
        return false;
      }

      refreshLoadInUI(updatedLoad as typeof selectedLoad);

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === driverId
            ? {
                ...driver,
                status: "available",
                current_load_id: null,
              }
            : driver
        )
      );

      setSelectedLoadId("");
      setDriverWorkStatus("available");
      setNavigationStop(null);

      showMessage(
        isES
          ? `Carga ${updatedLoad.load_number || ""} completada. No hay otra carga elegible; el conductor está disponible.`
          : `Load ${updatedLoad.load_number || ""} completed. No other eligible load was found; the driver is available.`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("MANUAL LOAD STATUS - UNEXPECTED ERROR:", error);

    showMessage(
      isES
        ? "Ocurrió un error inesperado al actualizar la carga."
        : "An unexpected error occurred while updating the load."
    );
    return false;
  }
}

  async function saveGpsEvent(
    location: GPSLocation,
    driverId: string,
    loadId: string
  ): Promise<boolean> {
    if (gpsInsertInProgress.current) {
      console.warn("GPS INSERT SKIPPED:", {
        reason: "Previous GPS request is still in progress",
        at: new Date().toISOString(),
        latitude: location.lat,
        longitude: location.lng,
      });

      return false;
    }

    gpsInsertInProgress.current = true;
    const gpsRequestStartedAt = Date.now();

    try {
      const response = await fetch("/api/gps-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
          load_id: loadId,
          latitude: location.lat,
          longitude: location.lng,
          speed: location.speed,
          heading: location.heading,
          recorded_at: new Date().toISOString(),
        }),
      });

      const result = await response.json().catch(() => null);
      console.log("GPS API RESPONSE:", {
        durationMs: Date.now() - gpsRequestStartedAt,
        ok: response.ok,
        status: response.status,
        sentLatitude: location.lat,
        sentLongitude: location.lng,
        savedLatitude: result?.data?.latitude,
        savedLongitude: result?.data?.longitude,
        savedAt: result?.data?.recorded_at,
      });

      if (!response.ok) {
        console.error("GPS API HTTP ERROR:", {
          status: response.status,
          statusText: response.statusText,
          result,
        });

        setGpsDatabaseError(true);
        setGpsStatus(text.gpsSyncError);
        return false;
      }

      setGpsDatabaseError(false);
      setGpsStatus(text.gpsActive);
      return true;
    } catch (error) {
      console.error("GPS API ERROR:", error);
      setGpsDatabaseError(true);
      setGpsStatus(text.gpsConnectionError);
      return false;
    } finally {
      gpsInsertInProgress.current = false;
    }
  }

  function startGpsTracking() {
    console.log("DEBUG START GPS - Selected Driver:", selectedDriver);
    console.log("DEBUG START GPS - Selected Load:", selectedLoad);

    if (!selectedDriver) {
      showMessage(text.selectDriverFirst);
      return;
    }

    if (!selectedLoad) {
      showMessage(text.assignLoadBeforeGps);
      return;
    }

    if (gpsWatchId.current !== null) {
      console.log("DEBUG: El GPS ya está activo, omitiendo duplicado.");
      return;
    }

    const driverId = selectedDriver.id;
    const loadId = selectedLoad.id;
    let lastGpsCallbackAt = 0;

    setGpsDatabaseError(false);
    setGpsStatus(text.requestingGps);
    setGpsTracking(true);
    setGpsStatus(text.gpsWaiting);

    console.log("GPS: iniciando watchPosition");

    gpsWatchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        console.log("GPS: callback recibido", position.timestamp);
        const callbackNow = Date.now();

        console.log("GPS WATCH INTERVAL:", {
          secondsSincePreviousCallback: lastGpsCallbackAt
            ? Math.round((callbackNow - lastGpsCallbackAt) / 1000)
            : null,
          positionTimestamp: new Date(position.timestamp).toISOString(),
          positionAgeMs: callbackNow - position.timestamp,
          receivedAt: new Date(callbackNow).toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        lastGpsCallbackAt = callbackNow;

        console.log("¡GPS RECIBIDO EXITOSAMENTE!", position.coords);

        if (gpsWatchId.current === null) return;

        const location: GPSLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };

        setLastLocation(location);

        const gpsSaved = await saveGpsEvent(location, driverId, loadId);

        console.log("GPS SAVE RESULT:", {
          gpsSaved,
          driverId,
          loadId,
          gpsWatchId: gpsWatchId.current,
        });

        if (gpsWatchId.current === null) {
          console.error("GPS FLOW STOPPED: gpsWatchId is null");
          return;
        }

        if (!gpsSaved) {
          console.error("GPS FLOW STOPPED: saveGpsEvent returned false");
          return;
        }

        try {
          // La llegada operativa se procesa desde TruckMap mediante onArrival.
          if (gpsWatchId.current === null) return;

          const nextStop = await getCurrentSequenceStop(loadId);
          setNavigationStop(nextStop);
        } catch (sequenceError) {
          console.error("SEQUENCE ENGINE GPS ERROR:", sequenceError);
        }
      },
      (error) => {
        console.error("GPS ERROR CODE:", error.code);
        console.error("GPS ERROR MESSAGE:", error.message);

        if (gpsWatchId.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchId.current);
          gpsWatchId.current = null;
        }

        setGpsTracking(false);

        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus(isES ? "Permiso GPS rechazado" : "GPS permission denied");
          showMessage(text.gpsPermissionDenied);
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsStatus(isES ? "GPS no disponible" : "GPS unavailable");
          showMessage(text.gpsUnavailable);
        } else if (error.code === error.TIMEOUT) {
          setGpsStatus(isES ? "Tiempo de espera GPS" : "GPS timeout");
          showMessage(text.gpsTimeout);
        } else {
          setGpsStatus(isES ? "Error de GPS" : "GPS error");
          showMessage(text.gpsCouldNotObtain);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 30000,
      }
    );
  }

  function stopGpsTracking() {
    if (gpsWatchId.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchId.current);
      gpsWatchId.current = null;
    }

    gpsInsertInProgress.current = false;

    setGpsTracking(false);
    setGpsDatabaseError(false);
    setGpsStatus(text.gpsNotActive);

    // Clear the active navigation destination when GPS is stopped.
    setNavigationStop(null);
  }

  function closeDocumentModal() {
    setDocumentModalOpen(false);
    setSelectedFile(null);
    setSelectedDocumentStopId("");
  }

  async function uploadDocument() {
    if (!selectedDriver) {
      showMessage(text.selectDriverFirst);
      return;
    }

    if (!selectedLoad) {
      showMessage(text.selectLoadFirst);
      return;
    }

    if (!selectedFile) {
      showMessage(text.chooseFileFirst);
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      showMessage(text.maxFileSize);
      return;
    }

    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const hasAllowedExtension = /\.(pdf|jpe?g|png|webp)$/i.test(selectedFile.name);

    if (!allowedMimeTypes.includes(selectedFile.type) && !hasAllowedExtension) {
      showMessage(text.invalidFileType);
      return;
    }

    const normalizedDocumentType = String(documentType).trim().toUpperCase();

    if (!["POD", "BOL", "RATE CONFIRMATION", "INVOICE", "OTHER"].includes(normalizedDocumentType)) {
      showMessage(
        isES ? "Seleccione un tipo de documento válido." : "Select a valid document type."
      );
      return;
    }

    let loadStopId: string | null = null;

    if (normalizedDocumentType === "POD") {
      if (!selectedDocumentStopId) {
        showMessage(
          isES
            ? "Seleccione la parada de entrega para este POD."
            : "Select the delivery stop for this POD."
        );
        return;
      }

      const { data: stop, error: stopError } = await supabase
        .from("load_stops")
        .select("id, load_id, stop_type")
        .eq("id", selectedDocumentStopId)
        .eq("load_id", selectedLoad.id)
        .maybeSingle();

      if (stopError || !stop) {
        console.error("POD STOP VALIDATION ERROR:", stopError);
        showMessage(
          isES
            ? "No se pudo verificar la parada seleccionada."
            : "Could not verify the selected stop."
        );
        return;
      }

      const stopType = String(stop.stop_type ?? "")
        .trim()
        .toLowerCase();

      if (!["delivery", "dropoff", "drop_off"].includes(stopType)) {
        showMessage(
          isES
            ? "El POD debe estar asociado a una parada de entrega."
            : "A POD must be linked to a delivery stop."
        );
        return;
      }

      loadStopId = stop.id;
    }

    setUploadingDocument(true);

    let storagePath: string | null = null;

    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

      storagePath = `${selectedLoad.id}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from("load-documents")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type || undefined,
        });

      if (uploadError) {
        console.error("DOCUMENT STORAGE UPLOAD ERROR:", uploadError);
        showMessage(
          isES
            ? `Error al cargar: ${uploadError.message}`
            : `Upload failed: ${uploadError.message}`
        );
        return;
      }

      const { error: documentError } = await supabase.from("documents").insert({
        load_id: selectedLoad.id,
        driver_id: selectedDriver.id,
        document_type: normalizedDocumentType,
        load_stop_id: loadStopId,
        file_name: selectedFile.name,
        storage_path: storagePath,
        status: "uploaded",
      });

      if (documentError) {
        console.error("DOCUMENT DATABASE INSERT ERROR:", documentError);

        const { error: cleanupError } = await supabase.storage
          .from("load-documents")
          .remove([storagePath]);

        if (cleanupError) {
          console.error("DOCUMENT STORAGE CLEANUP ERROR:", cleanupError);
        }

        showMessage(
          isES
            ? `Error al registrar el documento: ${documentError.message}`
            : `Document registration failed: ${documentError.message}`
        );
        return;
      }

      await loadDocuments(selectedLoad.id);
      closeDocumentModal();
      showMessage(text.documentUploadSuccess);
    } catch (error) {
      console.error("DOCUMENT UPLOAD ERROR:", error);
      showMessage(text.unexpectedUploadError);
    } finally {
      setUploadingDocument(false);
    }
  }

  async function viewDocument(path: string | null) {
    if (!path) {
      showMessage(text.noStoragePath);
      return;
    }

    // Se usa URL firmada (funciona con buckets privados y públicos).
    const { data: signed, error: signedError } = await supabase.storage
      .from("load-documents")
      .createSignedUrl(path, 60 * 10);

    if (!signedError && signed?.signedUrl) {
      window.open(signed.signedUrl, "_blank");
      return;
    }

    console.error("DOCUMENT SIGNED URL ERROR:", signedError);

    const { data } = supabase.storage.from("load-documents").getPublicUrl(path);
    window.open(data.publicUrl, "_blank");
  }

  // Mantiene la referencia siempre al día para el reconectado por visibilitychange.
  startGpsRef.current = startGpsTracking;

  const latestHosEvent = hosEvents[0] || null;
  const latestHosTimestamp = latestHosEvent?.event_time
    ? new Date(latestHosEvent.event_time).getTime()
    : null;

  const latestStatus = latestHosEvent?.event_type || "Unknown";
  const latestStatusNormalized = latestStatus.toLowerCase().replace(/[\s-]+/g, "_");

  const driveLimitMs = 11 * 60 * 60 * 1000;
  const shiftLimitMs = 14 * 60 * 60 * 1000;
  const cycleLimitMs = 70 * 60 * 60 * 1000;

  const driveElapsedMs =
    latestStatusNormalized === "driving" &&
    latestHosTimestamp !== null &&
    Number.isFinite(latestHosTimestamp)
      ? Math.max(0, clockNow - latestHosTimestamp)
      : 0;

  const shiftElapsedMs =
    latestHosTimestamp !== null && Number.isFinite(latestHosTimestamp)
      ? Math.max(0, clockNow - latestHosTimestamp)
      : 0;

  const hosEventsChronological = [...hosEvents]
    .filter((event): event is typeof event & { event_time: string } => {
      if (typeof event.event_time !== "string") return false;
      return Number.isFinite(new Date(event.event_time).getTime());
    })
    .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());

  const cycleDrivingMs = hosEventsChronological.reduce((total, event, index) => {
    if (event.event_type?.toLowerCase().replace(/[\s-]+/g, "_") !== "driving") {
      return total;
    }

    const start = new Date(event.event_time).getTime();
    const nextEvent = hosEventsChronological[index + 1];
    const end = nextEvent ? new Date(nextEvent.event_time).getTime() : clockNow;

    return total + Math.max(0, end - start);
  }, 0);

  const formatClock = (milliseconds: number) => {
    const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  };

  const driveRemainingMs = Math.max(0, driveLimitMs - driveElapsedMs);
  const shiftRemainingMs = Math.max(0, shiftLimitMs - shiftElapsedMs);
  const cycleRemainingMs = Math.max(0, cycleLimitMs - cycleDrivingMs);

  function formatMoney(value: number | null) {
    if (value === null || value === undefined) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  }

  function formatDateTime(value: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function getStatusClasses(status: string | null) {
    const normalized = normalizeLoadStatus(status);
    if (normalized === "in_transit") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (normalized === "delivered") return "border-blue-200 bg-blue-50 text-blue-700";
    if (normalized === "available") return "border-amber-200 bg-amber-50 text-amber-700";
    if (normalized === "at_pickup") return "border-orange-200 bg-orange-50 text-orange-700";
    if (normalized === "at_delivery") return "border-purple-200 bg-purple-50 text-purple-700";
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  function translateHosStatus(status: string | null) {
    if (!status) return text.unknown;
    switch (status.toLowerCase()) {
      case "off duty":
        return text.offDuty;
      case "sleeper":
        return text.sleeper;
      case "driving":
        return text.driving;
      case "on duty":
        return text.onDuty;
      default:
        return status;
    }
  }

  if (loading || !authReady) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-8 w-72 rounded bg-slate-200" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const uniqueLoadAlerts = loadAlerts.filter(
    (alert, index, alerts) =>
      alerts.findIndex((item) => item.load_id === alert.load_id) === index
  );

  const isPodSelected = String(documentType).trim().toUpperCase() === "POD";

  return (
    <div className="space-y-6">
      {/* CORREGIDO: la notificación ahora es fija y está por encima del modal (z-[100]).
          Antes se dibujaba arriba de la página y quedaba oculta detrás del modal o fuera de pantalla. */}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-lg"
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              i
            </div>
            <div className="flex-1">{message}</div>
            <button
              type="button"
              onClick={dismissMessage}
              aria-label={text.dismiss}
              className="shrink-0 rounded-md px-1.5 text-base font-bold leading-none text-blue-700 hover:bg-blue-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {text.driverOperations}
            </div>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{text.title}</h1>

            <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
          </div>

          {["owner", "admin", "dispatcher", "safety", "accounting", "maintenance"].includes(
            userRole
          ) && (
            <div className="w-full lg:w-72">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {text.activeDriver}
              </label>

              <select
                value={selectedDriverId}
                onChange={(e) => {
                  const driverId = e.target.value;
                  setSelectedDriverId(driverId);
                  localStorage.setItem("project-logistics-admin-selected-driver", driverId);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {uniqueLoadAlerts.length > 0 && (
        <div className="space-y-2">
          {uniqueLoadAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                !
              </div>

              <div className="flex-1">
                <div className="font-bold">{alert.title}</div>
                <div className="mt-1">{alert.message}</div>
              </div>

              <button
                type="button"
                onClick={() => void dismissLoadAlert(alert)}
                className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                {text.gotIt}
              </button>
            </div>
          ))}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {text.driver}
              </div>

              <h2 className="mt-1 text-lg font-bold text-slate-900">{text.driverProfile}</h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
              {selectedDriver?.full_name
                ?.split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "DR"}
            </div>
          </div>

          {selectedDriver ? (
            <div className="mt-5">
              <div className="text-xl font-bold text-slate-900">{selectedDriver.full_name}</div>

              <div className="mt-1 text-sm text-slate-500">
                {text.driverNumber} {selectedDriver.driver_number || "—"}
              </div>

              <div className="mt-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isES ? "Estado de trabajo" : "Work Status"}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await updateDriverWorkStatus("off_duty");
                      await setHosStatus("Off Duty");
                      stopGpsTracking();
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      driverWorkStatus === "off_duty"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isES ? "Tiempo en casa" : "Home Time"}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await updateDriverWorkStatus("hold");
                      await setHosStatus("Sleeper");
                      stopGpsTracking();
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      driverWorkStatus === "hold"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Hold
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await updateDriverWorkStatus("available");
                      await setHosStatus("Off Duty");
                      stopGpsTracking();
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      driverWorkStatus === "available"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isES ? "Disponible" : "Available"}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <ProfileRow label={text.phone} value={selectedDriver.phone || "—"} />
                <ProfileRow label={text.email} value={selectedDriver.email || "—"} />
                <ProfileRow label={text.license} value={selectedDriver.license_number || "—"} />
                <ProfileRow label={text.state} value={selectedDriver.license_state || "—"} />
                <ProfileRow
                  label={text.licenseExpiration}
                  value={formatDate(selectedDriver.license_expiration)}
                />
                <ProfileRow
                  label={text.medicalCard}
                  value={formatDate(selectedDriver.medical_card_expiration)}
                />

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-500">{text.status}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {selectedDriver.status || "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              {text.noDriverSelected}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {text.dispatch}
              </div>

              <h2 className="mt-1 text-lg font-bold text-slate-900">{text.currentLoad}</h2>

              <p className="mt-1 text-sm text-slate-500">{text.gpsAssociated}</p>
            </div>

            {/* CORREGIDO: para el rol "driver" las tarjetas ahora son botones y permiten
                elegir la carga actual. Antes eran solo texto y no se podía seleccionar. */}
            {userRole === "driver" ? (
              <div className="w-full space-y-3 sm:w-80">
                {selectableLoads.map((load) => {
                  const isCurrent = String(load.id) === String(selectedLoadId);

                  return (
                    <button
                      type="button"
                      key={load.id}
                      onClick={() => {
                        if (!isCurrent) void setCurrentLoad(String(load.id));
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isCurrent
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{load.load_number || load.id}</p>

                      <p className="mt-1 text-sm text-slate-600">
                        {load.origin_city || "—"} → {load.destination_city || "—"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {isCurrent
                          ? isES
                            ? "Carga actual"
                            : "Current load"
                          : isES
                            ? "Carga asignada"
                            : "Assigned load"}
                      </p>
                    </button>
                  );
                })}

                {selectableLoads.length === 0 && (
                  <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                    {isES
                      ? "No tienes cargas asignadas pendientes."
                      : "You have no pending assigned loads."}
                  </p>
                )}
              </div>
            ) : (
              <select
                value={selectedLoadId}
                onChange={(e) => {
                  void setCurrentLoad(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 sm:w-64"
              >
                <option value="">{text.selectLoad}</option>

                {selectableLoads.map((load) => (
                  <option key={load.id} value={load.id}>
                    {load.load_number || load.id}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedLoad &&
          driverWorkStatus !== "off_duty" &&
          driverWorkStatus !== "hold" &&
          latestHosEvent?.event_type?.trim().toLowerCase() !== "home time" ? (
            <div className="mt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-slate-900">
                    {selectedLoad.load_number || text.load}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {selectedLoad.broker_name || text.noBroker}
                    {selectedLoad.customer_name ? ` · ${selectedLoad.customer_name}` : ""}
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                    selectedLoad.status
                  )}`}
                >
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
                  {selectedLoad.status || text.unknown}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoBox
                  title={text.origin}
                  value={`${selectedLoad.origin_city || "—"}, ${selectedLoad.origin_state || "—"}`}
                />
                <InfoBox
                  title={text.destination}
                  value={`${selectedLoad.destination_city || "—"}, ${
                    selectedLoad.destination_state || "—"
                  }`}
                />
                <InfoBox title={text.miles} value={`${selectedLoad.miles ?? 0} mi`} />
                <InfoBox title={text.rate} value={formatMoney(selectedLoad.rate)} />
                <InfoBox title={text.pickup} value={formatDate(selectedLoad.pickup_date)} />
                <InfoBox
                  title={isES ? "Dirección de Pickup" : "Pickup Address"}
                  value={
                    selectedLoad.pickup_unlocked
                      ? selectedLoad.pickup_address ||
                        `${selectedLoad.origin_city || "—"}, ${selectedLoad.origin_state || "—"}`
                      : isES
                        ? "Dirección de Pickup bloqueada"
                        : "Pickup address locked"
                  }
                />
                <InfoBox title={text.delivery} value={formatDate(selectedLoad.delivery_date)} />
                <InfoBox
                  title={isES ? "Dirección de Delivery" : "Delivery Address"}
                  value={
                    selectedLoad.delivery_address ||
                    `${selectedLoad.destination_city || "—"}, ${
                      selectedLoad.destination_state || "—"
                    }`
                  }
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
  <PrimaryButton
    label="START DRIVE"
    active={driverWorkStatus === "driving"}
    disabled={
      latestHosEvent?.event_type?.trim().toLowerCase() === "home time" ||
      isDriveBlocked(driverWorkStatus)
    }
    onClick={() => {
      if (
        latestHosEvent?.event_type?.trim().toLowerCase() === "home time" ||
        isDriveBlocked(driverWorkStatus)
      ) {
        return;
      }

      void startDrive();
    }}
  />

  <PrimaryButton
    label="AT PICKUP"
    active={normalizeLoadStatus(selectedLoad.status) === "at_pickup"}
    onClick={() => void updateLoadStatus("at_pickup")}
  />

  <PrimaryButton
    label="START TRIP"
    active={normalizeLoadStatus(selectedLoad.status) === "in_transit"}
    onClick={() => void updateLoadStatus("in_transit")}
  />

  <PrimaryButton
    label="AT DELIVERY"
    active={normalizeLoadStatus(selectedLoad.status) === "at_delivery"}
    onClick={() => void updateLoadStatus("at_delivery")}
  />

  <SecondaryButton
    label="Done"
    active={normalizeLoadStatus(selectedLoad.status) === "delivered"}
    onClick={() => void updateLoadStatus("done")}
  />
</div>

<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
  {isES
    ? "Los cambios de estado se realizan manualmente con los botones. El GPS solo rastrea la ubicación."
    : "Status changes are made manually with the buttons. GPS only tracks location."}
</div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="text-sm font-semibold text-slate-700">{text.noLoadAssigned}</div>
              <div className="mt-1 text-xs text-slate-500">{text.noLoadAssignedDetail}</div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {text.location}
              </div>

              <h2 className="mt-1 text-lg font-bold text-slate-900">{text.gpsTracking}</h2>
            </div>

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                gpsTracking
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {gpsTracking
                ? text.live
                : gpsReceivingRecently
                  ? isES
                    ? "RECIBIENDO"
                    : "RECEIVING"
                  : text.off}
            </span>
          </div>

          <div
            className={`mt-5 rounded-xl border p-5 ${
              gpsTracking
                ? gpsDatabaseError
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  gpsTracking
                    ? gpsDatabaseError
                      ? "animate-pulse bg-amber-500"
                      : "animate-pulse bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />

              <div className="font-bold text-slate-900">{gpsDisplayStatus}</div>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              {activeLoad
                ? `${text.trackingLoad} ${activeLoad.load_number || activeLoad.id}`
                : text.noActiveLoad}
            </div>

            {gpsDatabaseError && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-amber-800">
                {text.browserLocationWarning}
              </div>
            )}

            {lastLocation && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricValue label={text.latitude} value={lastLocation.lat.toFixed(6)} />
                <MetricValue label={text.longitude} value={lastLocation.lng.toFixed(6)} />
                <MetricValue label={text.accuracy} value={`${Math.round(lastLocation.accuracy)} m`} />
                <MetricValue
                  label={text.speed}
                  value={lastLocation.speed !== null ? `${lastLocation.speed.toFixed(2)} m/s` : "—"}
                />
                <MetricValue
                  label={text.heading}
                  value={lastLocation.heading !== null ? `${Math.round(lastLocation.heading)}°` : "—"}
                />
              </div>
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">
                {isES ? "Mapa en vivo del camión" : "Live Truck Map"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {lastLocation
                  ? isES
                    ? "Mostrando la última ubicación GPS recibida."
                    : "Showing the latest GPS location received."
                  : isES
                    ? "Esperando la primera ubicación GPS."
                    : "Waiting for the first GPS location."}
              </p>
            </div>

            {/* GPS solo rastrea la ubicación. Las paradas cambian mediante botones manuales. */}
<TruckMap
  lastLocation={lastLocation}
  destination={navigationStop}
  isES={isES}
  onArrival={() => {
    console.log("GPS ARRIVAL IGNORED: operational status changes are manual.");
  }}
/>
          </div>

          <div className="mt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              {gpsTracking
                ? text.gpsActive
                : gpsReceivingRecently
                  ? isES
                    ? "Recibiendo ubicación GPS del teléfono"
                    : "Receiving GPS location from phone"
                  : text.gpsNotActive}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {text.safety}
            </div>

            <h2 className="mt-1 text-lg font-bold text-slate-900">{text.hosDutyStatus}</h2>

            <p className="mt-1 text-sm text-slate-500">{text.hosSubtitle}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { value: "Off Duty", label: text.offDuty },
              { value: "Sleeper", label: text.sleeper },
              { value: "Driving", label: text.driving },
              { value: "On Duty", label: text.onDuty },
            ].map((status) => (
              <div
                key={status.value}
                className={`rounded-xl border px-3 py-3 text-center text-sm font-bold transition ${
                  // CORREGIDO: antes "off duty" nunca coincidía con "off_duty".
                  latestStatusNormalized === status.value.toLowerCase().replace(/[\s-]+/g, "_")
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {status.label}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{text.recentHosEvents}</h3>
              <span className="text-xs text-slate-400">
                {hosEvents.length} {text.records}
              </span>
            </div>

            {hosEvents.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                {text.noHosEvents}
              </div>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {hosEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {translateHosStatus(event.event_type)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDateTime(event.event_time)}
                      </div>
                    </div>

                    <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {text.hoursOfService}
          </div>

          <h2 className="mt-1 text-lg font-bold text-slate-900">{text.hosClocks}</h2>

          <p className="mt-1 text-sm text-slate-500">{text.hosClockSubtitle}</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ClockBox
            title={text.driveClock}
            description={text.driveClockDescription}
            limit="11h"
            value={formatClock(driveRemainingMs)}
            detail={`${text.latestStatus}: ${translateHosStatus(latestStatus)}`}
          />

          <ClockBox
            title={text.shiftClock}
            description={text.shiftClockDescription}
            limit="14h"
            value={formatClock(shiftRemainingMs)}
            detail={shiftRemainingMs === 0 ? text.shiftLimitReached : text.currentShiftCalculation}
          />

          <ClockBox
            title={text.cycleClock}
            description={text.cycleClockDescription}
            limit="70h"
            value={formatClock(cycleRemainingMs)}
            detail={text.calculatedFromHos}
          />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          {text.hosDisclaimer}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {text.loadAdministration}
            </div>

            <h2 className="mt-1 text-lg font-bold text-slate-900">{text.loadDocuments}</h2>

            <p className="mt-1 text-sm text-slate-500">{text.documentsSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => setDocumentModalOpen(true)}
            disabled={!selectedLoad}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + {text.uploadDocument}
          </button>
        </div>

        <div className="mt-6">
          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="text-sm font-semibold text-slate-700">{text.noDocuments}</div>
              <div className="mt-1 text-xs text-slate-500">{text.noDocumentsDetail}</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {text.type}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {text.file}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {text.status}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {text.uploaded}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {text.action}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {doc.document_type || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{doc.file_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {doc.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDateTime(doc.uploaded_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void viewDocument(doc.storage_path)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          {text.view}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {documentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {text.loadDocuments}
              </div>

              <h2 className="mt-1 text-xl font-bold text-slate-900">{text.uploadLoadDocument}</h2>

              <p className="mt-1 text-sm text-slate-500">{text.attachDocumentation}</p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {text.documentType}
                </label>

                <select
                  value={documentType}
                  onChange={(e) => {
                    setDocumentType(e.target.value);
                    setSelectedDocumentStopId("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="POD">POD</option>
                  <option value="BOL">BOL</option>
                  <option value="Rate Confirmation">Rate Confirmation</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* NUEVO: selector de parada de entrega. El POD lo exige (regla existente en
                  uploadDocument) pero antes no había ningún campo para elegirla. */}
              {isPodSelected && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {text.deliveryStop}
                  </label>

                  {deliveryStops.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      {text.noDeliveryStops}
                    </div>
                  ) : (
                    <select
                      value={selectedDocumentStopId}
                      onChange={(e) => setSelectedDocumentStopId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="">{text.selectDeliveryStop}</option>
                      {deliveryStops.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {`#${stop.stop_order} · ${
                            [stop.city, stop.state].filter(Boolean).join(", ") ||
                            stop.address ||
                            "—"
                          }`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {text.chooseFile}
                </label>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-slate-800"
                  />

                  <div className="mt-2 text-xs text-slate-500">{text.fileRequirements}</div>

                  {selectedFile && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                      {text.selected} {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeDocumentModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {text.cancel}
              </button>

              <button
                type="button"
                onClick={() => void uploadDocument()}
                disabled={uploadingDocument}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${
                  uploadingDocument ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {uploadingDocument ? text.uploading : text.upload}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="max-w-[65%] truncate text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function MetricValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-1.5 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function ClockBox({
  title,
  description,
  limit,
  value,
  detail,
}: {
  title: string;
  description: string;
  limit: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
        </div>

        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
          {limit}
        </span>
      </div>

      <div className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-xs leading-5 text-slate-500">{detail}</div>
    </div>
  );
}

function PrimaryButton({
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400 opacity-70"
          : active
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function SecondaryButton({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
