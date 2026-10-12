"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type FactoringSubmission = {
  id: string;
  company_id: string;
  invoice_id: string;
  factoring_company: string | null;
  submitted_amount: number | null;
  advance_amount: number | null;
  reserve_amount: number | null;
  factoring_fee: number | null;
  status: string | null;
  submitted_at: string | null;
  funded_at: string | null;
};

type FactoringPayment = {
  id: string;
  company_id: string;
  factoring_submission_id: string;
  payment_type: string | null;
  amount: number | null;
  payment_date: string | null;
  reference_number: string | null;
  created_at: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  invoice_amount: number | null;
  status: string | null;
};

export default function FactoringPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    eyebrow: isES ? "FINANZAS / FACTORING" : "FINANCE / FACTORING",
    title: isES ? "Factoring" : "Factoring",
    subtitle: isES
      ? "Administra envíos, financiamiento, pagos y conciliación."
      : "Manage submissions, funding, payments and reconciliation.",

    refresh: isES ? "Actualizar" : "Refresh",

    submitted: isES ? "Enviado" : "Submitted",
    submittedSub: isES
      ? "Facturas enviadas"
      : "Invoices submitted",

    advanced: isES ? "Anticipado" : "Advanced",
    advancedSub: isES
      ? "Montos anticipados"
      : "Advance amounts",

    reserve: isES ? "Reserva" : "Reserve",
    reserveSub: isES
      ? "Montos de reserva"
      : "Reserve amounts",

    fees: isES ? "Comisiones" : "Fees",
    feesSub: isES
      ? "Comisiones de factoring"
      : "Factoring fees",

    funded: isES ? "Financiadas" : "Funded",
    fundedSub: isES
      ? "Envíos financiados"
      : "Funded submissions",

    pending: isES ? "Pendientes" : "Pending",
    pendingSub: isES
      ? "Esperando financiamiento"
      : "Awaiting funding",

    payments: isES ? "Pagos" : "Payments",
    paymentsSub: isES
      ? "Pagos registrados"
      : "Recorded payments",

    submissionsTab: isES ? "Envíos" : "Submissions",
    paymentsTab: isES ? "Pagos" : "Payments",
    historyTab: isES ? "Historial" : "History",

    searchSubmissions: isES
      ? "Buscar factura, empresa de factoring, estado..."
      : "Search invoice, factoring company, status...",

    searchPayments: isES
      ? "Buscar factura, pago, referencia..."
      : "Search invoice, payment, reference...",

    submissionsTitle: isES
      ? "Envíos de Factoring"
      : "Factoring Submissions",

    paymentsTitle: isES
      ? "Pagos de Factoring"
      : "Factoring Payments",

    historyTitle: isES
      ? "Historial de Factoring"
      : "Factoring History",

    submissionsDescription: isES
      ? "Realiza seguimiento de las facturas desde la aprobación hasta el financiamiento."
      : "Track invoice submissions from approval through funding.",

    paymentsDescription: isES
      ? "Realiza seguimiento de los pagos registrados y la conciliación."
      : "Track recorded factoring payments and reconciliation.",

    historyDescription: isES
      ? "Consulta las facturas cerradas y su historial de factoring."
      : "View closed invoices and their factoring history.",

    loading: isES
      ? "Cargando datos de factoring..."
      : "Loading factoring data...",

    noSubmissions: isES
      ? "No se encontraron envíos de factoring."
      : "No factoring submissions found.",

    noPayments: isES
      ? "Aún no se han registrado pagos de factoring."
      : "No factoring payments recorded yet.",

    invoice: isES ? "Factura" : "Invoice",
    factoringCompany: isES
      ? "Empresa de Factoring"
      : "Factoring Company",

    amountSubmitted: isES
      ? "Enviado"
      : "Submitted",

    advanceAmount: isES
      ? "Anticipo"
      : "Advance",

    reserveAmount: isES
      ? "Reserva"
      : "Reserve",

    factoringFee: isES
      ? "Comisión"
      : "Fee",

    invoiceStatus: isES
      ? "Estado de Factura"
      : "Invoice Status",

    factoringStatus: isES
      ? "Estado de Factoring"
      : "Factoring Status",

    submittedAt: isES
      ? "Enviado el"
      : "Submitted At",

    fundedAt: isES
      ? "Financiado el"
      : "Funded At",

    nextAction: isES
      ? "Siguiente Acción"
      : "Next Action",

    view: isES ? "Ver" : "View",

    paymentType: isES
      ? "Tipo de Pago"
      : "Payment Type",

    amount: isES ? "Monto" : "Amount",

    paymentDate: isES
      ? "Fecha de Pago"
      : "Payment Date",

    reference: isES
      ? "Referencia"
      : "Reference",

    created: isES
      ? "Creado"
      : "Created",

    closed: isES ? "Cerrada" : "Closed",

    noAction: isES
      ? "Sin acción"
      : "No action",

    startReview: isES
      ? "Iniciar Revisión"
      : "Start Review",

    approveFunding: isES
      ? "Aprobar Financiamiento"
      : "Approve Funding",

    fundSubmission: isES
      ? "Financiar Envío"
      : "Fund Submission",

    closeInvoice: isES
      ? "Cerrar Factura"
      : "Close Invoice",

    recordPayment: isES
      ? "Registrar Pago"
      : "Record Payment",

    factoringSubmission: isES
      ? "Envío de Factoring"
      : "Factoring Submission",

    factoringPayment: isES
      ? "Pago de Factoring"
      : "Factoring Payment",

    fundingControl: isES
      ? "Control de Financiamiento"
      : "Funding Control",

    recordPaymentTitle: isES
      ? "Registrar Pago"
      : "Record Payment",

    status: isES ? "Estado" : "Status",

    submissionId: isES
      ? "ID del Envío"
      : "Submission ID",

    invoiceAmount: isES
      ? "Monto de Factura"
      : "Invoice Amount",

    recordedPayments: isES
      ? "Pagos Registrados"
      : "Recorded Payments",

    reconciliationBalance: isES
      ? "Saldo de Conciliación"
      : "Reconciliation Balance",

    reconciliationState: isES
      ? "Estado de Conciliación"
      : "Reconciliation State",

    reconciled: isES
      ? "Conciliado"
      : "Reconciled",

    open: isES ? "Abierto" : "Open",

    cancel: isES ? "Cancelar" : "Cancel",

    saving: isES ? "Guardando..." : "Saving...",

    netFunding: isES
      ? "Financiamiento Neto"
      : "Net Funding",

    submittedAmount: isES
      ? "Monto Enviado"
      : "Submitted Amount",

    testDefaults: isES
      ? "Los valores de prueba usan 90% de anticipo y 3% de comisión de factoring. Los términos reales deben provenir del acuerdo autorizado de factoring."
      : "Test defaults use 90% advance and 3% factoring fee. Actual terms should come from the authorized factoring agreement.",

    recordPaymentInfo: isES
      ? "Registra el pago real recibido de la relación de factoring. Los pagos no pueden exceder el saldo restante de conciliación."
      : "Record the actual payment received from the factoring relationship. Payments cannot exceed the remaining reconciliation balance.",

    closedInvoice: isES
      ? "Factura Cerrada"
      : "Invoice Closed",

    viewSubmission: isES
      ? "Ver Envío"
      : "View Submission",

    viewPayment: isES
      ? "Ver Pago"
      : "View Payment",

    paymentId: isES
      ? "ID del Pago"
      : "Payment ID",

    referenceNumber: isES
      ? "Número de Referencia"
      : "Reference Number",

    createdAt: isES
      ? "Creado el"
      : "Created At",

    optional: isES
      ? "Opcional"
      : "Optional",

    reserveRelease: isES
      ? "Liberación de Reserva"
      : "Reserve Release",

    other: isES ? "Otro" : "Other",

    factoringPaymentOption: isES
      ? "Pago de Factoring"
      : "Factoring Payment",
  };

  const [submissions, setSubmissions] = useState<
    FactoringSubmission[]
  >([]);

  const [payments, setPayments] = useState<
    FactoringPayment[]
  >([]);

  const [invoices, setInvoices] = useState<Invoice[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState<
    "submissions" | "payments" | "history"
  >("submissions");

  const [selectedSubmission, setSelectedSubmission] =
    useState<FactoringSubmission | null>(null);

  const [selectedPayment, setSelectedPayment] =
    useState<FactoringPayment | null>(null);

  const [fundingSubmission, setFundingSubmission] =
    useState<FactoringSubmission | null>(null);

  const [paymentSubmission, setPaymentSubmission] =
    useState<FactoringSubmission | null>(null);

  const [paymentType, setPaymentType] = useState(
    "Factoring Payment"
  );

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [referenceNumber, setReferenceNumber] =
    useState("");

  const [advanceAmount, setAdvanceAmount] =
    useState("");

  const [reserveAmount, setReserveAmount] =
    useState("");

  const [factoringFee, setFactoringFee] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const invoiceMap = useMemo(() => {
    const map = new Map<string, Invoice>();

    invoices.forEach((invoice) => {
      map.set(invoice.id, invoice);
    });

    return map;
  }, [invoices]);

  const paymentTotalsBySubmission = useMemo(() => {
    const map = new Map<string, number>();

    payments.forEach((payment) => {
      const current =
        map.get(
          payment.factoring_submission_id
        ) || 0;

      map.set(
        payment.factoring_submission_id,
        current + Number(payment.amount || 0)
      );
    });

    return map;
  }, [payments]);

  const filteredSubmissions = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return submissions;

    return submissions.filter(
      (submission) => {
        const invoice = invoiceMap.get(
          submission.invoice_id
        );

        return [
          invoice?.invoice_number,
          invoice?.status,
          submission.factoring_company,
          submission.status,
          submission.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      }
    );
  }, [
    search,
    submissions,
    invoiceMap,
  ]);

  const filteredPayments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return payments;

    return payments.filter((payment) => {
      const submission = submissions.find(
        (item) =>
          item.id ===
          payment.factoring_submission_id
      );

      const invoice = submission
        ? invoiceMap.get(
            submission.invoice_id
          )
        : undefined;

      return [
        payment.payment_type,
        payment.reference_number,
        invoice?.invoice_number,
        payment.amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    search,
    payments,
    submissions,
    invoiceMap,
  ]);

  const stats = useMemo(() => {
    const submitted =
      submissions.reduce(
        (sum, item) =>
          sum +
          Number(
            item.submitted_amount || 0
          ),
        0
      );

    const advanced =
      submissions.reduce(
        (sum, item) =>
          sum +
          Number(
            item.advance_amount || 0
          ),
        0
      );

    const reserve =
      submissions.reduce(
        (sum, item) =>
          sum +
          Number(
            item.reserve_amount || 0
          ),
        0
      );

    const fees =
      submissions.reduce(
        (sum, item) =>
          sum +
          Number(
            item.factoring_fee || 0
          ),
        0
      );

    const funded =
      submissions.filter(
        (item) =>
          item.status === "Funded"
      ).length;

    const pending =
      submissions.filter(
        (item) =>
          item.status === "Submitted" ||
          item.status === "Under Review" ||
          item.status === "Approved"
      ).length;

    const recordedPayments =
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount || 0),
        0
      );

    return {
      submitted,
      advanced,
      reserve,
      fees,
      funded,
      pending,
      recordedPayments,
    };
  }, [submissions, payments]);

  async function loadData() {
    setLoading(true);

    const [
      {
        data: submissionData,
        error: submissionError,
      },
      {
        data: paymentData,
        error: paymentError,
      },
      {
        data: invoiceData,
        error: invoiceError,
      },
    ] = await Promise.all([
      supabase
        .from("factoring_submissions")
        .select("*")
        .order("submitted_at", {
          ascending: false,
        }),

      supabase
        .from("factoring_payments")
        .select("*")
        .order("payment_date", {
          ascending: false,
        }),

      supabase
        .from("invoices")
        .select(
          "id, invoice_number, invoice_amount, status"
        )
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (submissionError) {
      console.error(submissionError);
    }

    if (paymentError) {
      console.error(paymentError);
    }

    if (invoiceError) {
      console.error(invoiceError);
    }

    setSubmissions(submissionData || []);
    setPayments(paymentData || []);
    setInvoices(invoiceData || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function getNextAction(
    submission: FactoringSubmission
  ) {
    const invoice = invoiceMap.get(
      submission.invoice_id
    );

    if (invoice?.status === "Closed") {
      return (
        <span style={styles.closedAction}>
          {text.closed}
        </span>
      );
    }

    if (
      submission.status === "Submitted"
    ) {
      return (
        <button
          onClick={() =>
            startReview(submission)
          }
          style={styles.actionButton}
        >
          {text.startReview}
        </button>
      );
    }

    if (
      submission.status === "Under Review"
    ) {
      return (
        <button
          onClick={() =>
            openFundingControl(
              submission
            )
          }
          style={styles.actionButton}
        >
          {text.approveFunding}
        </button>
      );
    }

    if (
      submission.status === "Approved"
    ) {
      return (
        <button
          onClick={() =>
            fundSubmission(submission)
          }
          style={styles.actionButton}
        >
          {text.fundSubmission}
        </button>
      );
    }

    if (
      submission.status === "Funded"
    ) {
      const reconciliation =
        getReconciliation(
          submission
        );

      if (
        reconciliation.reconciled
      ) {
        return (
          <button
            onClick={() =>
              closeInvoice(
                submission
              )
            }
            style={
              styles.closeInvoiceButton
            }
          >
            {text.closeInvoice}
          </button>
        );
      }

      return (
        <button
          onClick={() =>
            openPaymentModal(
              submission
            )
          }
          style={styles.actionButton}
        >
          {text.recordPayment}
        </button>
      );
    }

    return (
      <span
        style={{
          color: "#64748b",
          fontSize: 13,
        }}
      >
        {text.noAction}
      </span>
    );
  }

  async function startReview(
    submission: FactoringSubmission
  ) {
    setActionLoading(true);

    const { error } = await supabase
      .from("factoring_submissions")
      .update({
        status: "Under Review",
      })
      .eq("id", submission.id);

    if (error) {
      console.error(error);
      alert(error.message);
      setActionLoading(false);
      return;
    }

    await loadData();
    setActionLoading(false);
  }

  function openFundingControl(
    submission: FactoringSubmission
  ) {
    setFundingSubmission(submission);

    const submitted = Number(
      submission.submitted_amount || 0
    );

    const defaultAdvance =
      submission.advance_amount !== null
        ? Number(
            submission.advance_amount
          )
        : submitted * 0.9;

    const defaultFee =
      submission.factoring_fee !== null
        ? Number(
            submission.factoring_fee
          )
        : submitted * 0.03;

    const defaultReserve =
      submission.reserve_amount !== null
        ? Number(
            submission.reserve_amount
          )
        : Math.max(
            0,
            submitted - defaultAdvance
          );

    setAdvanceAmount(
      defaultAdvance.toFixed(2)
    );

    setReserveAmount(
      defaultReserve.toFixed(2)
    );

    setFactoringFee(
      defaultFee.toFixed(2)
    );
  }

  async function approveFunding() {
    if (!fundingSubmission) return;

    const advance =
      Number(advanceAmount);

    const reserve =
      Number(reserveAmount);

    const fee =
      Number(factoringFee);

    if (
      !Number.isFinite(advance) ||
      !Number.isFinite(reserve) ||
      !Number.isFinite(fee)
    ) {
      alert(
        isES
          ? "Ingresa montos de financiamiento válidos."
          : "Enter valid funding amounts."
      );
      return;
    }

    setActionLoading(true);

    const { error } = await supabase
      .from("factoring_submissions")
      .update({
        advance_amount: advance,
        reserve_amount: reserve,
        factoring_fee: fee,
        status: "Approved",
      })
      .eq(
        "id",
        fundingSubmission.id
      );

    if (error) {
      console.error(error);
      alert(error.message);
      setActionLoading(false);
      return;
    }

    setFundingSubmission(null);

    await loadData();
    setActionLoading(false);
  }

  async function fundSubmission(
    submission: FactoringSubmission
  ) {
    setActionLoading(true);

    const { error } = await supabase
      .from("factoring_submissions")
      .update({
        status: "Funded",
        funded_at:
          new Date().toISOString(),
      })
      .eq("id", submission.id);

    if (error) {
      console.error(error);
      alert(error.message);
      setActionLoading(false);
      return;
    }

    await loadData();
    setActionLoading(false);
  }

  function openPaymentModal(
    submission: FactoringSubmission
  ) {
    setPaymentSubmission(
      submission
    );

    setPaymentType(
      "Factoring Payment"
    );

    setPaymentAmount("");

    setPaymentDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setReferenceNumber("");
  }

  async function recordPayment() {
    if (!paymentSubmission)
      return;

    const amount =
      Number(paymentAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        isES
          ? "Ingresa un monto de pago válido."
          : "Enter a valid payment amount."
      );
      return;
    }

    if (!paymentDate) {
      alert(
        isES
          ? "Selecciona una fecha de pago."
          : "Select a payment date."
      );
      return;
    }

    const reconciliation =
      getReconciliation(
        paymentSubmission
      );

    if (
      amount >
      reconciliation.balance
    ) {
      alert(
        isES
          ? `El pago no puede exceder el saldo restante de conciliación de ${formatMoney(
              reconciliation.balance
            )}.`
          : `Payment cannot exceed the remaining reconciliation balance of ${formatMoney(
              reconciliation.balance
            )}.`
      );
      return;
    }

    setActionLoading(true);

    const { error } = await supabase
      .from("factoring_payments")
      .insert({
        company_id:
          paymentSubmission.company_id,
        factoring_submission_id:
          paymentSubmission.id,
        payment_type:
          paymentType,
        amount,
        payment_date:
          paymentDate,
        reference_number:
          referenceNumber.trim() ||
          null,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      setActionLoading(false);
      return;
    }

    setPaymentSubmission(null);

    await loadData();
    setActionLoading(false);
  }

  async function closeInvoice(
    submission: FactoringSubmission
  ) {
    const invoice = invoiceMap.get(
      submission.invoice_id
    );

    if (!invoice) {
      alert(
        isES
          ? "No se encontró la factura."
          : "Invoice could not be found."
      );
      return;
    }

    const reconciliation =
      getReconciliation(
        submission
      );

    if (
      !reconciliation.reconciled
    ) {
      alert(
        isES
          ? `La factura no puede cerrarse mientras el saldo de conciliación sea ${formatMoney(
              reconciliation.balance
            )}.`
          : `The invoice cannot be closed while the reconciliation balance is ${formatMoney(
              reconciliation.balance
            )}.`
      );
      return;
    }

    const confirmed =
      window.confirm(
        isES
          ? `¿Cerrar la factura ${
              invoice.invoice_number ||
              "esta factura"
            }?\n\nLa factura se marcará como Cerrada.`
          : `Close invoice ${
              invoice.invoice_number ||
              "this invoice"
            }?\n\nThe invoice will be marked Closed.`
      );

    if (!confirmed) return;

    setActionLoading(true);

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "Closed",
      })
      .eq("id", invoice.id);

    if (error) {
      console.error(error);
      alert(error.message);
      setActionLoading(false);
      return;
    }

    setSelectedSubmission(null);

    await loadData();
    setActionLoading(false);
  }

  function formatMoney(
    value:
      | number
      | null
      | undefined
  ) {
    return `$${Number(
      value || 0
    ).toLocaleString(
      isES ? "es-US" : "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) return "—";

    return new Date(
      value
    ).toLocaleDateString(
      isES ? "es-US" : "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function getStatusStyle(
    status: string | null
  ) {
    if (status === "Funded") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "Closed") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "Approved") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    if (
      status === "Under Review"
    ) {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (status === "Submitted") {
      return {
        background: "#e0e7ff",
        color: "#3730a3",
      };
    }

    return {
      background: "#f1f5f9",
      color: "#475569",
    };
  }

  function getReconciliation(
    submission: FactoringSubmission
  ) {
    const submitted = Number(
      submission.submitted_amount ||
        0
    );

    const recorded = Number(
      paymentTotalsBySubmission.get(
        submission.id
      ) || 0
    );

    const balance = Math.max(
      0,
      submitted - recorded
    );

    return {
      submitted,
      recorded,
      balance,
      reconciled:
        submitted > 0 &&
        balance <= 0,
    };
  }

  const selectedInvoice =
    selectedSubmission
      ? invoiceMap.get(
          selectedSubmission.invoice_id
        )
      : null;

  const fundingSubmitted =
    fundingSubmission
      ? Number(
          fundingSubmission.submitted_amount ||
            0
        )
      : 0;

  const fundingAdvance =
    Number(advanceAmount || 0);

  const fundingFee =
    Number(factoringFee || 0);

  const fundingNet =
    fundingAdvance - fundingFee;

  const paymentReconciliation =
    paymentSubmission
      ? getReconciliation(
          paymentSubmission
        )
      : null;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              {text.eyebrow}
            </div>

            <h1 style={styles.title}>
              {text.title}
            </h1>

            <p style={styles.subtitle}>
              {text.subtitle}
            </p>
          </div>

          <button
            onClick={loadData}
            style={styles.refreshButton}
          >
            {text.refresh}
          </button>
        </div>

        <div style={styles.statsGrid}>
          <StatCard
            label={text.submitted}
            value={formatMoney(
              stats.submitted
            )}
            sub={text.submittedSub}
          />

          <StatCard
            label={text.advanced}
            value={formatMoney(
              stats.advanced
            )}
            sub={text.advancedSub}
          />

          <StatCard
            label={text.reserve}
            value={formatMoney(
              stats.reserve
            )}
            sub={text.reserveSub}
          />

          <StatCard
            label={text.fees}
            value={formatMoney(
              stats.fees
            )}
            sub={text.feesSub}
          />

          <StatCard
            label={text.funded}
            value={String(
              stats.funded
            )}
            sub={text.fundedSub}
          />

          <StatCard
            label={text.pending}
            value={String(
              stats.pending
            )}
            sub={text.pendingSub}
          />

          <StatCard
            label={text.payments}
            value={formatMoney(
              stats.recordedPayments
            )}
            sub={text.paymentsSub}
          />
        </div>

        <div style={styles.toolbar}>
          <div style={styles.tabs}>
            <button
              onClick={() => {
                setActiveTab(
                  "submissions"
                );
                setSearch("");
              }}
              style={{
                ...styles.tab,
                ...(activeTab ===
                "submissions"
                  ? styles.activeTab
                  : {}),
              }}
            >
              {text.submissionsTab}
            </button>

            <button
              onClick={() => {
                setActiveTab(
                  "payments"
                );
                setSearch("");
              }}
              style={{
                ...styles.tab,
                ...(activeTab ===
                "payments"
                  ? styles.activeTab
                  : {}),
              }}
            >
              {text.paymentsTab}
            </button>

            <button
              onClick={() => {
                setActiveTab(
                  "history"
                );
                setSearch("");
              }}
              style={{
                ...styles.tab,
                ...(activeTab ===
                "history"
                  ? styles.activeTab
                  : {}),
              }}
            >
              {text.historyTab}
            </button>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={
              activeTab ===
              "submissions"
                ? text.searchSubmissions
                : text.searchPayments
            }
            style={styles.search}
          />
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {activeTab ===
                "submissions"
                  ? text.submissionsTitle
                  : activeTab ===
                    "payments"
                  ? text.paymentsTitle
                  : text.historyTitle}
              </h2>

              <p
                style={
                  styles.cardSubtitle
                }
              >
                {activeTab ===
                "submissions"
                  ? text.submissionsDescription
                  : activeTab ===
                    "payments"
                  ? text.paymentsDescription
                  : text.historyDescription}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              {text.loading}
            </div>
          ) : activeTab ===
            "submissions" ? (
            <SubmissionsTable
              isES={isES}
              text={text}
              submissions={filteredSubmissions.filter(
                (submission) => {
                  const invoice =
                    invoiceMap.get(
                      submission.invoice_id
                    );

                  return (
                    invoice?.status?.toLowerCase() !==
                    "closed"
                  );
                }
              )}
              invoiceMap={invoiceMap}
              paymentTotalsBySubmission={
                paymentTotalsBySubmission
              }
              onView={
                setSelectedSubmission
              }
              getNextAction={
                getNextAction
              }
              formatMoney={
                formatMoney
              }
              formatDate={
                formatDate
              }
              getStatusStyle={
                getStatusStyle
              }
            />
          ) : activeTab ===
            "payments" ? (
            <PaymentsTable
              text={text}
              payments={
                filteredPayments
              }
              submissions={
                submissions
              }
              invoiceMap={
                invoiceMap
              }
              onView={
                setSelectedPayment
              }
              formatMoney={
                formatMoney
              }
              formatDate={
                formatDate
              }
            />
          ) : (
            <SubmissionsTable
              isES={isES}
              text={text}
              submissions={filteredSubmissions.filter(
                (submission) => {
                  const invoice =
                    invoiceMap.get(
                      submission.invoice_id
                    );

                  return (
                    invoice?.status?.toLowerCase() ===
                    "closed"
                  );
                }
              )}
              invoiceMap={invoiceMap}
              paymentTotalsBySubmission={
                paymentTotalsBySubmission
              }
              onView={
                setSelectedSubmission
              }
              getNextAction={
                getNextAction
              }
              formatMoney={
                formatMoney
              }
              formatDate={
                formatDate
              }
              getStatusStyle={
                getStatusStyle
              }
            />
          )}
        </section>
      </div>

      {selectedSubmission && (
        <Modal
          title={
            text.factoringSubmission
          }
          onClose={() =>
            setSelectedSubmission(
              null
            )
          }
        >
          <DetailModal
            isES={isES}
            text={text}
            submission={
              selectedSubmission
            }
            invoice={
              selectedInvoice
            }
            reconciliation={getReconciliation(
              selectedSubmission
            )}
            formatMoney={
              formatMoney
            }
            formatDate={
              formatDate
            }
            onFunding={() =>
              openFundingControl(
                selectedSubmission
              )
            }
            onPayment={() =>
              openPaymentModal(
                selectedSubmission
              )
            }
            onCloseInvoice={() =>
              closeInvoice(
                selectedSubmission
              )
            }
          />
        </Modal>
      )}

      {selectedPayment && (
        <Modal
          title={
            text.factoringPayment
          }
          onClose={() =>
            setSelectedPayment(
              null
            )
          }
        >
          <PaymentDetailModal
            text={text}
            payment={
              selectedPayment
            }
            submission={submissions.find(
              (item) =>
                item.id ===
                selectedPayment.factoring_submission_id
            )}
            invoiceMap={
              invoiceMap
            }
            formatMoney={
              formatMoney
            }
            formatDate={
              formatDate
            }
          />
        </Modal>
      )}

      {fundingSubmission && (
        <Modal
          title={
            text.fundingControl
          }
          onClose={() =>
            setFundingSubmission(
              null
            )
          }
        >
          <div style={styles.modalBody}>
            <div
              style={styles.summaryBox}
            >
              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.invoice}
                </span>

                <strong>
                  {invoiceMap.get(
                    fundingSubmission.invoice_id
                  )?.invoice_number ||
                    "—"}
                </strong>
              </div>

              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.submittedAmount}
                </span>

                <strong>
                  {formatMoney(
                    fundingSubmission.submitted_amount
                  )}
                </strong>
              </div>

              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.status}
                </span>

                <span
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(
                      fundingSubmission.status
                    ),
                  }}
                >
                  {fundingSubmission.status ||
                    "—"}
                </span>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span>
                  {text.advanceAmount}
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={
                    advanceAmount
                  }
                  onChange={(event) =>
                    setAdvanceAmount(
                      event.target
                        .value
                    )
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>
                  {text.reserveAmount}
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={
                    reserveAmount
                  }
                  onChange={(event) =>
                    setReserveAmount(
                      event.target
                        .value
                    )
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>
                  {text.factoringFee}
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={
                    factoringFee
                  }
                  onChange={(event) =>
                    setFactoringFee(
                      event.target
                        .value
                    )
                  }
                  style={styles.input}
                />
              </label>
            </div>

            <div
              style={styles.netFunding}
            >
              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.submittedAmount}
                </span>

                <strong>
                  {formatMoney(
                    fundingSubmitted
                  )}
                </strong>
              </div>

              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.netFunding}
                </span>

                <strong>
                  {formatMoney(
                    fundingNet
                  )}
                </strong>
              </div>
            </div>

            <div
              style={styles.infoBox}
            >
              {text.testDefaults}
            </div>

            <div
              style={styles.modalActions}
            >
              <button
                onClick={() =>
                  setFundingSubmission(
                    null
                  )
                }
                style={
                  styles.secondaryButton
                }
              >
                {text.cancel}
              </button>

              <button
                onClick={
                  approveFunding
                }
                disabled={
                  actionLoading
                }
                style={
                  styles.primaryButton
                }
              >
                {actionLoading
                  ? text.saving
                  : text.approveFunding}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {paymentSubmission && (
        <Modal
          title={
            text.recordPaymentTitle
          }
          onClose={() =>
            setPaymentSubmission(
              null
            )
          }
        >
          <div style={styles.modalBody}>
            <div
              style={styles.summaryBox}
            >
              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.invoice}
                </span>

                <strong>
                  {invoiceMap.get(
                    paymentSubmission.invoice_id
                  )?.invoice_number ||
                    "—"}
                </strong>
              </div>

              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.status}
                </span>

                <span
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(
                      paymentSubmission.status
                    ),
                  }}
                >
                  {paymentSubmission.status ||
                    "—"}
                </span>
              </div>

              <div>
                <span
                  style={
                    styles.summaryLabel
                  }
                >
                  {text.submittedAmount}
                </span>

                <strong>
                  {formatMoney(
                    paymentSubmission.submitted_amount
                  )}
                </strong>
              </div>
            </div>

            {paymentReconciliation && (
              <div
                style={
                  styles.reconciliationBox
                }
              >
                <div>
                  <span
                    style={
                      styles.summaryLabel
                    }
                  >
                    {
                      text.recordedPayments
                    }
                  </span>

                  <strong>
                    {formatMoney(
                      paymentReconciliation.recorded
                    )}
                  </strong>
                </div>

                <div>
                  <span
                    style={
                      styles.summaryLabel
                    }
                  >
                    {
                      text.reconciliationBalance
                    }
                  </span>

                  <strong>
                    {formatMoney(
                      paymentReconciliation.balance
                    )}
                  </strong>
                </div>

                <div>
                  <span
                    style={
                      styles.summaryLabel
                    }
                  >
                    {
                      text.reconciliationState
                    }
                  </span>

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(paymentReconciliation.reconciled
                        ? {
                            background:
                              "#dcfce7",
                            color:
                              "#166534",
                          }
                        : {
                            background:
                              "#fef3c7",
                            color:
                              "#92400e",
                          }),
                    }}
                  >
                    {paymentReconciliation.reconciled
                      ? text.reconciled
                      : text.open}
                  </span>
                </div>
              </div>
            )}

            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span>
                  {text.paymentType}
                </span>

                <select
                  value={
                    paymentType
                  }
                  onChange={(event) =>
                    setPaymentType(
                      event.target
                        .value
                    )
                  }
                  style={styles.input}
                >
                  <option value="Factoring Payment">
                    {
                      text.factoringPaymentOption
                    }
                  </option>

                  <option value="Reserve Release">
                    {text.reserveRelease}
                  </option>

                  <option value="Other">
                    {text.other}
                  </option>
                </select>
              </label>

              <label style={styles.field}>
                <span>
                  {text.amount}
                </span>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    paymentAmount
                  }
                  onChange={(event) =>
                    setPaymentAmount(
                      event.target
                        .value
                    )
                  }
                  placeholder="0.00"
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>
                  {text.paymentDate}
                </span>

                <input
                  type="date"
                  value={
                    paymentDate
                  }
                  onChange={(event) =>
                    setPaymentDate(
                      event.target
                        .value
                    )
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>
                  {
                    text.referenceNumber
                  }
                </span>

                <input
                  value={
                    referenceNumber
                  }
                  onChange={(event) =>
                    setReferenceNumber(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    text.optional
                  }
                  style={styles.input}
                />
              </label>
            </div>

            <div
              style={styles.infoBox}
            >
              {text.recordPaymentInfo}
            </div>

            <div
              style={styles.modalActions}
            >
              <button
                onClick={() =>
                  setPaymentSubmission(
                    null
                  )
                }
                style={
                  styles.secondaryButton
                }
              >
                {text.cancel}
              </button>

              <button
                onClick={
                  recordPayment
                }
                disabled={
                  actionLoading
                }
                style={
                  styles.primaryButton
                }
              >
                {actionLoading
                  ? text.saving
                  : text.recordPayment}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>
        {label}
      </span>

      <strong style={styles.statValue}>
        {value}
      </strong>

      <span style={styles.statSub}>
        {sub}
      </span>
    </div>
  );
}

function SubmissionsTable({
  isES,
  text,
  submissions,
  invoiceMap,
  paymentTotalsBySubmission,
  onView,
  getNextAction,
  formatMoney,
  formatDate,
  getStatusStyle,
}: {
  isES: boolean;
  text: Record<string, string>;
  submissions: FactoringSubmission[];
  invoiceMap: Map<string, Invoice>;
  paymentTotalsBySubmission: Map<
    string,
    number
  >;
  onView: (
    submission: FactoringSubmission
  ) => void;
  getNextAction: (
    submission: FactoringSubmission
  ) => React.ReactNode;
  formatMoney: (
    value: number | null | undefined
  ) => string;
  formatDate: (
    value: string | null | undefined
  ) => string;
  getStatusStyle: (
    status: string | null
  ) => React.CSSProperties;
}) {
  if (!submissions.length) {
    return (
      <div style={styles.emptyState}>
        {isES
          ? "No se encontraron envíos de factoring."
          : "No factoring submissions found."}
      </div>
    );
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>
              {text.invoice}
            </th>

            <th style={styles.th}>
              {text.factoringCompany}
            </th>

            <th style={styles.th}>
              {text.amountSubmitted}
            </th>

            <th style={styles.th}>
              {text.advanceAmount}
            </th>

            <th style={styles.th}>
              {text.reserveAmount}
            </th>

            <th style={styles.th}>
              {text.factoringFee}
            </th>

            <th style={styles.th}>
              {text.payments}
            </th>

            <th style={styles.th}>
              {text.invoiceStatus}
            </th>

            <th style={styles.th}>
              {text.factoringStatus}
            </th>

            <th style={styles.th}>
              {text.submittedAt}
            </th>

            <th style={styles.th}>
              {text.fundedAt}
            </th>

            <th style={styles.th}>
              {text.nextAction}
            </th>

            <th style={styles.th}>
              {text.view}
            </th>
          </tr>
        </thead>

        <tbody>
          {submissions.map(
            (submission) => {
              const invoice =
                invoiceMap.get(
                  submission.invoice_id
                );

              const recordedPayments =
                paymentTotalsBySubmission.get(
                  submission.id
                ) || 0;

              return (
                <tr
                  key={submission.id}
                >
                  <td style={styles.td}>
                    <strong>
                      {invoice?.invoice_number ||
                        "—"}
                    </strong>
                  </td>

                  <td style={styles.td}>
                    {submission.factoring_company ||
                      "—"}
                  </td>

                  <td style={styles.td}>
                    {formatMoney(
                      submission.submitted_amount
                    )}
                  </td>

                  <td style={styles.td}>
                    {formatMoney(
                      submission.advance_amount
                    )}
                  </td>

                  <td style={styles.td}>
                    {formatMoney(
                      submission.reserve_amount
                    )}
                  </td>

                  <td style={styles.td}>
                    {formatMoney(
                      submission.factoring_fee
                    )}
                  </td>

                  <td style={styles.td}>
                    {formatMoney(
                      recordedPayments
                    )}
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(
                          invoice?.status ||
                            null
                        ),
                      }}
                    >
                      {invoice?.status ||
                        "—"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(
                          submission.status
                        ),
                      }}
                    >
                      {submission.status ||
                        "—"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {formatDate(
                      submission.submitted_at
                    )}
                  </td>

                  <td style={styles.td}>
                    {formatDate(
                      submission.funded_at
                    )}
                  </td>

                  <td style={styles.td}>
                    {getNextAction(
                      submission
                    )}
                  </td>

                  <td style={styles.td}>
                    <button
                      onClick={() =>
                        onView(
                          submission
                        )
                      }
                      style={
                        styles.viewButton
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
  );
}

function PaymentsTable({
  text,
  payments,
  submissions,
  invoiceMap,
  onView,
  formatMoney,
  formatDate,
}: {
  text: Record<string, string>;
  payments: FactoringPayment[];
  submissions: FactoringSubmission[];
  invoiceMap: Map<string, Invoice>;
  onView: (
    payment: FactoringPayment
  ) => void;
  formatMoney: (
    value: number | null | undefined
  ) => string;
  formatDate: (
    value: string | null | undefined
  ) => string;
}) {
  if (!payments.length) {
    return (
      <div style={styles.emptyState}>
        {text.noPayments}
      </div>
    );
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>
              {text.invoice}
            </th>

            <th style={styles.th}>
              {text.paymentType}
            </th>

            <th style={styles.th}>
              {text.amount}
            </th>

            <th style={styles.th}>
              {text.paymentDate}
            </th>

            <th style={styles.th}>
              {text.reference}
            </th>

            <th style={styles.th}>
              {text.created}
            </th>

            <th style={styles.th}>
              {text.view}
            </th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => {
            const submission =
              submissions.find(
                (item) =>
                  item.id ===
                  payment.factoring_submission_id
              );

            const invoice =
              submission
                ? invoiceMap.get(
                    submission.invoice_id
                  )
                : undefined;

            return (
              <tr
                key={payment.id}
              >
                <td style={styles.td}>
                  <strong>
                    {invoice?.invoice_number ||
                      "—"}
                  </strong>
                </td>

                <td style={styles.td}>
                  {payment.payment_type ||
                    "—"}
                </td>

                <td style={styles.td}>
                  {formatMoney(
                    payment.amount
                  )}
                </td>

                <td style={styles.td}>
                  {formatDate(
                    payment.payment_date
                  )}
                </td>

                <td style={styles.td}>
                  {payment.reference_number ||
                    "—"}
                </td>

                <td style={styles.td}>
                  {formatDate(
                    payment.created_at
                  )}
                </td>

                <td style={styles.td}>
                  <button
                    onClick={() =>
                      onView(payment)
                    }
                    style={
                      styles.viewButton
                    }
                  >
                    {text.view}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailModal({
  isES,
  text,
  submission,
  invoice,
  reconciliation,
  formatMoney,
  formatDate,
  onFunding,
  onPayment,
  onCloseInvoice,
}: {
  isES: boolean;
  text: Record<string, string>;
  submission: FactoringSubmission;
  invoice:
    | Invoice
    | null
    | undefined;
  reconciliation: {
    submitted: number;
    recorded: number;
    balance: number;
    reconciled: boolean;
  };
  formatMoney: (
    value: number | null | undefined
  ) => string;
  formatDate: (
    value: string | null | undefined
  ) => string;
  onFunding: () => void;
  onPayment: () => void;
  onCloseInvoice: () => void;
}) {
  const invoiceClosed =
    invoice?.status === "Closed";

  return (
    <div style={styles.modalBody}>
      <div style={styles.detailGrid}>
        <Detail
          label={text.submissionId}
          value={submission.id}
        />

        <Detail
          label={text.invoice}
          value={
            invoice?.invoice_number ||
            "—"
          }
        />

        <Detail
          label={text.invoiceStatus}
          value={
            invoice?.status || "—"
          }
        />

        <Detail
          label={text.factoringCompany}
          value={
            submission.factoring_company ||
            "—"
          }
        />

        <Detail
          label={text.amountSubmitted}
          value={formatMoney(
            submission.submitted_amount
          )}
        />

        <Detail
          label={text.advanceAmount}
          value={formatMoney(
            submission.advance_amount
          )}
        />

        <Detail
          label={text.reserveAmount}
          value={formatMoney(
            submission.reserve_amount
          )}
        />

        <Detail
          label={text.factoringFee}
          value={formatMoney(
            submission.factoring_fee
          )}
        />

        <Detail
          label={text.factoringStatus}
          value={
            submission.status ||
            "—"
          }
        />

        <Detail
          label={text.submittedAt}
          value={formatDate(
            submission.submitted_at
          )}
        />

        <Detail
          label={text.fundedAt}
          value={formatDate(
            submission.funded_at
          )}
        />

        <Detail
          label={text.invoiceAmount}
          value={formatMoney(
            invoice?.invoice_amount
          )}
        />
      </div>

      <div
        style={
          styles.reconciliationBox
        }
      >
        <div>
          <span
            style={
              styles.summaryLabel
            }
          >
            {text.recordedPayments}
          </span>

          <strong>
            {formatMoney(
              reconciliation.recorded
            )}
          </strong>
        </div>

        <div>
          <span
            style={
              styles.summaryLabel
            }
          >
            {
              text.reconciliationBalance
            }
          </span>

          <strong>
            {formatMoney(
              reconciliation.balance
            )}
          </strong>
        </div>

        <div>
          <span
            style={
              styles.summaryLabel
            }
          >
            {
              text.reconciliationState
            }
          </span>

          <span
            style={{
              ...styles.statusBadge,
              ...(reconciliation.reconciled
                ? {
                    background:
                      "#dcfce7",
                    color:
                      "#166534",
                  }
                : {
                    background:
                      "#fef3c7",
                    color:
                      "#92400e",
                  }),
            }}
          >
            {reconciliation.reconciled
              ? text.reconciled
              : text.open}
          </span>
        </div>
      </div>

      <div
        style={styles.modalActions}
      >
        {submission.status ===
          "Under Review" && (
          <button
            onClick={onFunding}
            style={
              styles.primaryButton
            }
          >
            {text.fundingControl}
          </button>
        )}

        {submission.status ===
          "Funded" &&
          !reconciliation.reconciled &&
          !invoiceClosed && (
            <button
              onClick={onPayment}
              style={
                styles.primaryButton
              }
            >
              {text.recordPayment}
            </button>
          )}

        {submission.status ===
          "Funded" &&
          reconciliation.reconciled &&
          !invoiceClosed && (
            <button
              onClick={
                onCloseInvoice
              }
              style={
                styles.closeInvoiceButton
              }
            >
              {text.closeInvoice}
            </button>
          )}

        {invoiceClosed && (
          <span
            style={
              styles.closedBadge
            }
          >
            {text.closedInvoice}
          </span>
        )}
      </div>
    </div>
  );
}

function PaymentDetailModal({
  text,
  payment,
  submission,
  invoiceMap,
  formatMoney,
  formatDate,
}: {
  text: Record<string, string>;
  payment: FactoringPayment;
  submission:
    | FactoringSubmission
    | undefined;
  invoiceMap: Map<string, Invoice>;
  formatMoney: (
    value: number | null | undefined
  ) => string;
  formatDate: (
    value: string | null | undefined
  ) => string;
}) {
  const invoice = submission
    ? invoiceMap.get(
        submission.invoice_id
      )
    : undefined;

  return (
    <div style={styles.modalBody}>
      <div style={styles.detailGrid}>
        <Detail
          label={text.paymentId}
          value={payment.id}
        />

        <Detail
          label={text.invoice}
          value={
            invoice?.invoice_number ||
            "—"
          }
        />

        <Detail
          label={text.paymentType}
          value={
            payment.payment_type ||
            "—"
          }
        />

        <Detail
          label={text.amount}
          value={formatMoney(
            payment.amount
          )}
        />

        <Detail
          label={text.paymentDate}
          value={formatDate(
            payment.payment_date
          )}
        />

        <Detail
          label={text.referenceNumber}
          value={
            payment.reference_number ||
            "—"
          }
        />

        <Detail
          label={text.createdAt}
          value={formatDate(
            payment.created_at
          )}
        />
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.detailItem}>
      <span
        style={styles.detailLabel}
      >
        {label}
      </span>

      <strong
        style={styles.detailValue}
      >
        {value}
      </strong>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div
          style={styles.modalHeader}
        >
          <h2
            style={styles.modalTitle}
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            style={
              styles.closeButton
            }
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "36px 32px 60px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: 1400,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: 24,
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: 8,
  },

  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 850,
    color: "#0f172a",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: 15,
  },

  refreshButton: {
    border:
      "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },

  statCard: {
    background: "#ffffff",
    border:
      "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 18,
    boxShadow:
      "0 1px 2px rgba(15, 23, 42, 0.03)",
  },

  statLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 750,
    color: "#64748b",
    marginBottom: 8,
  },

  statValue: {
    display: "block",
    fontSize: 24,
    color: "#0f172a",
    marginBottom: 5,
  },

  statSub: {
    display: "block",
    fontSize: 12,
    color: "#94a3b8",
  },

  toolbar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  tabs: {
    display: "flex",
    gap: 4,
    background: "#e2e8f0",
    borderRadius: 10,
    padding: 4,
  },

  tab: {
    border: "none",
    background:
      "transparent",
    color: "#475569",
    borderRadius: 8,
    padding: "9px 14px",
    fontWeight: 750,
    cursor: "pointer",
  },

  activeTab: {
    background: "#ffffff",
    color: "#0f172a",
    boxShadow:
      "0 1px 2px rgba(15, 23, 42, 0.08)",
  },

  search: {
    minWidth: 320,
    border:
      "1px solid #cbd5e1",
    borderRadius: 10,
    background: "#ffffff",
    padding: "10px 13px",
    outline: "none",
    fontSize: 14,
  },

  card: {
    background: "#ffffff",
    border:
      "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow:
      "0 1px 3px rgba(15, 23, 42, 0.04)",
  },

  cardHeader: {
    padding: "20px 22px",
    borderBottom:
      "1px solid #e2e8f0",
  },

  cardTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 18,
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 13,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    minWidth: 1500,
  },

  th: {
    textAlign: "left",
    padding: "13px 16px",
    background: "#f8fafc",
    borderBottom:
      "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: 11,
    fontWeight: 800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.05em",
    whiteSpace:
      "nowrap",
  },

  td: {
    padding: "15px 16px",
    borderBottom:
      "1px solid #f1f5f9",
    color: "#334155",
    fontSize: 13,
    whiteSpace:
      "nowrap",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 11,
    fontWeight: 800,
  },

  actionButton: {
    border:
      "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace:
      "nowrap",
  },

  closeInvoiceButton: {
    border:
      "1px solid #86efac",
    background: "#f0fdf4",
    color: "#15803d",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace:
      "nowrap",
  },

  closedAction: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: "#f0fdf4",
    color: "#15803d",
  },

  closedBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "8px 12px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 800,
  },

  viewButton: {
    border:
      "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 750,
    cursor: "pointer",
  },

  emptyState: {
    padding: 50,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(15, 23, 42, 0.42)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },

  modal: {
    width:
      "min(760px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: 18,
    boxShadow:
      "0 24px 70px rgba(15, 23, 42, 0.24)",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom:
      "1px solid #e2e8f0",
  },

  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 820,
    color: "#0f172a",
  },

  closeButton: {
    border: "none",
    background:
      "transparent",
    fontSize: 28,
    lineHeight: 1,
    color: "#64748b",
    cursor: "pointer",
  },

  modalBody: {
    padding: 22,
  },

  summaryBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14,
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  summaryLabel: {
    display: "block",
    fontSize: 11,
    color: "#64748b",
    fontWeight: 750,
    marginBottom: 5,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },

  field: {
    display: "flex",
    flexDirection:
      "column",
    gap: 7,
    fontSize: 13,
    color: "#334155",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box",
    border:
      "1px solid #cbd5e1",
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
    background: "#ffffff",
    outline: "none",
  },

  netFunding: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: 20,
    marginTop: 20,
    padding: 16,
    background: "#f1f5f9",
    borderRadius: 12,
  },

  reconciliationBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 14,
    marginTop: 18,
    padding: 16,
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 12,
  },

  infoBox: {
    marginTop: 18,
    padding: 13,
    background: "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius: 10,
    color: "#1e40af",
    fontSize: 12,
    lineHeight: 1.5,
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  detailItem: {
    padding: 14,
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 10,
  },

  detailLabel: {
    display: "block",
    fontSize: 11,
    color: "#64748b",
    fontWeight: 750,
    marginBottom: 6,
  },

  detailValue: {
    display: "block",
    fontSize: 14,
    color: "#0f172a",
    wordBreak:
      "break-word",
  },

  modalActions: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: 10,
    marginTop: 22,
  },

  secondaryButton: {
    border:
      "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: 9,
    padding: "10px 15px",
    fontWeight: 750,
    cursor: "pointer",
  },

  primaryButton: {
    border:
      "1px solid #1d4ed8",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 9,
    padding: "10px 16px",
    fontWeight: 800,
    cursor: "pointer",
  },
};