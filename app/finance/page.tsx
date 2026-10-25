"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../lib/LanguageProvider";

import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import SectionCard from "../../components/SectionCard";
import StatusBadge from "../../components/StatusBadge";
import ActionButton from "../../components/ActionButton";
import DataTable from "../../components/DataTable";

type Invoice = {
 id: string;
  company_id: string;
  load_id: string | null;
  broker_name: string | null;
  invoice_number: string;
  invoice_amount: number | null;
  invoice_date: string | null;
  due_date: string | null;
  status: string | null;
  created_at: string | null;
};

type Expense = {
  id: string;
  company_id: string;
  category: string | null;
  description: string | null;
  amount: number | null;
  expense_date: string | null;
  status: string | null;
};

type FactoringSubmission = {
  id: string;
  company_id: string;
  invoice_id: string | null;
  factoring_company: string | null;
  submitted_amount: number | null;
  advance_amount: number | null;
  reserve_amount: number | null;
  factoring_fee: number | null;
  status: string | null;
  submitted_at: string | null;
  funded_at: string | null;
};

type Settlement = {
  id: string;
  company_id: string;
  driver_id: string;
  settlement_period_start: string | null;
  settlement_period_end: string | null;
  gross_amount: number | null;
  deductions: number | null;
  net_amount: number | null;
  status: string | null;
  created_at: string | null;
};

type Load = {
  id: string;
  company_id: string;
  load_number: string | null;
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
  document_type: string | null;
  file_name: string | null;
  storage_path: string | null;
  status: string | null;
  uploaded_at: string | null;
};

type LoadReadiness = {
  load: Load;
  documents: Document[];
  hasBOL: boolean;
  hasPOD: boolean;
  hasRateConfirmation: boolean;
  ready: boolean;
};

type ReviewResult = {
  load: Load;
  documentType: string;
  file: string;
  loadStatus: string;
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
  checks: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
};

const money = (value: number | null | undefined) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalize = (value: string | null | undefined) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

function isApprovedDocument(document: Document) {
  const status = normalize(document.status);

  // A document that was only reviewed is not yet approved for invoicing.
  return [
    "approved",
    "document approved",
  ].includes(status);
}

function documentTypeMatches(
  document: Document,
  type: "bol" | "pod" | "rate"
) {
  const value = normalize(document.document_type);

  if (type === "bol") {
    return (
      value.includes("bol") ||
      value.includes("bill of lading")
    );
  }

  if (type === "pod") {
    return (
      value.includes("pod") ||
      value.includes("proof of delivery")
    );
  }

  if (type === "rate") {
    // Require both terms so unrelated confirmation documents do not qualify.
    return value.includes("rate") && value.includes("confirmation");
  }

  return false;
}

