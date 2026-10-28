"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../lib/LanguageProvider";

import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import SectionCard from "../../components/SectionCard";
import StatusBadge from "../../components/StatusBadge";
import ActionButton from "../../components/ActionButton";
import DataTable from "../../components/DataTable";

type Load = {
  id: string;
  company_id: string | null;
  load_number: string;
  broker_name: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  status: string | null;
  rate: number | null;
  created_at?: string | null;
};

type Document = {
  id: string;
  load_id: string | null;
  load_stop_id: string | null;
  document_type: string;
  file_name: string;
  storage_path: string | null;
  status: string | null;
  uploaded_at: string | null;
};


type LoadStop = {
  id: string;
  load_id: string;
  stop_order: number;
  stop_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pickup_number: string | null;
  status: string | null;
};


type ReviewResult = {
  load: boolean;
  documentType: boolean;
  file: boolean;
  loadStatus: boolean;
  reviewPreconditions: boolean;
  financeReady: boolean;
  bolNumber: string | null;
  pickupNumber: string | null;
  podNumber: string | null;
  validationPassed: boolean | null;
  summary: string | null;
  issues: string[];
  loadNumber: string | null;
  broker: string | null;
  origin: string | null;
  destination: string | null;
  documentDate: string | null;
  documentAmount: number | null;
  loadAmount: number | null;
  amountDifference: number | null;
  commodity: string | null;
  pieces: string | null;
  weight: string | null;
  pallets: string | null;
  dimensions: string | null;
  equipment: string | null;
  temperature: string | null;
  hazmat: string | null;
  specialInstructions: string | null;
  checks: string[];
};

const DOCUMENT_TYPES = [
  "BOL",
  "POD",
  "Rate Confirmation",
  "Lumper Receipt",
  "Fuel Receipt",
  "Other",
];

function formatMoney(value: number | null | undefined) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US");
}

function formatPickupNumber(value: string | null | undefined) {
  const pickupNumber = String(value ?? "").trim();
  if (!pickupNumber) return "";
  if (/^PU\s*/i.test(pickupNumber)) {
    return pickupNumber.replace(/^PU\s*/i, "PU");
  }
  if (/^PL\s*/i.test(pickupNumber)) return pickupNumber;
  return `PU${pickupNumber}`;
}

