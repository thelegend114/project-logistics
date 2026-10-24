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
};

type Document = {
  id: string;
  load_id: string | null;
  document_type: string;
  file_name: string;
  storage_path: string | null;
  status: string | null;
  uploaded_at: string | null;
};

type ReviewResult = {
  load: boolean;
  documentType: boolean;
  file: boolean;
  loadStatus: boolean;
  invoiceReady: boolean;
  bolNumber: string | null;
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

export default function DocumentsPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    eyebrow: isES ? "Gestión documental" : "Document management",
    title: isES ? "Documentos" : "Documents",
    description: isES
      ? "Gestión central de documentos, revisión con IA, validación cruzada y preparación para Finanzas."
      : "Central document management, AI review, cross-document validation and Finance readiness.",
    refresh: isES ? "Actualizar datos" : "Refresh Data",

    total: isES ? "Total de documentos" : "Total Documents",
    bol: "BOL",
    pod: "POD",
    rateConfirmations: isES
      ? "Confirmaciones de tarifa"
      : "Rate Confirmations",
    aiReviewed: isES ? "Revisados por IA" : "AI Reviewed",
    pendingReview: isES ? "Pendientes de revisión" : "Pending Review",

    uploadTitle: isES ? "Subir documento" : "Upload Document",
    uploadDescription: isES
      ? "Adjunta un documento a una carga."
      : "Attach a document to a load.",
    load: isES ? "Carga" : "Load",
    loadingLoads: isES ? "Cargando cargas..." : "Loading loads...",
    selectLoad: isES ? "Selecciona una carga" : "Select a load",
    selectedLoad: isES ? "Carga seleccionada" : "Selected Load",
    loadRate: isES ? "Tarifa de carga" : "Load Rate",
    documentType: isES ? "Tipo de documento" : "Document Type",
    file: isES ? "Archivo" : "File",
    selected: isES ? "Seleccionado" : "Selected",
    uploading: isES ? "Subiendo..." : "Uploading...",
    upload: isES ? "Subir documento" : "Upload Document",
    supported: isES
      ? "Formatos permitidos: PDF, JPG, PNG, WEBP. Tamaño máximo: 15 MB."
      : "Supported formats: PDF, JPG, PNG, WEBP. Maximum file size: 15MB.",

    validationTitle: isES
      ? "Validación entre documentos"
      : "Cross-Document Validation",
    validationDescription: isES
      ? "La revisión con IA compara el documento seleccionado con el registro de la carga y prepara la información necesaria para Finanzas."
      : "AI review checks the selected document against the load record and prepares the information needed by Finance.",
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
    aiReview: isES ? "Revisión IA" : "AI Review",
    delete: isES ? "Eliminar" : "Delete",

    aiDocumentReview: isES
      ? "Revisión de documento con IA"
      : "AI Document Review",
    close: isES ? "Cerrar" : "Close",
    aiReviewing: isES
      ? "La IA está revisando el documento"
      : "AI is reviewing the document",
    aiReviewDescription: isES
      ? "Comprobando información de carga, tipo de documento, disponibilidad del archivo y preparación para Finanzas."
      : "Checking load information, document type, file availability and Finance readiness.",
    pass: isES ? "APROBADO" : "PASS",
    fail: isES ? "FALLÓ" : "FAIL",
    review: isES ? "REVISAR" : "REVIEW",
    invoiceReady: isES ? "Listo para factura" : "Invoice Ready",
    loadInformation: isES ? "Información de carga" : "Load Information",
    loadNumber: isES ? "Número de carga" : "Load Number",
    broker: isES ? "Broker" : "Broker",
    origin: isES ? "Origen" : "Origin",
    destination: isES ? "Destino" : "Destination",
    loadAmount: isES ? "Monto de carga" : "Load Amount",

    intelligence: isES
      ? "Inteligencia del documento"
      : "Document Intelligence",
    bolNumber: isES ? "Número BOL" : "BOL Number",
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
      ? "Aprobar este documento lo marca como revisado. Finanzas utilizará el documento revisado al comprobar si la carga está lista para facturación."
      : "Approving this document marks it as reviewed. Finance will use the reviewed document when checking invoice readiness for this load.",
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
      ? "Registrando en Finanzas..."
      : "Registering in Finance...",
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
  const [loadPickupLabels, setLoadPickupLabels] = useState<Record<string, string[]>>({});
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
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLoad = useMemo(
    () =>
      loads.find((load) => load.id === selectedLoadId) ?? null,
    [loads, selectedLoadId]
  );

  const reviewedCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "reviewed" ||
          document.status === "approved"
      ).length,
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedLoadId) {
      setDocuments([]);
      return;
    }

    loadDocuments(selectedLoadId);
  }, [selectedLoadId]);

  // Load pickup numbers for the Documents selector.