export default function FinancePage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    eyebrow: isES ? "CONTROL FINANCIERO" : "FINANCIAL CONTROL",
    title: isES ? "Finanzas" : "Finance",
    description: isES
      ? "Control de ingresos, gastos, facturas, settlements y factoring."
      : "Control revenue, expenses, invoices, settlements, and factoring.",

    refresh: isES ? "Actualizar" : "Refresh",
    addExpense: isES ? "Agregar gasto" : "Add Expense",
    prepareInvoice: isES ? "Preparar factura" : "Prepare Invoice",

    revenue: isES ? "Ingresos" : "Revenue",
    expenses: isES ? "Gastos" : "Expenses",
    driverPay: isES ? "Pago a choferes" : "Driver Pay",
    deductions: isES ? "Deducciones" : "Deductions",
    profit: isES ? "Ganancia" : "Profit",
    outstanding: isES ? "Pendiente" : "Outstanding",

    invoiceWorkflow: isES
      ? "Flujo de facturación"
      : "Invoice Workflow",

    documentReadiness: isES
      ? "Documentos para facturar"
      : "Document Readiness",

    commandCenter: isES
      ? "Centro financiero"
      : "Finance Command Center",

    invoices: isES ? "Facturas" : "Invoices",
    expensesTab: isES ? "Gastos" : "Expenses",
    settlements: isES ? "Liquidaciones" : "Settlements",

    search: isES ? "Buscar..." : "Search...",
    noInvoices: isES ? "No hay facturas." : "No invoices found.",
    noExpenses: isES ? "No hay gastos." : "No expenses found.",
    noSettlements: isES
      ? "No hay liquidaciones."
      : "No settlements found.",

    invoiceNumber: isES ? "Factura" : "Invoice",
    customer: isES ? "Cliente" : "Customer",
    amount: isES ? "Monto" : "Amount",
    status: isES ? "Estado" : "Status",
    dueDate: isES ? "Vencimiento" : "Due Date",

    category: isES ? "Categoría" : "Category",
    descriptionColumn: isES ? "Descripción" : "Description",
    date: isES ? "Fecha" : "Date",


    driver: isES ? "Chofer" : "Driver",
    gross: isES ? "Bruto" : "Gross",
    deductionsCol: isES ? "Deducciones" : "Deductions",
    net: isES ? "Neto" : "Net",

    ready: isES ? "Listas para facturar" : "Ready to Invoice",
    blocked: isES ? "Bloqueadas" : "Blocked",

    load: isES ? "Carga" : "Load",
    broker: isES ? "Broker" : "Broker",
    route: isES ? "Ruta" : "Route",

    bol: "BOL",
    pod: "POD",
    rateConfirmation: isES
      ? "Confirmación de tarifa"
      : "Rate Confirmation",

    approved: isES ? "Aprobado" : "Approved",
    missing: isES ? "Faltante" : "Missing",

    reviewInvoice: isES
      ? "Revisar factura"
      : "Review Invoice",

    invoiceReview: isES
      ? "Revisión de factura"
      : "Invoice Review",

    aiReview: isES
      ? "Revisión con IA"
      : "AI Review",

    aiBanner: isES
      ? "La IA revisa los datos y documentos. La decisión final permanece bajo control humano."
      : "AI reviews the data and documents. The final decision remains under human control.",

    close: isES ? "Cerrar" : "Close",
    cancel: isES ? "Cancelar" : "Cancel",
    save: isES ? "Guardar" : "Save",
    approve: isES ? "Aprobar" : "Approve",
    sendFactoring: isES
      ? "Enviar a factoring"
      : "Send to Factoring",

    expenseCategory: isES
      ? "Categoría del gasto"
      : "Expense Category",

    expenseDescription: isES
      ? "Descripción del gasto"
      : "Expense Description",

    expenseAmount: isES
      ? "Monto del gasto"
      : "Expense Amount",

    expenseDate: isES
      ? "Fecha del gasto"
      : "Expense Date",

    invoiceAmount: isES
      ? "Monto de factura"
      : "Invoice Amount",

    dueDateField: isES
      ? "Fecha de vencimiento"
      : "Due Date",

    selectedLoad: isES
      ? "Carga seleccionada"
      : "Selected Load",

    noReadyLoads: isES
      ? "No hay cargas listas para facturar."
      : "No loads are currently ready to invoice.",

    invoiceCreated: isES
      ? "Factura creada correctamente."
      : "Invoice created successfully.",

    expenseCreated: isES
      ? "Gasto guardado correctamente."
      : "Expense saved successfully.",

    invoiceApproved: isES
      ? "Factura aprobada."
      : "Invoice approved.",

    factoringSubmitted: isES
      ? "Factura enviada a factoring."
      : "Invoice submitted to factoring.",

    loadNotReady: isES
      ? "Esta carga todavía no está lista para facturar."
      : "This load is not ready to invoice yet.",

    requiredDocuments: isES
      ? "Documentos requeridos"
      : "Required Documents",

    loadPreview: isES
      ? "Vista previa de la carga"
      : "Load Preview",

    reviewChecks: isES
      ? "Controles de revisión"
      : "Review Checks",

    information: isES ? "Información" : "Information",

    workflowOne: isES
      ? "Carga entregada"
      : "Load delivered",

    workflowTwo: isES
      ? "Documentos aprobados"
      : "Documents approved",

    workflowThree: isES
      ? "Factura preparada"
      : "Invoice prepared",

    workflowFour: isES
      ? "Aprobación financiera"
      : "Finance approval",

    workflowFive: isES
      ? "Factoring opcional"
      : "Optional factoring",
  };

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [factoringSubmissions, setFactoringSubmissions] = useState<
    FactoringSubmission[]>([]);
  const [factoringPayments, setFactoringPayments] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<LoadReadiness[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "invoices" | "expenses" | "settlements"
  >("invoices");

  const [search, setSearch] = useState("");

  const [expenseModal, setExpenseModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);

  const [selectedLoad, setSelectedLoad] =
    useState<LoadReadiness | null>(null);

  const [reviewResult, setReviewResult] =
    useState<ReviewResult | null>(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");

  async function getCompanyId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    return data?.company_id || null;
  }

  async function reconcileCompletedFactoring(
  currentInvoices: Invoice[]
) {
  const companyId = await getCompanyId();

  if (!companyId) return currentInvoices;

  const { data: factoringData, error } = await supabase
    .from("factoring_submissions")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.error("Factoring reconcile error:", error);
    return currentInvoices;
  }

  const submissions = (factoringData || []) as FactoringSubmission[];

  const fundedInvoiceIds = submissions
    .filter((submission) => {
      const status = normalize(submission.status);

      return (
        submission.invoice_id &&
        submission.funded_at &&
        [
          "funded",
          "completed",
          "paid",
        ].includes(status)
      );
    })
    .map((submission) => submission.invoice_id);


  for (const invoiceId of fundedInvoiceIds) {
    await supabase
      .from("invoices")
      .update({
        status: "Funded",
      })
      .eq("id", invoiceId);
  
  const submission = submissions.find(
    (s) => s.invoice_id === invoiceId
  );


  if (submission) {

    const { data: existingPayment } = await supabase
      .from("factoring_payments")
      .select("id")
      .eq("factoring_submission_id", submission.id)
      .maybeSingle();


    if (!existingPayment) {

      await supabase
        .from("factoring_payments")
        .insert({
          company_id: companyId,
          factoring_submission_id: submission.id,
          payment_type: "Factoring Payment",
          amount: Number(
            submission.advance_amount || 
            submission.submitted_amount || 
            0
          ),
          payment_date: new Date()
            .toISOString()
            .split("T")[0],
        });

    }
  }
}

  return currentInvoices.map((invoice) => {
    const funded = fundedInvoiceIds.includes(invoice.id);

    return funded
      ? {
          ...invoice,
          status: "Funded",
        }
      : invoice;
  });
}
 

  async function loadDeliveredLoads(companyId: string) {
    const { data: loadsData } = await supabase
      .from("loads")
      .select(
        "id, company_id, load_number, broker_name, origin_city, origin_state, destination_city, destination_state, status, rate"
      )
      .eq("company_id", companyId)
      .ilike("status", "delivered")
      .order("load_number", { ascending: true });

    const deliveredLoads = (loadsData || []) as Load[];
console.log("[Finance] Company ID:", companyId);
console.log("[Finance] Delivered loads found:", deliveredLoads);

    if (!deliveredLoads.length) {
      setReadiness([]);
      return;
    }

    const loadIds = deliveredLoads.map((load) => load.id);

    const { data: documentsData } = await supabase
      .from("documents")
      .select(
        "id, load_id, document_type, file_name, storage_path, status, uploaded_at"
      )
      .in("load_id", loadIds);

    const documents = (documentsData || []) as Document[];

    const { data: invoicesData } = await supabase
  .from("invoices")
  .select("id, load_id, status")
  .in("load_id", loadIds);

    const existingInvoices = invoicesData || [];

    const result = deliveredLoads
  .filter((load) => {
    return !existingInvoices.some(
      (invoice) => invoice.load_id === load.id
    );
  })
  .map((load) => {
      const loadDocuments = documents.filter(
        (document) => document.load_id === load.id
      );
       const hasInvoice = existingInvoices.some(
         (invoice) => invoice.load_id === load.id
      );

      const hasBOL = loadDocuments.some(
        (document) =>
          documentTypeMatches(document, "bol") &&
          isApprovedDocument(document)
      );

      const hasPOD = loadDocuments.some(
        (document) =>
          documentTypeMatches(document, "pod") &&
          isApprovedDocument(document)
      );

      const hasRateConfirmation = loadDocuments.some(
        (document) =>
          documentTypeMatches(document, "rate") &&
          isApprovedDocument(document)
      );

      return {
        load,
        documents: loadDocuments,
        hasBOL,
        hasPOD,
        hasRateConfirmation,
        ready:
         hasBOL &&
         hasPOD &&
         hasRateConfirmation &&
         !hasInvoice,
      };
    });

    setReadiness(result);
  }

  async function loadData() {
    setLoading(true);

    try {
      const companyId = await getCompanyId();

      if (!companyId) {
        setInvoices([]);
        setExpenses([]);
        setSettlements([]);
        setFactoringSubmissions([]);
        setReadiness([]);
        return;
      }

      await loadDeliveredLoads(companyId);

      const [
        invoicesResult,
        expensesResult,
        settlementsResult,
        factoringResult,
        factoringPaymentsResult,
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),

        supabase
          .from("expenses")
          .select("*")
          .eq("company_id", companyId)
          .order("expense_date", { ascending: false }),

        supabase
          .from("settlements")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),

        supabase
          .from("factoring_submissions")
          .select("*")
          .eq("company_id", companyId)
          .order("submitted_at", { ascending: false }),

        supabase
          .from("factoring_payments")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
      ]);
      

      let loadedInvoices =
        (invoicesResult.data || []) as Invoice[];

      loadedInvoices =
        await reconcileCompletedFactoring(loadedInvoices);

      console.log(
  "INVOICES FINANCE:",
  JSON.stringify(loadedInvoices, null, 2)
);

      setInvoices(loadedInvoices);
      setExpenses((expensesResult.data || []) as Expense[]);
      setSettlements(
        (settlementsResult.data || []) as Settlement[]
      );
      setFactoringSubmissions(
        (factoringResult.data || []) as FactoringSubmission[]
      );
      setFactoringPayments(
      factoringPaymentsResult.data || []
);
      
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const revenue = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) => sum + Number(invoice.invoice_amount || 0),
        0
      ),
    [invoices]
  );
  const factoringReceived = useMemo(
  () =>
    factoringPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    ),
  [factoringPayments]
);

  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      ),
    [expenses]
  );

 const driverPay = useMemo(
  () =>
    settlements.reduce(
      (sum, settlement) =>
        sum + Number(settlement.gross_amount || 0),
      0
    ),
  [settlements]
);