function normalizeAddressKey(value: string | null | undefined) {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const CURRENT_PICKUP_ADDRESS_KEYS: Record<string, string> = {
  PU99: "9950WFLAGLER",
  PU222: "9565WFLAGLER",
};

export default function DocumentsPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    eyebrow: isES ? "Gestión documental" : "Document management",
    title: isES ? "Documentos" : "Documents",
    description: isES
      ? "Gestión central de documentos, revisión humana y preparación para Finanzas."
      : "Central document management, human review and Finance readiness.",
    refresh: isES ? "Actualizar datos" : "Refresh Data",

    total: isES ? "Total de documentos" : "Total Documents",
    bol: "BOL",
    pod: "POD",
    rateConfirmations: isES
      ? "Confirmaciones de tarifa"
      : "Rate Confirmations",
    aiReviewed: isES ? "Aprobados por una persona" : "Human Approved",
    pendingReview: isES ? "Pendientes de revisión" : "Pending Review",

    uploadTitle: isES ? "Subir documento" : "Upload Document",
    uploadDescription: isES
      ? "Adjunta un documento a una carga."
      : "Attach a document to a load.",
    load: isES ? "Carga" : "Load",
    loadingLoads: isES ? "Cargando cargas..." : "Loading loads...",
    selectLoad: isES ? "Selecciona una carga" : "Select a load",
    pendingLoadsTitle: isES ? "Cargas vigentes: PU99 y PU222" : "Current Loads: PU99 and PU222",
    pendingLoadsDescription: isES ? "Solo se muestran las cargas vigentes PU99 y PU222 en este selector." : "Only the current PU99 and PU222 loads appear in this selector.",
    noCurrentLoads: isES ? "No se encontraron las cargas vigentes PU99 o PU222." : "No current PU99 or PU222 loads were found.",
    completedHistoryTitle: isES ? "Historial de documentos completados" : "Completed Document History",
    completedHistoryDescription: isES ? "Historial separado de las cargas vigentes. Los documentos históricos se conservan y se muestran aquí sin acciones de eliminación o aprobación." : "Separate from current loads. Historical documents are preserved here without delete or approval actions.",
    selectHistoryLoad: isES ? "Selecciona una carga del historial" : "Select a historical load",
    noHistoricalLoads: isES ? "No hay otras cargas en el historial." : "There are no other loads in history.",
    noCompletedHistoryDocuments: isES ? "No hay documentos completados para esta carga histórica." : "No completed documents found for this historical load.",
    selectedLoad: isES ? "Carga seleccionada" : "Selected Load",
    loadRate: isES ? "Tarifa de carga" : "Load Rate",
    documentType: isES ? "Tipo de documento" : "Document Type",
    stop: isES ? "Parada asociada" : "Associated Stop",
    pickup: isES ? "Recogida" : "Pickup",
    delivery: isES ? "Entrega" : "Delivery",
    selectStop: isES ? "Selecciona una parada" : "Select a stop",
    loadingStops: isES ? "Cargando paradas..." : "Loading stops...",
    pickupStopRequired: isES
      ? "Selecciona la recogida correspondiente para el BOL."
      : "Select the corresponding pickup stop for the BOL.",
    deliveryStopRequired: isES
      ? "Selecciona la entrega correspondiente para el POD."
      : "Select the corresponding delivery stop for the POD.",
    noPickupStops: isES
      ? "Esta carga no tiene paradas de recogida disponibles."
      : "This load has no available pickup stops.",
    noDeliveryStops: isES
      ? "Esta carga no tiene paradas de entrega disponibles."
      : "This load has no available delivery stops.",
    correctAssociatedStop: isES
      ? "Corregir parada asociada"
      : "Correct associated stop",
    saveStopAndReview: isES
      ? "Guardar parada asociada"
      : "Save Associated Stop",
    savingStop: isES
      ? "Guardando parada..."
      : "Saving stop...",
    chooseCorrectStop: isES
      ? "Selecciona la parada correspondiente a este documento. Después, revisa el archivo original y decide si lo apruebas o rechazas."
      : "Select the stop associated with this document. Then inspect the original file and decide whether to approve or reject it.",
    noMatchingStops: isES
      ? "No hay paradas compatibles para este tipo de documento."
      : "There are no matching stops for this document type.",
    file: isES ? "Archivo" : "File",
    selected: isES ? "Seleccionado" : "Selected",
    uploading: isES ? "Subiendo..." : "Uploading...",
    upload: isES ? "Subir documento" : "Upload Document",
    supported: isES
      ? "Formatos permitidos: PDF, JPG, PNG, WEBP. Tamaño máximo: 15 MB."
      : "Supported formats: PDF, JPG, PNG, WEBP. Maximum file size: 15MB.",

    validationTitle: isES
      ? "Estado documental para Finanzas"
      : "Document Status for Finance",
    validationDescription: isES
      ? "La preparación para Finanzas se calcula usando los documentos aprobados manualmente para cada parada requerida."
      : "Finance readiness is calculated from documents manually approved for every required stop.",
    linkedLoad: isES ? "Carga vinculada" : "Load linked",
    documents: isES ? "Documentos" : "Documents",
    financeReady: isES ? "Listo para Finanzas" : "Finance Ready",
    yes: isES ? "SÍ" : "YES",
    no: isES ? "NO" : "NO",
    available: isES ? "DISPONIBLE" : "AVAILABLE",
    waiting: isES ? "ESPERANDO" : "WAITING",

    loadDocuments: isES ? "Documentos de la carga" : "Load Documents",
    associated: isES
      ? "Documentos asociados con"
      : "Documents associated with",
    selectToView: isES
      ? "Selecciona una carga para ver sus documentos."
      : "Select a load to view its documents.",
    loadStatus: isES ? "Estado de carga" : "Load Status",
    loadingDocuments: isES
      ? "Cargando documentos..."
      : "Loading documents...",
    selectLoadToSee: isES
      ? "Selecciona una carga para ver sus documentos."
      : "Select a load to see its documents.",
    noDocuments: isES ? "Aún no hay documentos" : "No documents yet",
    noDocumentsDescription: isES
      ? "Sube el primer documento para esta carga usando el panel de carga."
      : "Upload the first document for this load using the upload panel.",
    uploaded: isES ? "Subido" : "Uploaded",
    open: isES ? "Abrir" : "Open",
    aiReview: isES ? "Revisar documento" : "Review Document",
    delete: isES ? "Eliminar" : "Delete",

    aiDocumentReview: isES
      ? "Revisión manual del documento"
      : "Manual Document Review",
    close: isES ? "Cerrar" : "Close",
    aiReviewing: isES
      ? "Preparando la revisión del documento"
      : "Preparing document review",
    aiReviewDescription: isES
      ? "Comprueba el archivo original y los datos de la carga. La decisión de aprobar o rechazar corresponde a una persona."
      : "Inspect the original file and load details. A person makes the approval or rejection decision.",
    pass: isES ? "APROBADO" : "PASS",
    fail: isES ? "FALLÓ" : "FAIL",
    review: isES ? "REVISAR" : "REVIEW",
    invoiceReady: isES ? "Requisitos para revisar" : "Review Preconditions",
    loadInformation: isES ? "Información de carga" : "Load Information",
    loadNumber: isES ? "Número de carga" : "Load Number",
    broker: isES ? "Broker" : "Broker",
    origin: isES ? "Origen" : "Origin",
    destination: isES ? "Destino" : "Destination",
    loadAmount: isES ? "Monto de carga" : "Load Amount",

    intelligence: isES
      ? "Datos adicionales del documento"
      : "Additional Document Details",
    bolNumber: isES ? "Número del documento BOL" : "BOL Document Number",
    pickupNumber: isES ? "Número PU del pickup" : "PU Pickup Number",
    podNumber: isES ? "Número del documento POD" : "POD Document Number",
    aiSummary: isES ? "Notas de revisión" : "Review Notes",
    aiIssues: isES ? "Observaciones" : "Observations",
    validationPassed: isES ? "Validación completada" : "Validation Completed",
    validationFailed: isES ? "Se requiere revisión adicional" : "Additional Review Required",
    documentDate: isES ? "Fecha del documento" : "Document Date",
    documentAmount: isES ? "Monto del documento" : "Document Amount",
    amountDifference: isES
      ? "Diferencia de monto"
      : "Amount Difference",
    commodity: isES ? "Mercancía" : "Commodity",
    weight: isES ? "Peso" : "Weight",
    equipment: isES ? "Equipo" : "Equipment",
    hazmat: isES ? "Material peligroso" : "Hazmat",
    notExtracted: isES ? "No extraído" : "Not extracted",
    notCalculated: isES ? "No calculado" : "Not calculated",

    checks: isES ? "Validaciones" : "Validation Checks",
    financeReadiness: isES
      ? "Preparación para Finanzas"
      : "Finance Readiness",
    financeReadinessDescription: isES
      ? "La revisión manual de un documento no sustituye el proceso de Finanzas. Cada BOL y POD requerido debe estar aprobado antes de que la carga esté lista para facturación."
      : "Manual document review does not replace the Finance process. Every required BOL and POD must be approved before the load is ready for invoicing.",
    readyForFinance: isES
      ? "LISTO PARA FINANZAS"
      : "READY FOR FINANCE",
    reviewRequired: isES
      ? "REVISIÓN REQUERIDA"
      : "REVIEW REQUIRED",
    decline: isES ? "Rechazar documento" : "Decline Document",
    declining: isES ? "Rechazando..." : "Declining...",
    approve: isES ? "Aprobar documento" : "Approve Document",
    approving: isES
      ? "Aprobando documento..."
      : "Approving document...",
    unableReview: isES
      ? "No se pudo generar el resultado de revisión."
      : "Unable to generate the review result.",

    uploadedSuccess: isES
      ? "Documento subido correctamente."
      : "Document uploaded successfully.",
    deletedSuccess: isES
      ? "Documento eliminado correctamente."
      : "Document deleted successfully.",
    approvedSuccess: isES
      ? "Documento aprobado correctamente. Finanzas ahora puede utilizar este documento para determinar si la factura está lista."
      : "Document approved successfully. Finance can now use this document for invoice readiness.",
    rejectedSuccess: isES
      ? "Documento rechazado."
      : "Document rejected.",

    selectLoadFirst: isES
      ? "Selecciona una carga primero."
      : "Select a load first.",
    selectFileFirst: isES
      ? "Selecciona primero un archivo."
      : "Select a document file first.",
    tooLarge: isES
      ? "El archivo es demasiado grande. El máximo es 15 MB."
      : "File is too large. Maximum size is 15MB.",
    invalidType: isES
      ? "Tipo de archivo inválido. Usa PDF, JPG, PNG o WEBP."
      : "Invalid file type. Use PDF, JPG, PNG, or WEBP.",
    noStoragePath: isES
      ? "Este documento no tiene una ruta de almacenamiento."
      : "This document has no storage path.",
    unablePreview: isES
      ? "No se pudo crear la vista previa del documento."
      : "Unable to create document preview.",
    unableUpload: isES
      ? "No se pudo subir el documento."
      : "Unable to upload document.",
    unableDelete: isES
      ? "No se pudo eliminar el documento."
      : "Unable to delete document.",
    unableApprove: isES
      ? "No se pudo aprobar el documento."
      : "Unable to approve document.",
    unableReject: isES
      ? "No se pudo rechazar el documento."
      : "Unable to reject document.",
    unableGenerate: isES
      ? "No se pudo generar la revisión."
      : "Unable to generate the review result.",
    deleteConfirm: isES
      ? "¿Eliminar este documento?"
      : "Delete this document?",
    extracted: isES ? "No extraído" : "Not extracted",
  };

  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [selectedHistoryLoadId, setSelectedHistoryLoadId] = useState("");
  const [historyDocuments, setHistoryDocuments] = useState<Document[]>([]);
  const [loadingHistoryDocuments, setLoadingHistoryDocuments] = useState(false);
  const [loadStops, setLoadStops] = useState<LoadStop[]>([]);
  const [selectedLoadStopId, setSelectedLoadStopId] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState("BOL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loadingLoads, setLoadingLoads] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [reviewingDocument, setReviewingDocument] =
    useState<Document | null>(null);

  const [reviewResult, setReviewResult] =
    useState<ReviewResult | null>(null);

  const [reviewing, setReviewing] = useState(false);
  const [reviewStopId, setReviewStopId] = useState("");
  const [savingStopAssociation, setSavingStopAssociation] = useState(false);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLoad = useMemo(
    () =>
      loads.find((load) => load.id === selectedLoadId) ?? null,
    [loads, selectedLoadId]
  );

  // Current work is identified by BOTH the PU label and its exact street address.
  // This keeps the completed PU99/PU51 load in history instead of confusing it
  // with the current PU99 stop at 9950 W Flagler.
  const currentLoads = useMemo(() => {
    const picked: Load[] = [];

    for (const [wantedLabel, wantedAddressKey] of Object.entries(CURRENT_PICKUP_ADDRESS_KEYS)) {
      const candidates = loads
        .filter((load) => loadStops.some((stop) => {
          const stopType = stop.stop_type.trim().toLowerCase().replace(/[_-]+/g, " ");
          const label = formatPickupNumber(stop.pickup_number).trim().toUpperCase();
          const addressKey = normalizeAddressKey(stop.address);
          return stop.load_id === load.id &&
            ["pickup", "pick up"].includes(stopType) &&
            label === wantedLabel &&
            addressKey.includes(wantedAddressKey);
        }))
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
      if (candidates[0] && !picked.some((load) => load.id === candidates[0].id)) {
        picked.push(candidates[0]);
      }
    }

    return picked;
  }, [loads, loadStops]);

  const currentLoadIds = useMemo(
    () => new Set(currentLoads.map((load) => load.id)),
    [currentLoads]
  );

  const historyLoads = useMemo(
    () => loads.filter((load) => !currentLoadIds.has(load.id)),
    [loads, currentLoadIds]
  );

  const completedHistoryDocuments = useMemo(() => {
    const completedStatuses = ["approved", "document approved", "reviewed", "rejected", "declined", "completed", "complete"];
    return historyDocuments.filter((document) => {
      const status = String(document.status ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
      return completedStatuses.includes(status);
    });
  }, [historyDocuments]);

  const getPickupLabelsForLoad = (loadId: string) =>
    loadStops
      .filter((stop) => {
        const stopType = stop.stop_type.trim().toLowerCase();
        return stop.load_id === loadId && ["pickup", "pick_up", "pick-up"].includes(stopType);
      })
      .sort((a, b) => a.stop_order - b.stop_order)
      .map((stop) => formatPickupNumber(stop.pickup_number))
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index);

  const selectedPickupLabels = selectedLoad
    ? getPickupLabelsForLoad(selectedLoad.id)
    : [];

  const isHumanApprovedDocument = (documentRow: Document) => {
    const status = (documentRow.status ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
    return ["approved", "document approved", "reviewed"].includes(status);
  };

  const reviewedCount = useMemo(
    () => documents.filter(isHumanApprovedDocument).length,
    [documents]
  );

  const pendingCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "pending" ||
          document.status === "uploaded"
      ).length,
    [documents]
  );

  const bolCount = useMemo(
    () =>
      documents.filter(
        (document) => document.document_type === "BOL"
      ).length,
    [documents]
  );

  const podCount = useMemo(
    () =>
      documents.filter(
        (document) => document.document_type === "POD"
      ).length,
    [documents]
  );

  const rateConfirmationCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.document_type === "Rate Confirmation"
      ).length,
    [documents]
  );

  const requiredStopType =
    selectedDocumentType === "BOL"
      ? "pickup"
      : selectedDocumentType === "POD"
        ? "delivery"
        : null;

  const eligibleStops = useMemo(() => {
    if (!selectedLoad || !requiredStopType) return [];

    return loadStops
      .filter((stop) => {
        const normalizedType = stop.stop_type.trim().toLowerCase();
        const isPickup = ["pickup", "pick_up", "pick-up"].includes(normalizedType);
        const isDelivery = ["delivery", "dropoff", "drop_off", "drop-off"].includes(normalizedType);
        return (
          stop.load_id === selectedLoad.id &&
          (requiredStopType === "pickup" ? isPickup : isDelivery)
        );
      })
      .sort((a, b) => a.stop_order - b.stop_order);
  }, [loadStops, requiredStopType, selectedLoad]);

  const reviewEligibleStops = useMemo(() => {
    if (!reviewingDocument || !reviewingDocument.load_id) return [];

    const expectedType =
      reviewingDocument.document_type.trim().toUpperCase() === "BOL"
        ? "pickup"
        : reviewingDocument.document_type.trim().toUpperCase() === "POD"
          ? "delivery"
          : null;

    if (!expectedType) return [];

    const normalizeStopType = (value: string) =>
      value.trim().toLowerCase().replace(/[\s-]+/g, "_");

    return loadStops
      .filter((stop) => {
        const type = normalizeStopType(stop.stop_type);
        const isPickup = ["pickup", "pick_up"].includes(type);
        const isDelivery = ["delivery", "dropoff", "drop_off"].includes(type);
        return stop.load_id === reviewingDocument.load_id &&
          (expectedType === "pickup" ? isPickup : isDelivery);
      })
      .sort((a, b) => a.stop_order - b.stop_order);
  }, [loadStops, reviewingDocument]);

 