// Cargar los números de recogida para el selector de Documents.
useEffect(() => {
  const loadIds = loads.map((load) => String(load.id));

  if (loadIds.length === 0) {
    setLoadPickupLabels({});
    return;
  }

  let cancelled = false;

  void (async () => {
    const { data, error } = await supabase
      .from("load_stops")
      .select("load_id, stop_order, stop_type, pickup_number")
      .in("load_id", loadIds)
      .order("stop_order", { ascending: true });

    if (cancelled) return;

    if (error) {
      console.error("DOCUMENT PICKUP LABELS ERROR:", error);
      setLoadPickupLabels({});
      return;
    }

    const labels: Record<string, string[]> = {};

    for (const stop of data ?? []) {
      const stopType = String(stop.stop_type ?? "")
        .trim()
        .toLowerCase();

      const pickupNumber = String(stop.pickup_number ?? "").trim();

      if (
        !["pickup", "pick_up", "pick-up"].includes(stopType) ||
        !pickupNumber
      ) {
        continue;
      }

      const loadId = String(stop.load_id);

      if (!labels[loadId]) {
        labels[loadId] = [];
      }

      if (!labels[loadId].includes(pickupNumber)) {
        labels[loadId].push(pickupNumber);
      }
    }

    setLoadPickupLabels(labels);
  })();

  return () => {
    cancelled = true;
  };
}, [loads, supabase]);

  async function loadData() {
    setLoadingLoads(true);
    setErrorMessage("");

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
    }));

    setLoads(formattedLoads);

    if (!selectedLoadId && formattedLoads.length > 0) {
      setSelectedLoadId(formattedLoads[0].id);
    }

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

      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          company_id: selectedLoad.company_id,
          load_id: selectedLoad.id,
          document_type: selectedDocumentType,
          file_name: selectedFile.name,
          storage_path: storagePath,
          status: "uploaded",
        });

      if (insertError) {
        await supabase.storage
          .from("load-documents")
          .remove([storagePath]);

        throw new Error(insertError.message);
      }

      setSelectedFile(null);

      const input = document.getElementById(
        "document-file"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setMessage(text.uploadedSuccess);

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

    const invoiceReady =
      hasLoad && hasDocumentType && hasFile;

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
      invoiceReady,
      bolNumber: null,
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

  async function startAIReview(documentRow: Document) {
    setReviewingDocument(documentRow);
    setReviewResult(null);
    setErrorMessage("");
    setMessage("");
    setReviewing(true);

    const load =
      loads.find(
        (item) => item.id === documentRow.load_id
      ) ?? null;

    await new Promise((resolve) =>
      setTimeout(resolve, 900)
    );

    const result = buildIntelligence(
      load,
      documentRow
    );

    setReviewResult(result);
    setReviewing(false);
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
          status: "reviewed",
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
                status: "reviewed",
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
    if (approving || declining) return;

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
            onClick={() => startAIReview(row)}
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
              description={text.uploadDescription}
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
                    onChange={(event) =>
                      setSelectedLoadId(event.target.value)
                    }
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

         {loads.map((load) => {
  const pickupLabels = loadPickupLabels[String(load.id)];

  return (
    <option key={load.id} value={load.id}>
      {pickupLabels?.length
        ? pickupLabels.join(" / ")
        : load.load_number}
      {load.broker_name ? ` — ${load.broker_name}` : ""}
    </option>
  );
})}
                  </select>
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
                      {selectedLoad.load_number}
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
                    onChange={(event) =>
                      setSelectedDocumentType(
                        event.target.value
                      )
                    }
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
                      color:
                        documents.length > 0
                          ? "#059669"
                          : "#94a3b8",
                    }}
                  >
                    {documents.length > 0
                      ? text.available
                      : text.waiting}
                  </strong>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title={text.loadDocuments}
            description={
              selectedLoad
                ? `${text.associated} ${selectedLoad.load_number}`
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
                disabled={approving || declining}
              >
                {text.close}
              </ActionButton>
            </div>

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
                      value: reviewResult.invoiceReady
                        ? text.yes
                        : text.review,
                      ok: reviewResult.invoiceReady,
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

                  <SectionCard
                    title={text.intelligence}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: "16px",
                        fontSize: "12px",
                      }}
                    >
                      {[
                        [
                          text.bolNumber,
                          reviewResult.bolNumber,
                        ],
                        [
                          text.documentDate,
                          reviewResult.documentDate,
                        ],
                        [
                          text.documentAmount,
                          reviewResult.documentAmount !== null
                            ? formatMoney(
                                reviewResult.documentAmount
                              )
                            : text.notExtracted,
                        ],
                        [
                          text.amountDifference,
                          reviewResult.amountDifference !== null
                            ? formatMoney(
                                reviewResult.amountDifference
                              )
                            : text.notCalculated,
                        ],
                        [
                          text.commodity,
                          reviewResult.commodity,
                        ],
                        [text.weight, reviewResult.weight],
                        [
                          text.equipment,
                          reviewResult.equipment,
                        ],
                        [text.hazmat, reviewResult.hazmat],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "10px",
                            }}
                          >
                            {label}
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              fontWeight: 700,
                              color: "#334155",
                            }}
                          >
                            {value ?? text.notExtracted}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

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
                      reviewResult.invoiceReady
                        ? "#bbf7d0"
                        : "#fde68a"
                    }`,
                    borderRadius: "12px",
                    background: reviewResult.invoiceReady
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
                        background: reviewResult.invoiceReady
                          ? "#059669"
                          : "#f59e0b",
                        color: "#ffffff",
                        padding: "9px 12px",
                        fontSize: "11px",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {reviewResult.invoiceReady
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
                      !reviewResult.invoiceReady
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
                        !reviewResult.invoiceReady
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        approving ||
                        declining ||
                        !reviewResult.invoiceReady
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