const deductions = useMemo(
  () =>
    settlements.reduce(
      (sum, settlement) =>
        sum + Number(settlement.deductions || 0),
      0
    ),
  [settlements]
);

  const profit = revenue - totalExpenses - driverPay;

  const outstanding = useMemo(
    () =>
      invoices.reduce((sum, invoice) => {
        const status = normalize(invoice.status);

        if (
          status === "paid" ||
          status === "funded" ||
          status === "factoring submitted" ||
          status === "closed"
        ) {
          return sum;
        }

        return sum + Number(invoice.invoice_amount || 0);
      }, 0),
    [invoices]
  );

  const readyLoads = useMemo(
    () => readiness.filter((item) => item.ready),
    [readiness]
  );

  const blockedLoads = useMemo(
    () => readiness.filter((item) => !item.ready),
    [readiness]
  );

  
const filteredInvoices = useMemo(() => {
  const query = search.toLowerCase().trim();

  return invoices.filter((invoice) => {
    if (!query) {
      return true;
    }

    return [
      invoice.invoice_number,
      invoice.broker_name,
      invoice.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}, [invoices, search]);


  const filteredExpenses = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return expenses;

    return expenses.filter((expense) =>
      [
        expense.category,
        expense.description,
        expense.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [expenses, search]);

  const filteredSettlements = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return settlements;

    return settlements.filter((settlement) =>
      [
        settlement.driver_id,
        settlement.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [settlements, search]);

  async function saveExpense() {
    const companyId = await getCompanyId();

    if (!companyId) return;

    if (!expenseAmount || Number(expenseAmount) <= 0) {
      alert(
        isES
          ? "Ingrese un monto válido."
          : "Enter a valid amount."
      );
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .insert({
        company_id: companyId,
        category: expenseCategory || "Other",
        description: expenseDescription || null,
        amount: Number(expenseAmount),
        expense_date: expenseDate,
        status: "Recorded",
      });

    if (error) {
      alert(error.message);
      return;
    }

    setExpenseCategory("");
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseModal(false);

    await loadData();

    alert(text.expenseCreated);
  }

  function buildIntelligence(
    item: LoadReadiness,
    amount: number
  ): ReviewResult {
    const { load } = item;

    const checks = [
      {
        label: isES
          ? "Carga entregada"
          : "Load delivered",
        passed: normalize(load.status) === "delivered",
        detail: load.status || "—",
      },
      {
        label: isES
          ? "Número de carga"
          : "Load number",
        passed: Boolean(load.load_number),
        detail: load.load_number || "—",
      },
      {
        label: isES ? "Broker" : "Broker",
        passed: Boolean(load.broker_name),
        detail: load.broker_name || "—",
      },
      {
        label: isES ? "Origen" : "Origin",
        passed: Boolean(
          load.origin_city && load.origin_state
        ),
        detail:
          load.origin_city && load.origin_state
            ? `${load.origin_city}, ${load.origin_state}`
            : "—",
      },
      {
        label: isES ? "Destino" : "Destination",
        passed: Boolean(
          load.destination_city &&
            load.destination_state
        ),
        detail:
          load.destination_city &&
          load.destination_state
            ? `${load.destination_city}, ${load.destination_state}`
            : "—",
      },
      {
        label: "BOL",
        passed: item.hasBOL,
        detail: item.hasBOL
          ? text.approved
          : text.missing,
      },
      {
        label: "POD",
        passed: item.hasPOD,
        detail: item.hasPOD
          ? text.approved
          : text.missing,
      },
      {
        label: text.rateConfirmation,
        passed: item.hasRateConfirmation,
        detail: item.hasRateConfirmation
          ? text.approved
          : text.missing,
      },
      {
        label: isES
          ? "Monto de factura"
          : "Invoice amount",
        passed: amount > 0,
        detail: money(amount),
      },
      {
        label: text.dueDateField,
        passed: Boolean(invoiceDueDate),
        detail: invoiceDueDate || "—",
      },
    ];

    return {
      load,
      documentType: "Invoice Package",
      file: "BOL / POD / Rate Confirmation",
      loadStatus: load.status || "—",
      invoiceReady: item.ready,
      bolNumber: null,
      loadNumber: load.load_number,
      broker: load.broker_name,
      origin:
        load.origin_city && load.origin_state
          ? `${load.origin_city}, ${load.origin_state}`
          : null,
      destination:
        load.destination_city &&
        load.destination_state
          ? `${load.destination_city}, ${load.destination_state}`
          : null,
      documentDate: null,
      documentAmount: amount,
      loadAmount: Number(load.rate || 0),
      amountDifference:
        amount - Number(load.rate || 0),
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

  function openInvoiceReview(item: LoadReadiness) {
    setSelectedLoad(item);
    setInvoiceAmount(
      String(Number(item.load.rate || 0))
    );
    setInvoiceDueDate("");
    setReviewResult(null);
    setInvoiceModal(true);
  }

  function runInvoiceReview() {
    if (!selectedLoad) return;

    const amount = Number(invoiceAmount || 0);

    const result = buildIntelligence(
      selectedLoad,
      amount
    );

    setReviewResult(result);
  }

  async function prepareInvoice() {
    if (!selectedLoad) return;

    if (!selectedLoad.ready) {
      alert(text.loadNotReady);
      return;
    }

    const amount = Number(invoiceAmount || 0);

    if (amount <= 0) {
      alert(
        isES
          ? "Ingrese un monto válido."
          : "Enter a valid invoice amount."
      );
      return;
    }

    if (!invoiceDueDate) {
      alert(
        isES
          ? "Seleccione una fecha de vencimiento."
          : "Select a due date."
      );
      return;
    }

    if (!reviewResult) {
      alert(
        isES
          ? "Ejecute primero la revisión de IA."
          : "Run the AI review first."
      );
      return;
    }

    if (!reviewResult.invoiceReady) {
      alert(text.loadNotReady);
      return;
    }

    const companyId = await getCompanyId();

    if (!companyId) return;

    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("company_id", companyId)
      .eq("load_id", selectedLoad.load.id)
      .maybeSingle();

    if (existing) {
      alert(
        isES
          ? "Esta carga ya tiene una factura."
          : "This load already has an invoice."
      );
      return;
    }

    const datePart = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const invoiceNumber = `INV-${datePart}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const { error } = await supabase
  .from("invoices")
  .insert({
    company_id: companyId,
    invoice_number: invoiceNumber,
    load_id: selectedLoad.load.id,

    broker_name:
      selectedLoad.load.broker_name || "Unknown",

    invoice_amount: amount,

    invoice_date: new Date()
      .toISOString()
      .split("T")[0],

    status: "Pending Approval",

    due_date: invoiceDueDate,
  });

    if (error) {
      alert(error.message);
      return;
    }

    setInvoiceModal(false);
    setSelectedLoad(null);
    setReviewResult(null);

    await loadData();

    alert(text.invoiceCreated);
  }

  async function approveInvoice(invoice: Invoice) {
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "Approved",
      })
      .eq("id", invoice.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();

    alert(text.invoiceApproved);
  }

  async function sendToFactoring(invoice: Invoice) {
   const companyId = await getCompanyId();

    if (!companyId) return;

  const { data: existingSubmission } = await supabase
    .from("factoring_submissions")
    .select("id")
    .eq("invoice_id", invoice.id)
    .maybeSingle();

  if (existingSubmission) {
    alert("Invoice already sent to factoring");
    return;
  }

      const { error } = await supabase
      .from("factoring_submissions")
      .insert({advance_amount: Number(invoice.invoice_amount || 0),
        company_id: companyId,
        invoice_id: invoice.id,
        factoring_company: "Manual Submission",
        submitted_amount: Number(invoice.invoice_amount || 0),
        status: "Submitted",
        submitted_at: new Date().toISOString(),
      });

    if (error) {
      alert(error.message);
      return;
    }


    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        status: "Factoring Submitted",
      })
      .eq("id", invoice.id);

    if (invoiceError) {
      alert(invoiceError.message);
      return;
    }

    await loadData();

    alert(text.factoringSubmitted);
  }

  const invoiceColumns = [
    {
      key: "invoice_number" as keyof Invoice,
      label: text.invoiceNumber,
    },
    {
  key: "broker_name" as keyof Invoice,
  label: text.customer,
  },
    {
  key: "invoice_amount" as keyof Invoice,
  label: text.amount,
  render: (value: Invoice[keyof Invoice]) =>
    money(Number(value || 0)),
  },
    
    {
      key: "status" as keyof Invoice,
      label: text.status,
      render: (value: Invoice[keyof Invoice]) => (
        <StatusBadge status={String(value || "—")} />
      ),
    },
    {
      key: "due_date" as keyof Invoice,
      label: text.dueDate,
      render: (value: Invoice[keyof Invoice]) =>
        formatDate(String(value || "")),
    },
  ];

  const expenseColumns = [
    {
      key: "category" as keyof Expense,
      label: text.category,
    },
    {
      key: "description" as keyof Expense,
      label: text.description,
    },
    {
      key: "amount" as keyof Expense,
      label: text.amount,
      render: (value: Expense[keyof Expense]) =>
        money(Number(value || 0)),
    },
    {
      key: "expense_date" as keyof Expense,
      label: text.date,
      render: (value: Expense[keyof Expense]) =>
        formatDate(String(value || "")),
    },
    {
      key: "status" as keyof Expense,
      label: text.status,
      render: (value: Expense[keyof Expense]) => (
        <StatusBadge status={String(value || "—")} />
      ),
    },
  ];

  const settlementColumns = [
    {
      key: "driver_id" as keyof Settlement,
      label: text.driver,
    },
    {
      key: "load_id" as keyof Settlement,
      label: text.load,
    },
    
   {
      key: "gross_amount" as keyof Settlement,
      label: text.gross,
      render: (value: Settlement[keyof Settlement]) =>
      money(Number(value || 0)),
    },
    {
      key: "net_amount" as keyof Settlement,
      label: text.net,
      render: (value: Settlement[keyof Settlement]) =>
      money(Number(value || 0)),
    },
    {
      key: "deductions" as keyof Settlement,
      label: text.deductionsCol,
      render: (value: Settlement[keyof Settlement]) =>
        money(Number(value || 0)),
    },
   
    {
      key: "status" as keyof Settlement,
      label: text.status,
      render: (value: Settlement[keyof Settlement]) => (
        <StatusBadge status={String(value || "—")} />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.title}
        description={text.description}
        action={text.refresh}
        onAction={loadData}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <StatCard
          label={text.revenue}
          value={money(revenue)}
        />

        <StatCard
          label="Factoring Received"
          value={money(factoringReceived)}
        />

        <StatCard
          label={text.expenses}
          value={money(totalExpenses)}
        />

        <StatCard
          label={text.driverPay}
          value={money(driverPay)}
        />

        <StatCard
          label={text.profit}
          value={money(profit)}
        />

        <StatCard
          label={text.outstanding}
          value={money(outstanding)}
        />

        <StatCard
          label={text.deductions}
          value={money(deductions)}
        />
      </div>

      <SectionCard
        title={text.invoiceWorkflow}
        description={
          isES
            ? "El proceso financiero avanza desde la entrega hasta la facturación y factoring."
            : "The financial process moves from delivery through invoicing and optional factoring."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {[
            text.workflowOne,
            text.workflowTwo,
            text.workflowThree,
            text.workflowFour,
            text.workflowFive,
          ].map((step, index) => (
            <div
              key={step}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "15px",
                background:
                  index < 2 ? "#f8fafc" : "#ffffff",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#2563eb",
                  marginBottom: "7px",
                }}
              >
                0{index + 1}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={text.documentReadiness}
        description={
          isES
            ? "Las cargas entregadas necesitan BOL, POD y Rate Confirmation aprobados antes de preparar la factura."
            : "Delivered loads need an approved BOL, POD, and Rate Confirmation before invoice preparation."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <StatCard
            label={text.ready}
            value={readyLoads.length}
          />

          <StatCard
            label={text.blocked}
            value={blockedLoads.length}
          />
        </div>

        {loading ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            {isES
              ? "Cargando datos financieros..."
              : "Loading financial data..."}
          </div>
        ) : readiness.length === 0 ? (
          <div
            style={{
              padding: "25px",
              textAlign: "center",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
              color: "#64748b",
              background: "#f8fafc",
            }}
          >
            {text.noReadyLoads}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {readiness.map((item) => (
              <div
                key={item.load.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "14px",
                    }}
                  >
                    {item.load.load_number || item.load.id}
                  </div>

                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    {item.load.broker_name || "—"} ·{" "}
                    {item.load.origin_city},{" "}
                    {item.load.origin_state} →{" "}
                    {item.load.destination_city},{" "}
                    {item.load.destination_state}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <StatusBadge
                    status={
                      item.hasBOL
                        ? text.approved
                        : text.missing
                    }
                  />

                  <StatusBadge
                    status={
                      item.hasPOD
                        ? text.approved
                        : text.missing
                    }
                  />

                  <StatusBadge
                    status={
                      item.hasRateConfirmation
                        ? text.approved
                        : text.missing
                    }
                  />
                </div>

                <ActionButton
                  variant={
                    item.ready ? "primary" : "secondary"
                  }
                  disabled={!item.ready}
                  onClick={() =>
                    openInvoiceReview(item)
                  }
                >
                  {text.prepareInvoice}
                </ActionButton>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={text.commandCenter}
        description={
          isES
            ? "Consulta y administra la actividad financiera."
            : "Review and manage financial activity."
        }
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <ActionButton
              variant={
                activeTab === "invoices"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setActiveTab("invoices")}
            >
              {text.invoices}
            </ActionButton>

            <ActionButton
              variant={
                activeTab === "expenses"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setActiveTab("expenses")}
            >
              {text.expensesTab}
            </ActionButton>

            <ActionButton
              variant={
                activeTab === "settlements"
                  ? "primary"
                  : "secondary"
              }
              onClick={() =>
                setActiveTab("settlements")
              }
            >
              {text.settlements}
            </ActionButton>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={text.search}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "9px",
                padding: "10px 12px",
                fontSize: "13px",
                outline: "none",
                minWidth: "220px",
              }}
            />

            <ActionButton
              onClick={() => setExpenseModal(true)}
            >
              {text.addExpense}
            </ActionButton>
          </div>
        </div>

        {activeTab === "invoices" && (
           <DataTable<any>
              columns={invoiceColumns}
              data={filteredInvoices}
              emptyMessage={text.noInvoices}
        />
          )}

       {activeTab === "expenses" && (
           <DataTable<any>
             columns={expenseColumns}
             data={filteredExpenses}
             emptyMessage={text.noExpenses}
        />
          )}

             {activeTab === "settlements" && (
  <DataTable<any>
    columns={settlementColumns}
    data={filteredSettlements}
    emptyMessage={text.noSettlements}
  />
)}

          

        {activeTab === "invoices" &&
          filteredInvoices.length > 0 && (
            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {filteredInvoices.map((invoice) => {
                const status = normalize(
                  invoice.status
                );

                console.log("INVOICE STATUS BUTTON:", invoice.invoice_number, status);

                return (
                  <div
                    key={invoice.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {invoice.invoice_number}
                    </span>

                    {status === "pending approval" && (
                      <ActionButton
                        variant="secondary"
                        onClick={() =>
                          approveInvoice(invoice)
                        }
                      >
                        {text.approve}
                      </ActionButton>
                    )}

                    {status === "approved" && (
                      <ActionButton
                        variant="secondary"
                        onClick={() =>
                          sendToFactoring(invoice)
                        }
                      >
                        {text.sendFactoring}
                      </ActionButton>
                    )}

                    <ActionButton
                      variant="secondary"
                      onClick={() =>
                        setSelectedInvoice(invoice)
                      }
                    >
                      {text.reviewInvoice}
                    </ActionButton>
                  </div>
                );
              })}
            </div>
          )}
      </SectionCard>

      <SectionCard
        title={text.information}
        description={
          isES
            ? "El sistema mantiene separadas las funciones operativas, financieras y de factoring."
            : "The system keeps operations, finance, and factoring workflows separated."
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <InfoCard
            title={isES ? "Facturación" : "Invoicing"}
            text={
              isES
                ? "Una carga debe estar entregada y tener la documentación requerida aprobada."
                : "A load must be delivered and have the required approved documentation."
            }
          />

          <InfoCard
            title="Factoring"
            text={
              isES
                ? "Una factura aprobada puede enviarse posteriormente al flujo de factoring."
                : "An approved invoice can be sent into the factoring workflow."
            }
          />

          <InfoCard
            title={isES ? "Control humano" : "Human control"}
            text={
              isES
                ? "La IA revisa y recomienda; el usuario conserva la decisión final."
                : "AI reviews and recommends; the user retains the final decision."
            }
          />
        </div>
      </SectionCard>

      {invoiceModal && selectedLoad && (
        <Modal
          title={text.invoiceReview}
          onClose={() => {
            setInvoiceModal(false);
            setSelectedLoad(null);
            setReviewResult(null);
          }}
        >
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              padding: "13px",
              marginBottom: "18px",
              fontSize: "13px",
              lineHeight: 1.5,
              color: "#1e3a8a",
            }}
          >
            <strong>{text.aiReview}</strong>
            <br />
            {text.aiBanner}
          </div>

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <h3 style={modalHeadingStyle}>
              {text.selectedLoad}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              <InfoField
                label={text.load}
                value={
                  selectedLoad.load.load_number ||
                  selectedLoad.load.id
                }
              />

              <InfoField
                label={text.broker}
                value={
                  selectedLoad.load.broker_name || "—"
                }
              />

              <InfoField
                label={text.route}
                value={`${selectedLoad.load.origin_city || "—"}, ${
                  selectedLoad.load.origin_state || ""
                } → ${
                  selectedLoad.load.destination_city || "—"
                }, ${
                  selectedLoad.load.destination_state || ""
                }`}
              />

              <InfoField
                label={text.amount}
                value={money(selectedLoad.load.rate)}
              />
            </div>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <h3 style={modalHeadingStyle}>
              {text.requiredDocuments}
            </h3>

            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              <DocumentCheck
                label="BOL"
                passed={selectedLoad.hasBOL}
                approvedText={text.approved}
                missingText={text.missing}
              />

              <DocumentCheck
                label="POD"
                passed={selectedLoad.hasPOD}
                approvedText={text.approved}
                missingText={text.missing}
              />

              <DocumentCheck
                label={text.rateConfirmation}
                passed={
                  selectedLoad.hasRateConfirmation
                }
                approvedText={text.approved}
                missingText={text.missing}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <Field
              label={text.invoiceAmount}
              value={invoiceAmount}
              onChange={setInvoiceAmount}
              type="number"
            />

            <Field
              label={text.dueDateField}
              value={invoiceDueDate}
              onChange={setInvoiceDueDate}
              type="date"
            />
          </div>

          {reviewResult && (
            <div style={{ marginBottom: "18px" }}>
              <h3 style={modalHeadingStyle}>
                {text.reviewChecks}
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: "7px",
                }}
              >
                {reviewResult.checks.map((check) => (
                  <div
                    key={check.label}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 11px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {check.label}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          marginTop: "2px",
                        }}
                      >
                        {check.detail}
                      </div>
                    </div>

                    <StatusBadge
                      status={
                        check.passed
                          ? text.approved
                          : text.missing
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <ActionButton
              variant="secondary"
              onClick={() =>
                setInvoiceModal(false)
              }
            >
              {text.cancel}
            </ActionButton>

            <ActionButton
              variant="primary"
              onClick={runInvoiceReview}
          >
              {text.reviewInvoice}
            </ActionButton>

            <ActionButton
              disabled={
                !reviewResult ||
                !reviewResult.invoiceReady
              }
              onClick={prepareInvoice}
            >
              {text.prepareInvoice}
            </ActionButton>
          </div>
        </Modal>
      )}

      {expenseModal && (
        <Modal
          title={text.addExpense}
          onClose={() => setExpenseModal(false)}
        >
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            <Field
              label={text.expenseCategory}
              value={expenseCategory}
              onChange={setExpenseCategory}
            />

            <Field
              label={text.expenseDescription}
              value={expenseDescription}
              onChange={setExpenseDescription}
            />

            <Field
              label={text.expenseAmount}
              value={expenseAmount}
              onChange={setExpenseAmount}
              type="number"
            />

            <Field
              label={text.expenseDate}
              value={expenseDate}
              onChange={setExpenseDate}
              type="date"
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "5px",
              }}
            >
              <ActionButton
                variant="secondary"
                onClick={() =>
                  setExpenseModal(false)
                }
              >
                {text.cancel}
              </ActionButton>

              <ActionButton onClick={saveExpense}>
                {text.save}
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}

      {selectedInvoice && (
        <Modal
          title={text.reviewInvoice}
          onClose={() => setSelectedInvoice(null)}
        >
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            <InfoField
              label={text.invoiceNumber}
              value={selectedInvoice.invoice_number}
            />

            <InfoField
              label={text.customer}
              value={
                selectedInvoice.broker_name || "—"
              }
            />

            <InfoField
              label={text.amount}
              value={money(selectedInvoice.invoice_amount)}
            />

            <InfoField
              label={text.status}
              value={selectedInvoice.status || "—"}
            />

            <InfoField
              label={text.dueDate}
              value={formatDate(
                selectedInvoice.due_date
              )}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {normalize(selectedInvoice.status) ===
                "pending approval" && (
                <ActionButton
                  onClick={async () => {
                    await approveInvoice(
                      selectedInvoice
                    );
                    setSelectedInvoice(null);
                  }}
                >
                  {text.approve}
                </ActionButton>
              )}

              {normalize(selectedInvoice.status) ===
                "approved" && (
                <ActionButton
                  variant="primary"
                  onClick={async () => {
                    await sendToFactoring(
                      selectedInvoice
                    );
                    setSelectedInvoice(null);
                  }}
                >
                  {text.sendFactoring}
                </ActionButton>
              )}

              <ActionButton
                variant="secondary"
                onClick={() =>
                  setSelectedInvoice(null)
                }
              >
                {text.close}
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
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
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "15px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          marginBottom: "6px",
          color: "#0f172a",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "9px",
        padding: "10px 11px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#64748b",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DocumentCheck({
  label,
  passed,
  approvedText,
  missingText,
}: {
  label: string;
  passed: boolean;
  approvedText: string;
  missingText: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "10px 12px",
        border: "1px solid #e2e8f0",
        borderRadius: "9px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      <StatusBadge
        status={passed ? approvedText : missingText}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: "6px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 800,
          color: "#475569",
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #cbd5e1",
          borderRadius: "9px",
          padding: "10px 12px",
          fontSize: "13px",
          outline: "none",
        }}
      />
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "7px 10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const modalHeadingStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "13px",
  fontWeight: 800,
  color: "#0f172a",
};