const isLoadFinanceReady = (loadId: string | null | undefined) => {
    if (!loadId) return false;

    const normalizeStopType = (value: string) =>
      value.trim().toLowerCase().replace(/[\s-]+/g, "_");

    const stops = loadStops.filter((stop) => stop.load_id === loadId);

    const pickupStops = stops.filter((stop) =>
      ["pickup", "pick_up"].includes(normalizeStopType(stop.stop_type))
    );

    const deliveryStops = stops.filter((stop) =>
      ["delivery", "dropoff", "drop_off"].includes(normalizeStopType(stop.stop_type))
    );

    if (pickupStops.length === 0 || deliveryStops.length === 0) return false;

    const hasApprovedDocumentForStop = (type: "BOL" | "POD", stopId: string) =>
      documents.some((documentRow) =>
        documentRow.load_id === loadId &&
        documentRow.load_stop_id === stopId &&
        documentRow.document_type.trim().toUpperCase() === type &&
        isHumanApprovedDocument(documentRow)
      );

    const hasApprovedRateConfirmation = documents.some((documentRow) => {
      const normalizedType = documentRow.document_type
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
      return (
        documentRow.load_id === loadId &&
        normalizedType.includes("rate") &&
        normalizedType.includes("confirmation") &&
        isHumanApprovedDocument(documentRow)
      );
    });

    return (
      pickupStops.every((stop) => hasApprovedDocumentForStop("BOL", stop.id)) &&
      deliveryStops.every((stop) => hasApprovedDocumentForStop("POD", stop.id)) &&
      hasApprovedRateConfirmation
    );
  };

  const financeReady = useMemo(
    () => isLoadFinanceReady(selectedLoad?.id),
    [selectedLoad, loadStops, documents]
  );

  useEffect(() => {
    if (!eligibleStops.some((stop) => stop.id === selectedLoadStopId)) {
      setSelectedLoadStopId("");
    }
  }, [eligibleStops, selectedLoadStopId]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentLoads.some((load) => load.id === selectedLoadId)) return;
    setSelectedLoadId(currentLoads[0]?.id ?? "");
    setSelectedLoadStopId("");
  }, [currentLoads, selectedLoadId]);

  useEffect(() => {
    if (historyLoads.some((load) => load.id === selectedHistoryLoadId)) return;
    setSelectedHistoryLoadId(historyLoads[0]?.id ?? "");
  }, [historyLoads, selectedHistoryLoadId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistoryDocuments() {
      if (!selectedHistoryLoadId) {
        setHistoryDocuments([]);
        setLoadingHistoryDocuments(false);
        return;
      }

      setLoadingHistoryDocuments(true);
      const { data, error } = await supabase
        .from("documents")
        .select("id, load_id, load_stop_id, document_type, file_name, storage_path, status, uploaded_at")
        .eq("load_id", selectedHistoryLoadId)
        .order("uploaded_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("DOCUMENT HISTORY LOAD ERROR:", error);
        setHistoryDocuments([]);
      } else {
        setHistoryDocuments((data ?? []) as Document[]);
      }
      setLoadingHistoryDocuments(false);
    }

    void fetchHistoryDocuments();
    return () => { cancelled = true; };
  }, [selectedHistoryLoadId]);

  useEffect(() => {
    if (!selectedLoadId) {
      setDocuments([]);
      return;
    }

    loadDocuments(selectedLoadId);
  }, [selectedLoadId]);

  // Load stops so the Documents page can show PU identifiers independently from document numbers.
  // Cargar las paradas para mostrar los identificadores PU por separado de los números de documento.
  useEffect(() => {
    const loadIds = loads.map((load) => String(load.id));

    if (loadIds.length === 0) {
      setLoadStops([]);
      return;
    }

    let cancelled = false;

    void (async () => {
    
const { data, error } = await supabase
  .from("load_stops")
  .select(
    "id, load_id, stop_order, stop_type, address, city, state, pickup_number, status"
  )
  .in("load_id", loadIds)
  .order("stop_order", { ascending: true });


      if (cancelled) return;

      if (error) {
        console.error("DOCUMENT STOP LABELS ERROR:", error);
        setLoadStops([]);
        return;
      }

      setLoadStops(
        (data ?? []).map((stop) => ({
          id: String(stop.id),
          load_id: String(stop.load_id),
          stop_order: Number(stop.stop_order ?? 0),
          stop_type: String(stop.stop_type ?? ""),
          address: stop.address ?? null,
          city: stop.city ?? null,
          state: stop.state ?? null,
          pickup_number: stop.pickup_number ?? null,
          status: stop.status ?? null,
        }))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [loads, supabase]);

  async function loadData() {
    setLoadingLoads(true);
    setErrorMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoads([]);
      setLoadStops([]);
      setErrorMessage(isES ? "Inicia sesión para ver las cargas." : "Sign in to view loads.");
      setLoadingLoads(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userError || !userData?.company_id) {
      setLoads([]);
      setLoadStops([]);
      setErrorMessage(userError?.message || (isES ? "No se encontró la empresa del usuario." : "User company was not found."));
      setLoadingLoads(false);
      return;
    }

    const { data, error } = await supabase
      .from("loads")
      .select(
        `
        id,
        company_id,
        load_number,
        broker_name,
        origin_city,
        origin_state,
        destination_city,
        destination_state,
        status,
        rate,
        created_at
      `
      )
      .eq("company_id", userData.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(
        `${isES ? "Error cargando cargas" : "Error loading loads"}: ${error.message}`
      );
      setLoadingLoads(false);
      return;
    }

    const formattedLoads: Load[] = (data ?? []).map((load) => ({
      id: load.id,
      company_id: load.company_id ?? null,
      load_number: load.load_number,
      broker_name: load.broker_name ?? null,
      origin_city: load.origin_city ?? null,
      origin_state: load.origin_state ?? null,
      destination_city: load.destination_city ?? null,
      destination_state: load.destination_state ?? null,
      status: load.status ?? null,
      rate: load.rate ?? 0,
      created_at: load.created_at ?? null,
    }));

    setLoads(formattedLoads);

    setLoadingLoads(false);
  }

  async function loadDocuments(loadId: string) {
    setLoadingDocuments(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("documents")
      .select(
        `
        id,
        load_id,
        load_stop_id,
        document_type,
        file_name,
        storage_path,
        status,
        uploaded_at
      `
      )
      .eq("load_id", loadId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      setErrorMessage(
        `${isES ? "Error cargando documentos" : "Error loading documents"}: ${error.message}`
      );
      setDocuments([]);
      setLoadingDocuments(false);
      return;
    }

    setDocuments((data ?? []) as Document[]);
    setLoadingDocuments(false);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    setErrorMessage("");
    setMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(text.tooLarge);
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(text.invalidType);
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function uploadDocument() {
    setErrorMessage("");
    setMessage("");

    if (!selectedLoad) {
      setErrorMessage(text.selectLoadFirst);
      return;
    }

    if (!selectedFile) {
      setErrorMessage(text.selectFileFirst);
      return;
    }

    if (requiredStopType && !selectedLoadStopId) {
      setErrorMessage(
        selectedDocumentType === "BOL"
          ? text.pickupStopRequired
          : text.deliveryStopRequired
      );
      return;
    }

    if (
      requiredStopType &&
      !eligibleStops.some((stop) => stop.id === selectedLoadStopId)
    ) {
      setErrorMessage(
        selectedDocumentType === "BOL"
          ? text.noPickupStops
          : text.noDeliveryStops
      );
      return;
    }

    setUploading(true);

    try {
      const cleanName = selectedFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const storagePath = `${selectedLoad.id}/${Date.now()}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("load-documents")
        .upload(storagePath, selectedFile, {
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      
const { data: insertedDocument, error: insertError } = await supabase
  .from("documents")
  .insert({
    company_id: selectedLoad.company_id,
    load_id: selectedLoad.id,
    load_stop_id: requiredStopType ? selectedLoadStopId : null,
    document_type: selectedDocumentType,
    file_name: selectedFile.name,
    storage_path: storagePath,
    status: "uploaded",
  })
  .select("id")
  .single();

if (insertError || !insertedDocument?.id) {
  await supabase.storage
    .from("load-documents")
    .remove([storagePath]);

  throw new Error(
    insertError?.message ??
      (isES
        ? "No se pudo guardar el documento."
        : "Unable to save the document.")
  );
}


      const newDocument: Document = {
        id: insertedDocument.id,
        load_id: selectedLoad.id,
        load_stop_id: requiredStopType
          ? selectedLoadStopId
          : null,
        document_type: selectedDocumentType,
        file_name: selectedFile.name,
        storage_path: storagePath,
        status: "uploaded",
        uploaded_at: new Date().toISOString(),
      };

      setDocuments((current) => [
        newDocument,
        ...current.filter(
          (document) => document.id !== newDocument.id
        ),
      ]);

      setSelectedFile(null);
      setSelectedLoadStopId("");

      const input = document.getElementById(
        "document-file"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setMessage(text.uploadedSuccess);
      // AI is intentionally dormant. Uploading a file never triggers automated review.
      // La IA permanece desactivada. Subir un archivo nunca inicia una revisión automática.
      await loadDocuments(selectedLoad.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text.unableUpload
      );
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(documentRow: Document) {
    setErrorMessage("");

    if (!documentRow.storage_path) {
      setErrorMessage(text.noStoragePath);
      return;
    }

    const { data, error } = await supabase.storage
      .from("load-documents")
      .createSignedUrl(documentRow.storage_path, 600);

    if (error || !data?.signedUrl) {
      setErrorMessage(
        error?.message ?? text.unablePreview
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDocument(documentRow: Document) {
    const confirmed = window.confirm(
      `${text.deleteConfirm}\n\n${documentRow.file_name}`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setMessage("");

    try {
      if (documentRow.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("load-documents")
          .remove([documentRow.storage_path]);

        if (storageError) {
          throw new Error(storageError.message);
        }
      }

      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentRow.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setMessage(text.deletedSuccess);

      if (selectedLoadId) {
        await loadDocuments(selectedLoadId);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text.unableDelete
      );
    }
  }

  function buildIntelligence(
    load: Load | null,
    doc: Document
  ): ReviewResult {
    const hasLoad = !!load;
    const hasDocumentType = !!doc.document_type;
    const hasFile = !!doc.storage_path;

    const loadStatusOk =
      !!load &&
      [
        "Delivered",
        "In Transit",
        "loaded",
        "delivered",
      ].includes(load.status ?? "");

    const needsStopAssociation = ["BOL", "POD"].includes(
      doc.document_type.trim().toUpperCase()
    );
    const hasAssociatedStop = !needsStopAssociation || !!doc.load_stop_id;
    const reviewPreconditions =
      hasLoad && hasDocumentType && hasFile && hasAssociatedStop;
    // Finance readiness belongs to the whole load, not to this single document.
    // La preparación para Finanzas corresponde a toda la carga, no a un solo documento.
    const loadFinanceReady = isLoadFinanceReady(load?.id);

    const loadAmount = load?.rate ?? null;

    const checks: string[] = [];

    if (hasLoad) {
      checks.push(
        isES
          ? "La carga está vinculada correctamente."
          : "Load linked successfully."
      );
    } else {
      checks.push(
        isES
          ? "Falta la carga."
          : "Load is missing."
      );
    }

    if (hasDocumentType) {
      checks.push(
        isES
          ? "El tipo de documento está definido."
          : "Document type is defined."
      );
    } else {
      checks.push(
        isES
          ? "Falta el tipo de documento."
          : "Document type is missing."
      );
    }

    if (hasFile) {
      checks.push(
        isES
          ? "El archivo del documento está disponible."
          : "Document file is available."
      );
    } else {
      checks.push(
        isES
          ? "Falta el archivo del documento."
          : "Document file is missing."
      );
    }

    if (loadStatusOk) {
      checks.push(
        isES
          ? "El estado de la carga es compatible con la revisión."
          : "Load status is compatible with review."
      );
    } else {
      checks.push(
        isES
          ? "El estado de la carga requiere revisión operativa adicional."
          : "Load status requires additional operational review."
      );
    }

    return {
      load: hasLoad,
      documentType: hasDocumentType,
      file: hasFile,
      loadStatus: loadStatusOk,
      reviewPreconditions,
      financeReady: loadFinanceReady,
      bolNumber: null,
      pickupNumber: null,
      podNumber: null,
      validationPassed: null,
      summary: null,
      issues: [],
      loadNumber: load?.load_number ?? null,
      broker: load?.broker_name ?? null,
      origin:
        load?.origin_city && load?.origin_state
          ? `${load.origin_city}, ${load.origin_state}`
          : null,
      destination:
        load?.destination_city &&
        load?.destination_state
          ? `${load.destination_city}, ${load.destination_state}`
          : null,
      documentDate: null,
      documentAmount: null,
      loadAmount,
      amountDifference: null,
      commodity: null,
      pieces: null,
      weight: null,
      pallets: null,
      dimensions: null,
      equipment: null,
      temperature: null,
      hazmat: null,
      specialInstructions: null,
      checks,
    };
  }

  function openDocumentReview(documentRow: Document) {
    setReviewingDocument(documentRow);
    setReviewStopId(documentRow.load_stop_id ?? "");
    setErrorMessage("");
    setMessage("");
    setReviewResult(buildIntelligence(
      loads.find((item) => item.id === documentRow.load_id) ?? null,
      documentRow
    ));
    setReviewing(false);
  }

  async function saveStopAssociationAndReview() {
    if (!reviewingDocument || !reviewingDocument.load_id || !reviewStopId) {
      setErrorMessage(text.chooseCorrectStop);
      return;
    }

    const chosenStop = reviewEligibleStops.find((stop) => stop.id === reviewStopId);
    if (!chosenStop) {
      setErrorMessage(text.noMatchingStops);
      return;
    }

    setSavingStopAssociation(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("documents")
        .update({ load_stop_id: chosenStop.id, status: "uploaded" })
        .eq("id", reviewingDocument.id)
        .eq("load_id", reviewingDocument.load_id);

      if (error) throw new Error(error.message);

      const updatedDocument: Document = {
        ...reviewingDocument,
        load_stop_id: chosenStop.id,
        status: "uploaded",
      };

      setDocuments((current) => current.map((row) =>
        row.id === updatedDocument.id ? updatedDocument : row
      ));
      setReviewingDocument(updatedDocument);
      setReviewResult(buildIntelligence(
        loads.find((item) => item.id === updatedDocument.load_id) ?? null,
        updatedDocument
      ));
      setMessage(isES ? "Parada asociada guardada." : "Associated stop saved.");
      // No AI request is made here; a person remains responsible for approval.
      // Aquí no se llama a la IA; la aprobación sigue siendo responsabilidad humana.
      if (selectedLoadId) await loadDocuments(selectedLoadId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.unableReview);
    } finally {
      setSavingStopAssociation(false);
    }
  }

  async function approveDocument() {
    if (!reviewingDocument) return;

    setApproving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { error: documentError } = await supabase
        .from("documents")
        .update({
          status: "approved",
        })
        .eq("id", reviewingDocument.id);

      if (documentError) {
        throw new Error(
          `${
            isES
              ? "No se pudo marcar el documento como revisado"
              : "Unable to mark document as reviewed"
          }: ${documentError.message}`
        );
      }

      setDocuments((current) =>
        current.map((documentRow) =>
          documentRow.id === reviewingDocument.id
            ? {
                ...documentRow,
                status: "approved",
              }
            : documentRow
        )
      );

      setMessage(text.approvedSuccess);

      setReviewingDocument(null);
      setReviewResult(null);

      if (selectedLoadId) {
        await loadDocuments(selectedLoadId);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text.unableApprove
      );
    } finally {
      setApproving(false);
    }
  }

  async function declineDocument() {
    if (!reviewingDocument) return;

    setDeclining(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          status: "rejected",
        })
        .eq("id", reviewingDocument.id);

      if (error) {
        throw new Error(error.message);
      }

      setDocuments((current) =>
        current.map((documentRow) =>
          documentRow.id === reviewingDocument.id
            ? {
                ...documentRow,
                status: "rejected",
              }
            : documentRow
        )
      );

      setMessage(text.rejectedSuccess);

      setReviewingDocument(null);
      setReviewResult(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text.unableReject
      );
    } finally {
      setDeclining(false);
    }
  }

  function closeReview() {
    if (reviewing || savingStopAssociation || approving || declining) return;

    setReviewingDocument(null);
    setReviewResult(null);
    setErrorMessage("");
  }

  const documentColumns = [
    {
      key: "document_type" as keyof Document,
      label: isES ? "Tipo" : "Type",
      render: (value: Document[keyof Document]) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 9px",
            borderRadius: "999px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "11px",
            fontWeight: 800,
          }}
        >
          {String(value)}
        </span>
      ),
    },
    {
      key: "file_name" as keyof Document,
      label: isES ? "Archivo" : "File",
      render: (value: Document[keyof Document]) => (
        <span
          style={{
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {String(value)}
        </span>
      ),
    },
    {
      key: "status" as keyof Document,
      label: isES ? "Estado" : "Status",
      render: (value: Document[keyof Document]) => (
        <StatusBadge status={String(value ?? "pending")} />
      ),
    },
    {
      key: "uploaded_at" as keyof Document,
      label: isES ? "Fecha" : "Uploaded",
      render: (value: Document[keyof Document]) => (
        <span style={{ color: "#64748b" }}>
          {formatDate(value as string | null)}
        </span>
      ),
    },
    {
      key: "id" as keyof Document,
      label: isES ? "Acciones" : "Actions",
      render: (_value: Document[keyof Document], row: Document) => (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <ActionButton
            variant="secondary"
            onClick={() => openDocument(row)}
          >
            {text.open}
          </ActionButton>

          <ActionButton
            variant="primary"
            onClick={() => openDocumentReview(row)}
          >
            {text.aiReview}
          </ActionButton>

          <ActionButton
            variant="danger"
            onClick={() => deleteDocument(row)}
          >
            {text.delete}
          </ActionButton>
        </div>
      ),
    },
  ];

  const historyDocumentColumns = [
    {
      key: "document_type" as keyof Document,
      label: isES ? "Tipo" : "Type",
    },
    {
      key: "file_name" as keyof Document,
      label: isES ? "Archivo" : "File",
    },
    {
      key: "status" as keyof Document,
      label: isES ? "Estado final" : "Final Status",
      render: (value: Document[keyof Document]) => (
        <StatusBadge status={String(value ?? "—")} />
      ),
    },
    {
      key: "uploaded_at" as keyof Document,
      label: isES ? "Fecha" : "Date",
      render: (value: Document[keyof Document]) => (
        <span style={{ color: "#64748b" }}>{formatDate(value as string | null)}</span>
      ),
    },
    {
      key: "id" as keyof Document,
      label: isES ? "Archivo" : "File",
      render: (_value: Document[keyof Document], row: Document) => (
        <ActionButton variant="secondary" onClick={() => openDocument(row)}>
          {text.open}
        </ActionButton>
      ),
    },
  ];

  return (
    <>
      <PageContainer>
        <PageHeader
          eyebrow={text.eyebrow}
          title={text.title}
          description={text.description}
          action={text.refresh}
          onAction={() => {
            loadData();

            if (selectedLoadId) {
              loadDocuments(selectedLoadId);
            }
            if (selectedHistoryLoadId) {
              const historyLoadId = selectedHistoryLoadId;
              void (async () => {
                const { data, error } = await supabase
                  .from("documents")
                  .select("id, load_id, load_stop_id, document_type, file_name, storage_path, status, uploaded_at")
                  .eq("load_id", historyLoadId)
                  .order("uploaded_at", { ascending: false });
                if (!error) setHistoryDocuments((data ?? []) as Document[]);
              })();
            }
          }}
        />

        {message && (
          <div
            style={{
              marginBottom: "20px",
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
              borderRadius: "12px",
              padding: "13px 16px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginBottom: "20px",
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              borderRadius: "12px",
              padding: "13px 16px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            label={text.total}
            value={documents.length}
          />

          <StatCard
            label={text.bol}
            value={bolCount}
          />

          <StatCard
            label={text.pod}
            value={podCount}
          />

          <StatCard
            label={text.rateConfirmations}
            value={rateConfirmationCount}
          />

          <StatCard
            label={text.aiReviewed}
            value={reviewedCount}
          />

          <StatCard
            label={text.pendingReview}
            value={pendingCount}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(300px, 360px) minmax(0, 1fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div>
            <SectionCard
              title={text.uploadTitle}
              description={`${text.uploadDescription} ${text.pendingLoadsDescription}`}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "17px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {text.load}
                  </label>

                  <select
                    value={selectedLoadId}
                    onChange={(event) => {
                      setSelectedLoadId(event.target.value);
                      setSelectedLoadStopId("");
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #cbd5e1",
                      borderRadius: "9px",
                      background: "#ffffff",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: "#334155",
                      outline: "none",
                    }}
                  >
                    <option value="">
                      {loadingLoads
                        ? text.loadingLoads
                        : text.selectLoad}
                    </option>

                  {currentLoads.map((load) => {
                    const pickupLabels = getPickupLabelsForLoad(load.id);
                    return (
                      <option key={load.id} value={load.id}>
                        {pickupLabels.length ? pickupLabels.join(" / ") : (isES ? "Sin etiqueta PU" : "No PU label")}
                        {load.broker_name ? ` — ${load.broker_name}` : ""}
                        {` · ${load.load_number || load.id.slice(0, 8)}`}
                      </option>
                    );
                  })}
                  </select>
                  {!loadingLoads && currentLoads.length === 0 && (
                    <p style={{ margin: "7px 0 0", color: "#b45309", fontSize: "12px" }}>
                      {text.noCurrentLoads}
                    </p>
                  )}
                </div>

                {selectedLoad && (
                  <div
                    style={{
                      borderRadius: "11px",
                      background: "#f8fafc",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#94a3b8",
                      }}
                    >
                      {text.selectedLoad}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {selectedPickupLabels.length
                        ? selectedPickupLabels.join(" / ")
                        : (isES ? "Sin etiqueta PU" : "No PU label")}
                    </div>
                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      {(isES ? "Carga" : "Load")}: {selectedLoad.load_number || selectedLoad.id.slice(0, 8)}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "12px",
                        color: "#64748b",
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedLoad.origin_city ?? "—"},{" "}
                      {selectedLoad.origin_state ?? ""}
                      {" → "}
                      {selectedLoad.destination_city ?? "—"},{" "}
                      {selectedLoad.destination_state ?? ""}
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ color: "#64748b" }}>
                        {text.loadRate}
                      </span>

                      <strong>
                        {formatMoney(selectedLoad.rate)}
                      </strong>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {text.documentType}
                  </label>

                  <select
                    value={selectedDocumentType}
                    onChange={(event) => {
                      setSelectedDocumentType(event.target.value);
                      setSelectedLoadStopId("");
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #cbd5e1",
                      borderRadius: "9px",
                      background: "#ffffff",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: "#334155",
                      outline: "none",
                    }}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {requiredStopType && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      {text.stop} ({selectedDocumentType === "BOL" ? text.pickup : text.delivery})
                    </label>

                    <select
                      value={selectedLoadStopId}
                      onChange={(event) => setSelectedLoadStopId(event.target.value)}
                      disabled={!selectedLoad || loadingLoads || loadStops.length === 0 || eligibleStops.length === 0}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border: "1px solid #cbd5e1",
                        borderRadius: "9px",
                        background: "#ffffff",
                        padding: "10px 12px",
                        fontSize: "13px",
                        color: "#334155",
                        outline: "none",
                      }}
                    >
                      <option value="">
                        {loadStops.length === 0
                          ? text.loadingStops
                          : eligibleStops.length === 0
                            ? selectedDocumentType === "BOL"
                              ? text.noPickupStops
                              : text.noDeliveryStops
                            : text.selectStop}
                      </option>
                      {eligibleStops.map((stop) => {
                        const stopAddress = [stop.address, stop.city, stop.state]
                          .filter(Boolean)
                          .join(", ");
                        const stopLabel =
                          selectedDocumentType === "BOL"
                            ? (formatPickupNumber(stop.pickup_number) || `PU-${stop.stop_order}`)
                            : `Delivery ${stop.stop_order}`;
                        return (
                          <option key={stop.id} value={stop.id}>
                            {stopLabel}{stopAddress ? ` — ${stopAddress}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "11px",
                        color: "#64748b",
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedDocumentType === "BOL"
                        ? text.pickupStopRequired
                        : text.deliveryStopRequired}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {text.file}
                  </label>

                  <input
                    id="document-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "9px",
                      background: "#f8fafc",
                      padding: "12px",
                      fontSize: "12px",
                    }}
                  />

                  {selectedFile && (
                    <p
                      style={{
                        margin: "7px 0 0",
                        fontSize: "11px",
                        color: "#64748b",
                        wordBreak: "break-word",
                      }}
                    >
                      {text.selected}: {selectedFile.name}
                    </p>
                  )}
                </div>

                <ActionButton
                  variant="primary"
                  onClick={uploadDocument}
                  disabled={uploading}
                >
                  {uploading ? text.uploading : text.upload}
                </ActionButton>

                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    lineHeight: 1.5,
                    color: "#94a3b8",
                  }}
                >
                  {text.supported}
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title={text.validationTitle}
              description={text.validationDescription}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    {text.linkedLoad}
                  </span>

                  <strong
                    style={{
                      color: selectedLoad
                        ? "#059669"
                        : "#94a3b8",
                    }}
                  >
                    {selectedLoad ? text.yes : text.no}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    {text.documents}
                  </span>

                  <strong>{documents.length}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    {text.financeReady}
                  </span>

                  <strong
                    style={{
                      color: financeReady ? "#059669" : "#94a3b8",
                    }}
                  >
                    {financeReady ? text.available : text.waiting}
                  </strong>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title={text.loadDocuments}
            description={
              selectedLoad
                ? `${text.associated} ${selectedPickupLabels.length ? selectedPickupLabels.join(" / ") : selectedLoad.load_number}`
                : text.selectToView
            }
          >
            {selectedLoad && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    padding: "8px 11px",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    {text.loadStatus}:
                  </span>

                  <strong>
                    {selectedLoad.status ?? "—"}
                  </strong>
                </div>
              </div>
            )}

            {loadingDocuments ? (
              <div
                style={{
                  padding: "35px 10px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                {text.loadingDocuments}
              </div>
            ) : !selectedLoad ? (
              <div
                style={{
                  padding: "35px 10px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                {text.selectLoadToSee}
              </div>
            ) : documents.length === 0 ? (
              <div
                style={{
                  padding: "35px 10px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  {text.noDocuments}
                </p>

                <p
                  style={{
                    margin: "7px auto 0",
                    maxWidth: "420px",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "#64748b",
                  }}
                >
                  {text.noDocumentsDescription}
                </p>
              </div>
            ) : (
              <DataTable
                columns={documentColumns}
                data={documents}
                emptyMessage={text.noDocuments}
              />
            )}
          </SectionCard>
        </div>

        <div style={{ marginTop: "22px" }}>
          <SectionCard
            title={text.completedHistoryTitle}
            description={text.completedHistoryDescription}
          >
            <div style={{ display: "grid", gap: "14px" }}>
              <label style={{ display: "grid", gap: "7px", maxWidth: "520px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                {text.selectHistoryLoad}
                <select
                  value={selectedHistoryLoadId}
                  onChange={(event) => setSelectedHistoryLoadId(event.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "9px", background: "#ffffff", padding: "10px 12px", fontSize: "13px", color: "#0f172a" }}
                >
                  <option value="">{text.selectHistoryLoad}</option>
                  {historyLoads.map((load) => {
                    const labels = getPickupLabelsForLoad(load.id);
                    return (
                      <option key={load.id} value={load.id}>
                        {labels.length ? labels.join(" / ") : (isES ? "Sin etiqueta PU" : "No PU label")}
                        {` · ${load.load_number || load.id.slice(0, 8)}`}
                        {load.status ? ` — ${load.status}` : ""}
                      </option>
                    );
                  })}
                </select>
              </label>

              {historyLoads.length === 0 ? (
                <p style={{ margin: 0, padding: "20px 0", color: "#64748b", fontSize: "13px" }}>{text.noHistoricalLoads}</p>
              ) : loadingHistoryDocuments ? (
                <p style={{ margin: 0, padding: "20px 0", color: "#64748b", fontSize: "13px" }}>{text.loadingDocuments}</p>
              ) : completedHistoryDocuments.length === 0 ? (
                <p style={{ margin: 0, padding: "20px 0", color: "#64748b", fontSize: "13px" }}>{text.noCompletedHistoryDocuments}</p>
              ) : (
                <DataTable
                  columns={historyDocumentColumns}
                  data={completedHistoryDocuments}
                  emptyMessage={text.noCompletedHistoryDocuments}
                />
              )}
            </div>
          </SectionCard>
        </div>
      </PageContainer>

      {reviewingDocument && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.55)",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1050px",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                padding: "18px 22px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#2563eb",
                  }}
                >
                  {text.aiDocumentReview}
                </div>

                <h2
                  style={{
                    margin: "5px 0 0",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0f172a",
                    wordBreak: "break-word",
                  }}
                >
                  {reviewingDocument.file_name}
                </h2>
              </div>

              <ActionButton
                variant="secondary"
                onClick={closeReview}
                disabled={reviewing || savingStopAssociation || approving || declining}
              >
                {text.close}
              </ActionButton>
            </div>

            {(reviewingDocument.document_type.trim().toUpperCase() === "BOL" ||
              reviewingDocument.document_type.trim().toUpperCase() === "POD") && (
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <label
                  htmlFor="review-associated-stop"
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#334155",
                  }}
                >
                  {text.correctAssociatedStop}
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    id="review-associated-stop"
                    value={reviewStopId}
                    onChange={(event) => setReviewStopId(event.target.value)}
                    disabled={reviewing || savingStopAssociation}
                    style={{
                      flex: "1 1 340px",
                      minWidth: 0,
                      padding: "10px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "12px",
                    }}
                  >
                    <option value="">{text.selectStop}</option>
                    {reviewEligibleStops.map((stop) => {
                      const label = reviewingDocument.document_type.trim().toUpperCase() === "BOL"
                        ? formatPickupNumber(stop.pickup_number)
                        : `${text.delivery} ${stop.stop_order}`;
                      const address = [stop.address, stop.city, stop.state].filter(Boolean).join(", ");
                      return (
                        <option key={stop.id} value={stop.id}>
                          {`${label || `${text.stop} ${stop.stop_order}`} — ${address || "—"}`}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={saveStopAssociationAndReview}
                    disabled={reviewing || savingStopAssociation || !reviewStopId || reviewEligibleStops.length === 0}
                    style={{
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 13px",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: reviewing || savingStopAssociation || !reviewStopId || reviewEligibleStops.length === 0
                        ? "not-allowed"
                        : "pointer",
                      opacity: reviewing || savingStopAssociation || !reviewStopId || reviewEligibleStops.length === 0
                        ? 0.55
                        : 1,
                    }}
                  >
                    {savingStopAssociation ? text.savingStop : text.saveStopAndReview}
                  </button>
                </div>
                <p style={{ margin: "7px 0 0", color: "#64748b", fontSize: "11px", lineHeight: 1.5 }}>
                  {reviewEligibleStops.length > 0 ? text.chooseCorrectStop : text.noMatchingStops}
                </p>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                style={{
                  margin: "16px 22px 0",
                  padding: "11px 13px",
                  border: "1px solid #fecaca",
                  borderRadius: "9px",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                {errorMessage}
              </div>
            )}

            {reviewing ? (
              <div
                style={{
                  padding: "65px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    margin: "0 auto",
                    border: "4px solid #e2e8f0",
                    borderTopColor: "#2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />

                <h3
                  style={{
                    margin: "18px 0 0",
                    fontSize: "17px",
                    fontWeight: 800,
                  }}
                >
                  {text.aiReviewing}
                </h3>

                <p
                  style={{
                    margin: "8px auto 0",
                    maxWidth: "600px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#64748b",
                  }}
                >
                  {text.aiReviewDescription}
                </p>
              </div>
            ) : reviewResult ? (
              <div
                style={{
                  padding: "22px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    {
                      label: text.load,
                      value: reviewResult.load
                        ? text.pass
                        : text.fail,
                      ok: reviewResult.load,
                    },
                    {
                      label: text.documentType,
                      value: reviewResult.documentType
                        ? text.pass
                        : text.fail,
                      ok: reviewResult.documentType,
                    },
                    {
                      label: text.file,
                      value: reviewResult.file
                        ? text.pass
                        : text.fail,
                      ok: reviewResult.file,
                    },
                    {
                      label: text.invoiceReady,
                      value: reviewResult.reviewPreconditions
                        ? text.yes
                        : text.review,
                      ok: reviewResult.reviewPreconditions,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        border: `1px solid ${
                          item.ok ? "#bbf7d0" : "#fde68a"
                        }`,
                        borderRadius: "11px",
                        background: item.ok
                          ? "#f0fdf4"
                          : "#fffbeb",
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#64748b",
                        }}
                      >
                        {item.label}
                      </div>

                      <div
                        style={{
                          marginTop: "7px",
                          fontSize: "16px",
                          fontWeight: 800,
                          color: item.ok
                            ? "#166534"
                            : "#92400e",
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <SectionCard
                    title={text.loadInformation}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        fontSize: "13px",
                      }}
                    >
                      {[
                        [
                          text.loadNumber,
                          reviewResult.loadNumber,
                        ],
                        [text.broker, reviewResult.broker],
                        [text.origin, reviewResult.origin],
                        [
                          text.destination,
                          reviewResult.destination,
                        ],
                        [
                          text.loadAmount,
                          formatMoney(
                            reviewResult.loadAmount
                          ),
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "16px",
                          }}
                        >
                          <span style={{ color: "#64748b" }}>
                            {label}
                          </span>

                          <strong
                            style={{
                              textAlign: "right",
                              color: "#0f172a",
                            }}
                          >
                            {value ?? "—"}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title={isES ? "Revisión humana" : "Human Review"}>
                    <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.65, color: "#475569" }}>
                      {isES
                        ? "Abre el archivo original, compara la información con la carga y la parada asociada, y usa Aprobar documento o Rechazar documento para registrar tu decisión. Los indicadores de esta pantalla no sustituyen la inspección humana."
                        : "Open the original file, compare its information with the load and associated stop, then use Approve Document or Decline Document to record your decision. The indicators on this screen do not replace human inspection."}
                    </p>
                    <div style={{ marginTop: "12px" }}>
                      <ActionButton variant="secondary" onClick={() => openDocument(reviewingDocument)}>
                        {isES ? "Abrir archivo original" : "Open Original File"}
                      </ActionButton>
                    </div>
                  </SectionCard>
                </div>

                {(reviewResult.summary || reviewResult.issues.length > 0 || reviewResult.validationPassed !== null) && (
                  <SectionCard title={text.aiSummary}>
                    {reviewResult.validationPassed !== null && (
                      <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, color: reviewResult.validationPassed ? "#166534" : "#b91c1c" }}>
                        {reviewResult.validationPassed ? text.validationPassed : text.validationFailed}
                      </p>
                    )}
                    {reviewResult.summary && (
                      <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.6, color: "#334155", whiteSpace: "pre-wrap" }}>
                        {reviewResult.summary}
                      </p>
                    )}
                    {reviewResult.issues.length > 0 && (
                      <div style={{ marginTop: "12px" }}>
                        <strong style={{ fontSize: "12px", color: "#334155" }}>{text.aiIssues}</strong>
                        <ul style={{ margin: "6px 0 0", paddingLeft: "20px", fontSize: "12px", lineHeight: 1.6, color: "#475569" }}>
                          {reviewResult.issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}
                        </ul>
                      </div>
                    )}
                  </SectionCard>
                )}

                <SectionCard title={text.checks}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {reviewResult.checks.map(
                      (check, index) => (
                        <div
                          key={`${check}-${index}`}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            borderRadius: "9px",
                            background: "#f8fafc",
                            padding: "10px 12px",
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: "#059669",
                            }}
                          >
                            ✓
                          </span>

                          <span>{check}</span>
                        </div>
                      )
                    )}
                  </div>
                </SectionCard>

                <div
                  style={{
                    marginTop: "16px",
                    border: `1px solid ${
                      reviewResult.financeReady
                        ? "#bbf7d0"
                        : "#fde68a"
                    }`,
                    borderRadius: "12px",
                    background: reviewResult.financeReady
                      ? "#f0fdf4"
                      : "#fffbeb",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div style={{ maxWidth: "720px" }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 800,
                        }}
                      >
                        {text.financeReadiness}
                      </h3>

                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#475569",
                        }}
                      >
                        {text.financeReadinessDescription}{" "}
                        <strong>
                          {reviewResult.loadNumber ?? "—"}
                        </strong>
                        .
                      </p>
                    </div>

                    <div
                      style={{
                        borderRadius: "8px",
                        background: reviewResult.financeReady
                          ? "#059669"
                          : "#f59e0b",
                        color: "#ffffff",
                        padding: "9px 12px",
                        fontSize: "11px",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {reviewResult.financeReady
                        ? text.readyForFinance
                        : text.reviewRequired}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "18px",
                    paddingTop: "18px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <ActionButton
                    variant="danger"
                    onClick={declineDocument}
                    disabled={approving || declining}
                  >
                    {declining
                      ? text.declining
                      : text.decline}
                  </ActionButton>

                  <button
                    type="button"
                    onClick={approveDocument}
                    disabled={
                      approving ||
                      declining ||
                      !reviewResult.reviewPreconditions
                    }
                    style={{
                      border: "none",
                      borderRadius: "9px",
                      padding: "10px 15px",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor:
                        approving ||
                        declining ||
                        !reviewResult.reviewPreconditions
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        approving ||
                        declining ||
                        !reviewResult.reviewPreconditions
                          ? 0.5
                          : 1,
                    }}
                  >
                    {approving
                      ? text.approving
                      : text.approve}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                {text.unableGenerate}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          div[style*="360px_1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

