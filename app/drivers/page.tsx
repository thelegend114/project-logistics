"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../lib/LanguageProvider";
type Driver = {
  id: string;
  company_id: string;
  user_id: string | null;
  driver_number: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  medical_card_expiration: string | null;
  status: string;
  created_at: string;
};

type Company = {
  id: string;
  name: string;
};

const STATUS_OPTIONS = [
  "active",
  "available",
  "inactive",
  "off",
];

export default function DriversPage() {
  const { language } = useLanguage();
  const normalizedLanguage = String(language ?? "").trim().toLowerCase();
  const isES = normalizedLanguage === "es" || normalizedLanguage.startsWith("es-") || normalizedLanguage.startsWith("spanish");

  const text = {
    eyebrow: "PROJECT LOGISTICS",
    title: isES ? "Conductores" : "Drivers",
    subtitle: isES
      ? "Administra conductores, credenciales, disponibilidad y estado operativo."
      : "Manage drivers, credentials, availability and operating status.",
    addDriver: isES ? "+ Agregar conductor" : "+ Add Driver",

    totalDrivers: isES ? "TOTAL DE CONDUCTORES" : "TOTAL DRIVERS",
    totalDriversText: isES ? "Conductores registrados" : "Registered drivers",
    active: isES ? "ACTIVOS" : "ACTIVE",
    activeText: isES ? "Actualmente activos" : "Currently active",
    available: isES ? "DISPONIBLES" : "AVAILABLE",
    availableText: isES ? "Disponibles para despacho" : "Available for dispatch",
    inactive: isES ? "INACTIVOS" : "INACTIVE",
    inactiveText: isES ? "No están operando actualmente" : "Not currently operating",

    search: isES
      ? "Buscar conductor, número, teléfono o correo..."
      : "Search driver, number, phone or email...",
    allStatuses: isES ? "Todos los estados" : "All statuses",
    activeStatus: isES ? "Activo" : "Active",
    availableStatus: isES ? "Disponible" : "Available",
    inactiveStatus: isES ? "Inactivo" : "Inactive",
    offStatus: isES ? "Fuera de servicio" : "Off",
    loading: isES ? "Cargando conductores..." : "Loading drivers...",
    noDrivers: isES ? "No se encontraron conductores" : "No drivers found",
    noDriversHelp: isES
      ? "Agrega un conductor o cambia los filtros de búsqueda."
      : "Add a driver or change your search filters.",

    tableDriver: isES ? "CONDUCTOR" : "DRIVER",
    tableDriverNumber: isES ? "N.º DE CONDUCTOR" : "DRIVER #",
    tableCompany: isES ? "EMPRESA" : "COMPANY",
    tablePhone: isES ? "TELÉFONO" : "PHONE",
    tableLicense: isES ? "LICENCIA" : "LICENSE",
    tableLicenseExp: isES ? "VENC. LICENCIA" : "LICENSE EXP.",
    tableMedicalExp: isES ? "VENC. MÉDICO" : "MEDICAL EXP.",
    tableStatus: isES ? "ESTADO" : "STATUS",
    noEmail: isES ? "Sin correo electrónico" : "No email",
    unknownCompany: isES ? "Empresa desconocida" : "Unknown company",
    viewEdit: isES ? "Ver / Editar" : "View / Edit",

    driverManagement: isES ? "GESTIÓN DE CONDUCTORES" : "DRIVER MANAGEMENT",
    addDriverTitle: isES ? "Agregar conductor" : "Add Driver",
    addDriverSubtitle: isES
      ? "Crea un nuevo perfil de conductor."
      : "Create a new driver profile.",
    driverNumber: isES ? "Número de conductor *" : "Driver Number *",
    fullName: isES ? "Nombre completo *" : "Full Name *",
    phone: isES ? "Teléfono" : "Phone",
    email: isES ? "Correo electrónico" : "Email",
    licenseNumber: isES ? "Número de licencia" : "License Number",
    licenseState: isES ? "Estado de licencia" : "License State",
    licenseExpiration: isES ? "Vencimiento de licencia" : "License Expiration",
    medicalExpiration: isES ? "Vencimiento de tarjeta médica" : "Medical Card Expiration",
    companyRequired: isES ? "Compañía *" : "Company *",
    selectCompany: isES ? "Seleccionar compañía" : "Select company",
    cancel: isES ? "Cancelar" : "Cancel",
    creating: isES ? "Creando..." : "Creating...",
    createDriver: isES ? "Crear conductor" : "Create Driver",

    driverProfile: isES ? "PERFIL DEL CONDUCTOR" : "DRIVER PROFILE",
    editProfileSubtitle: isES
      ? "Editar información del conductor y estado de operación."
      : "Edit driver information and operating status.",
    driverStatus: isES ? "Estado del conductor" : "Driver Status",
    editNotice: isES
      ? "Los cambios actualizarán este perfil de conductor en Project Logistics."
      : "Changes will update this driver profile in Project Logistics.",
    saving: isES ? "Guardando..." : "Saving...",
    saveChanges: isES ? "Guardar cambios" : "Save Changes",

    driverNumberRequired: isES
      ? "El número de conductor es obligatorio."
      : "Driver number is required.",
    driverNameRequired: isES
      ? "El nombre del conductor es obligatorio."
      : "Driver name is required.",
    companyRequiredMessage: isES
      ? "La compañía es obligatoria."
      : "Company is required.",
    loggedInRequired: isES
      ? "Debes iniciar sesión."
      : "You must be logged in.",
    noCompanyAssigned: isES
      ? "Tu cuenta no tiene una compañía asignada."
      : "Your account has no company assigned.",
    companyNotFound: isES
      ? "No se encontró la compañía seleccionada."
      : "Selected company was not found.",
    driverCreated: isES
      ? "Conductor creado correctamente."
      : "Driver created successfully.",
    invalidDriverStatus: isES
      ? "Estado de conductor no válido."
      : "Invalid driver status.",
    validEmail: isES
      ? "Ingresa una dirección de correo válida."
      : "Please enter a valid email address.",
    driverUpdated: isES
      ? "Estado del conductor actualizado."
      : "Driver status updated.",
    updatedSuccessfully: isES
      ? "se actualizó correctamente."
      : "was updated successfully.",
  };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [driverNumber, setDriverNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiration, setLicenseExpiration] = useState("");
  const [medicalExpiration, setMedicalExpiration] = useState("");
  const [companyId, setCompanyId] = useState("");

  const [editDriverNumber, setEditDriverNumber] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLicenseNumber, setEditLicenseNumber] = useState("");
  const [editLicenseState, setEditLicenseState] = useState("");
  const [editLicenseExpiration, setEditLicenseExpiration] = useState("");
  const [editMedicalExpiration, setEditMedicalExpiration] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [driversResult, companiesResult] = await Promise.all([
      supabase
        .from("drivers")
        .select(
          `
          id,
          company_id,
          user_id,
          driver_number,
          full_name,
          phone,
          email,
          license_number,
          license_state,
          license_expiration,
          medical_card_expiration,
          status,
          created_at
        `
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (driversResult.error) {
      showMessage(driversResult.error.message, "error");
    } else {
      setDrivers(driversResult.data || []);
    }

    if (companiesResult.error) {
      console.error(companiesResult.error);
    } else {
      setCompanies(companiesResult.data || []);

      if (!companyId && companiesResult.data?.length) {
        setCompanyId(companiesResult.data[0].id);
      }
    }

    setLoading(false);
  }

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function openAddModal() {
    setDriverNumber("");
    setFullName("");
    setPhone("");
    setEmail("");
    setLicenseNumber("");
    setLicenseState("");
    setLicenseExpiration("");
    setMedicalExpiration("");

    if (companies.length > 0) {
      setCompanyId(companies[0].id);
    } else {
      setCompanyId("");
    }

    setShowAddModal(true);
  }

  function closeAddModal() {
    if (!saving) {
      setShowAddModal(false);
    }
  }

  async function createDriver() {
    if (!driverNumber.trim()) {
      showMessage(text.driverNumberRequired, "error");
      return;
    }

    if (!fullName.trim()) {
      showMessage(text.driverNameRequired, "error");
      return;
    }

    if (!companyId) {
      showMessage(text.companyRequiredMessage, "error");
      return;
    }

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      showMessage(text.loggedInRequired, "error");
      setSaving(false);
      return;
    }

    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (userError) {
      showMessage(userError.message, "error");
      setSaving(false);
      return;
    }

    if (!currentUser?.company_id) {
      showMessage(text.noCompanyAssigned, "error");
      setSaving(false);
      return;
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) {
      showMessage(companyError.message, "error");
      setSaving(false);
      return;
    }

    if (!company) {
      showMessage(text.companyNotFound, "error");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("drivers")
      .insert({
        company_id: companyId,
        user_id: null,
        driver_number: driverNumber.trim(),
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        license_number: licenseNumber.trim() || null,
        license_state: licenseState.trim().toUpperCase() || null,
        license_expiration: licenseExpiration || null,
        medical_card_expiration: medicalExpiration || null,
        status: "active",
      })
      .select(
        `
        id,
        company_id,
        user_id,
        driver_number,
        full_name,
        phone,
        email,
        license_number,
        license_state,
        license_expiration,
        medical_card_expiration,
        status,
        created_at
      `
      )
      .single();

    if (error) {
      showMessage(error.message, "error");
      setSaving(false);
      return;
    }

    setDrivers((current) => [data, ...current]);
    setShowAddModal(false);

    showMessage(text.driverCreated, "success");

    setSaving(false);
  }

  function openDriverProfile(driver: Driver) {
    setSelectedDriver(driver);

    setEditDriverNumber(driver.driver_number || "");
    setEditFullName(driver.full_name || "");
    setEditPhone(driver.phone || "");
    setEditEmail(driver.email || "");
    setEditLicenseNumber(driver.license_number || "");
    setEditLicenseState(driver.license_state || "");
    setEditLicenseExpiration(
      driver.license_expiration
        ? driver.license_expiration.slice(0, 10)
        : ""
    );
    setEditMedicalExpiration(
      driver.medical_card_expiration
        ? driver.medical_card_expiration.slice(0, 10)
        : ""
    );
    setEditCompanyId(driver.company_id || "");
    setEditStatus(driver.status || "active");
  }

  function closeDriverProfile() {
    if (savingEdit) return;

    setSelectedDriver(null);
  }

  async function saveDriverProfile() {
    if (!selectedDriver) return;

    const cleanDriverNumber = editDriverNumber.trim();
    const cleanFullName = editFullName.trim();
    const cleanPhone = editPhone.trim();
    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanLicenseNumber = editLicenseNumber.trim();
    const cleanLicenseState = editLicenseState.trim().toUpperCase();
    const cleanCompanyId = editCompanyId.trim();
    const cleanStatus = editStatus.trim().toLowerCase();

    if (!cleanDriverNumber) {
      showMessage(text.driverNumberRequired, "error");
      return;
    }

    if (!cleanFullName) {
      showMessage(text.driverNameRequired, "error");
      return;
    }

    if (!cleanCompanyId) {
      showMessage(text.companyRequiredMessage, "error");
      return;
    }

    if (!STATUS_OPTIONS.includes(cleanStatus)) {
      showMessage(text.invalidDriverStatus, "error");
      return;
    }

    if (cleanEmail && !cleanEmail.includes("@")) {
      showMessage(text.validEmail, "error");
      return;
    }

    setSavingEdit(true);

    const { data, error } = await supabase
      .from("drivers")
      .update({
        company_id: cleanCompanyId,
        driver_number: cleanDriverNumber,
        full_name: cleanFullName,
        phone: cleanPhone || null,
        email: cleanEmail || null,
        license_number: cleanLicenseNumber || null,
        license_state: cleanLicenseState || null,
        license_expiration:
          editLicenseExpiration || null,
        medical_card_expiration:
          editMedicalExpiration || null,
        status: cleanStatus,
      })
      .eq("id", selectedDriver.id)
      .select(
        `
        id,
        company_id,
        user_id,
        driver_number,
        full_name,
        phone,
        email,
        license_number,
        license_state,
        license_expiration,
        medical_card_expiration,
        status,
        created_at
      `
      )
      .single();

    if (error) {
      console.error("UPDATE DRIVER ERROR:", error);
      showMessage(error.message, "error");
      setSavingEdit(false);
      return;
    }

    setDrivers((current) =>
      current.map((driver) =>
        driver.id === selectedDriver.id
          ? data
          : driver
      )
    );

    setSelectedDriver(data);

    setEditDriverNumber(data.driver_number || "");
    setEditFullName(data.full_name || "");
    setEditPhone(data.phone || "");
    setEditEmail(data.email || "");
    setEditLicenseNumber(data.license_number || "");
    setEditLicenseState(data.license_state || "");
    setEditLicenseExpiration(
      data.license_expiration
        ? data.license_expiration.slice(0, 10)
        : ""
    );
    setEditMedicalExpiration(
      data.medical_card_expiration
        ? data.medical_card_expiration.slice(0, 10)
        : ""
    );
    setEditCompanyId(data.company_id || "");
    setEditStatus(data.status || "active");

    showMessage(
      `${data.full_name} ${text.updatedSuccessfully}`,
      "success"
    );

    setSavingEdit(false);
  }

  async function changeStatus(
    driverId: string,
    status: string
  ) {
    const { error } = await supabase
      .from("drivers")
      .update({ status })
      .eq("id", driverId);

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    setDrivers((current) =>
      current.map((driver) =>
        driver.id === driverId
          ? { ...driver, status }
          : driver
      )
    );

    setSelectedDriver((current) =>
      current
        ? { ...current, status }
        : current
    );

    setEditStatus(status);

    showMessage(text.driverUpdated, "success");
  }

  const filteredDrivers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return drivers.filter((driver) => {
      const matchesSearch =
        !value ||
        driver.full_name.toLowerCase().includes(value) ||
        driver.driver_number.toLowerCase().includes(value) ||
        (driver.phone || "").toLowerCase().includes(value) ||
        (driver.email || "").toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "all" ||
        driver.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const activeCount = drivers.filter(
    (driver) => driver.status === "active"
  ).length;

  const availableCount = drivers.filter(
    (driver) => driver.status === "available"
  ).length;

  const inactiveCount = drivers.filter(
    (driver) => driver.status === "inactive"
  ).length;

  function companyName(id: string) {
    return (
      companies.find((company) => company.id === id)?.name ||
      text.unknownCompany
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(isES ? "es-US" : "en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function statusLabel(status: string) {
    if (status === "active") return text.activeStatus;
    if (status === "available") return text.availableStatus;
    if (status === "inactive") return text.inactiveStatus;
    if (status === "off") return text.offStatus;
    return status;
  }

  function statusClass(status: string) {
    if (status === "active") return "status active";
    if (status === "available") return "status available";
    if (status === "inactive") return "status inactive";
    return "status off";
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <div>
            <div className="eyebrow">{text.eyebrow}</div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>

          <button
            className="primaryButton"
            onClick={openAddModal}
          >
            {text.addDriver}
          </button>
        </header>

        {message && (
          <div
            className={
              messageType === "success"
                ? "message success"
                : "message error"
            }
          >
            {message}
          </div>
        )}

       <section className="stats">
  <div className="statCard">
    <div className="statLabel">
      {text.totalDrivers}
    </div>
    <div className="statValue">{drivers.length}</div>
    <div className="statText">
      {text.totalDriversText}
    </div>
  </div>

  <div className="statCard">
    <div className="statLabel">
      {text.active}
    </div>
    <div className="statValue">{activeCount}</div>
    <div className="statText">
      {text.activeText}
    </div>
  </div>
          <div className="statCard">
  <div className="statLabel">
    {text.available}
  </div>
  <div className="statValue">{availableCount}</div>
  <div className="statText">
    {text.availableText}
  </div>
</div>

<div className="statCard">
  <div className="statLabel">
    {text.inactive}
  </div>
  <div className="statValue">{inactiveCount}</div>
  <div className="statText">
    {text.inactiveText}
  </div>
</div>
        </section>

        <section className="panel">
          <div className="toolbar">
           <input
  className="search"
  placeholder={text.search}
  value={search}
  onChange={(event) =>
    setSearch(event.target.value)
  }
/>

            <select
              className="select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">
  {text.allStatuses}
</option>

<option value="active">
  {text.activeStatus}
</option>

<option value="available">
  {text.availableStatus}
</option>

<option value="inactive">
  {text.inactiveStatus}
</option>

<option value="off">
  {text.offStatus}
</option>
            </select>
          </div>

         {loading ? (
  <div className="empty">
    {text.loading}
  </div>
) : filteredDrivers.length === 0 ? (
  <div className="empty">
    <strong>
      {text.noDrivers}
    </strong>
    <span>
      {text.noDriversHelp}
    </span>
  </div>
) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>{text.tableDriver}</th>
                    <th>{text.tableDriverNumber}</th>
                    <th>{text.tableCompany}</th>
                    <th>{text.tablePhone}</th>
                    <th>{text.tableLicense}</th>
                    <th>{text.tableLicenseExp}</th>
                    <th>{text.tableMedicalExp}</th>
                    <th>{text.tableStatus}</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id}>
                      <td>
                        <div className="driverCell">
                          <div className="avatar">
                            {driver.full_name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div className="driverName">
                              {driver.full_name}
                            </div>

                            <div className="driverEmail">
  {driver.email || text.noEmail}
</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {driver.driver_number}
                        </strong>
                      </td>

                      <td>
                        {companyName(driver.company_id)}
                      </td>

                      <td>
                        {driver.phone || "—"}
                      </td>

                      <td>
                        {driver.license_number || "—"}
                        {driver.license_state
                          ? ` · ${driver.license_state}`
                          : ""}
                      </td>

                      <td>
                        {formatDate(
                          driver.license_expiration
                        )}
                      </td>

                      <td>
                        {formatDate(
                          driver.medical_card_expiration
                        )}
                      </td>

                      <td>
                        <span
                          className={statusClass(
                            driver.status
                          )}
                        >
                          <span className="dot" />
                          {statusLabel(driver.status)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="viewButton"
                          onClick={() =>
                            openDriverProfile(driver)
                          }
                        >
                          {text.viewEdit}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showAddModal && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  {text.driverManagement}
                </div>

              <h2>{text.addDriverTitle}</h2>

                <p>
                  {text.addDriverSubtitle}
                </p>
              </div>

              <button
                className="closeButton"
                onClick={closeAddModal}
              >
                ×
              </button>
            </div>

            <div className="formGrid">
              <div className="field">
                <label>{text.driverNumber}</label>

                <input
                  value={driverNumber}
                  onChange={(event) =>
                    setDriverNumber(event.target.value)
                  }
                  placeholder="DRV-001"
                />
              </div>

              <div className="field">
                <label>{text.fullName}</label>

                <input
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder={isES ? "Juan Pérez" : "John Smith"}
                />
              </div>

              <div className="field">
                <label>{text.phone}</label>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder={isES ? "(555) 555-5555" : "(555) 555-5555"}
                />
              </div>

              <div className="field">
                <label>{text.email}</label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder={isES ? "juan@ejemplo.com" : "john@example.com"}
                />
              </div>

              <div className="field">
                <label>{text.licenseNumber}</label>

                <input
                  value={licenseNumber}
                  onChange={(event) =>
                    setLicenseNumber(
                      event.target.value
                    )
                  }
                  placeholder={isES ? "Número de licencia" : "License number"}
                />
              </div>

              <div className="field">
                <label>{text.licenseState}</label>

                <input
                  maxLength={2}
                  value={licenseState}
                  onChange={(event) =>
                    setLicenseState(
                      event.target.value
                    )
                  }
                  placeholder="FL"
                />
              </div>

              <div className="field">
                <label>{text.licenseExpiration}</label>

                <input
                  type="date"
                  value={licenseExpiration}
                  onChange={(event) =>
                    setLicenseExpiration(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>{text.medicalExpiration}</label>

                <input
                  type="date"
                  value={medicalExpiration}
                  onChange={(event) =>
                    setMedicalExpiration(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field full">
                <label>{text.companyRequired}</label>

                <select
                  value={companyId}
                  onChange={(event) =>
                    setCompanyId(event.target.value)
                  }
                >
                  <option value="">
                    {text.selectCompany}
                  </option>

                  {companies.map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modalFooter">
              <button
                className="secondaryButton"
                onClick={closeAddModal}
                disabled={saving}
              >
                {text.cancel}
              </button>

              <button
                className="primaryButton"
                onClick={createDriver}
                disabled={saving}
              >
                {saving
                  ? isES ? "Creando..." : "Creating..."
                  : isES ? "Crear Conductor" : "Create Driver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDriver && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDriverProfile();
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  {text.driverProfile}
                </div>

                <h2>
                  {selectedDriver.full_name}
                </h2>

                <p>
                  {text.editProfileSubtitle}
                </p>
              </div>

              <button
                className="closeButton"
                onClick={closeDriverProfile}
                disabled={savingEdit}
              >
                ×
              </button>
            </div>

            <div className="formGrid">
              <div className="field">
                <label>{text.driverNumber}</label>

                <input
                  value={editDriverNumber}
                  onChange={(event) =>
                    setEditDriverNumber(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className="field">
                <label>{text.fullName}</label>

                <input
                  value={editFullName}
                  onChange={(event) =>
                    setEditFullName(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className="field">
                <label>{text.companyRequired}</label>

                <select
                  value={editCompanyId}
                  onChange={(event) =>
                    setEditCompanyId(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                >
                  <option value="">
                    {text.selectCompany}
                  </option>

                  {companies.map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{text.phone}</label>

                <input
                  value={editPhone}
                  onChange={(event) =>
                    setEditPhone(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div className="field">
                <label>{isES ? "Email" : "Email"}</label>

                <input
                  type="email"
                  value={editEmail}
                  onChange={(event) =>
                    setEditEmail(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                 placeholder={isES ? "conductor@ejemplo.com" : "driver@example.com"}
                />
              </div>

              <div className="field">
                <label>{text.licenseNumber}</label>

                <input
                  value={editLicenseNumber}
                  onChange={(event) =>
                    setEditLicenseNumber(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                  placeholder={isES ? "Número de licencia" : "License number"}
                />
              </div>

              <div className="field">
                <label>{text.licenseState}</label>

                <input
                  maxLength={2}
                  value={editLicenseState}
                  onChange={(event) =>
                    setEditLicenseState(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                  placeholder={isES ? "FL" : "FL"}
                />
              </div>

              <div className="field">
                <label>{text.licenseExpiration}</label>

                <input
                  type="date"
                  value={editLicenseExpiration}
                  onChange={(event) =>
                    setEditLicenseExpiration(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className="field">
                <label>{text.medicalExpiration}</label>

                <input
                  type="date"
                  value={editMedicalExpiration}
                  onChange={(event) =>
                    setEditMedicalExpiration(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className="field full">
                <label>{text.driverStatus}</label>

                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="editNotice">
              {text.editNotice}
            </div>

            <div className="modalFooter">
              <button
                className="secondaryButton"
                onClick={closeDriverProfile}
                disabled={savingEdit}
              >
                {text.cancel}
              </button>

              <button
                className="primaryButton"
                onClick={saveDriverProfile}
                disabled={savingEdit}
              >
                {savingEdit
                  ? text.saving
                  : text.saveChanges}
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

        .header p,
        .modalHeader p {
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
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.12);
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

        .message.success {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
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
            0 1px 2px rgba(15, 23, 42, 0.03);
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
            0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .toolbar {
          display: flex;
          gap: 12px;
          padding: 18px;
          border-bottom: 1px solid #e2e8f0;
        }

        .search,
        .select,
        .field input,
        .field select {
          width: 100%;
          height: 42px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          padding: 0 12px;
          color: #0f172a;
          font-size: 14px;
          outline: none;
        }

        .search {
          max-width: 460px;
        }

        .select {
          max-width: 190px;
        }

        .search:focus,
        .select:focus,
        .field input:focus,
        .field select:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .field input:disabled,
        .field select:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }

        .tableWrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-align: left;
          padding: 13px 16px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        td {
          padding: 15px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #334155;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: #f8fafc;
        }

        .driverCell {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 800;
        }

        .driverName {
          color: #0f172a;
          font-weight: 750;
        }

        .driverEmail {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 12px;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 750;
          white-space: nowrap;
        }

        .status.active {
          background: #ecfdf5;
          color: #047857;
        }

        .status.available {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status.inactive {
          background: #fff7ed;
          color: #c2410c;
        }

        .status.off {
          background: #f1f5f9;
          color: #64748b;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
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

        .empty {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748b;
        }

        .empty strong {
          color: #0f172a;
          font-size: 15px;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.48);
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
            0 24px 80px rgba(15, 23, 42, 0.24);
        }

        .modalHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
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

        .closeButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 16px;
          padding: 24px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          color: #334155;
          font-size: 12px;
          font-weight: 750;
        }

        .editNotice {
          margin: 0 24px 18px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .modalFooter {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 18px 24px;
          border-top: 1px solid #e2e8f0;
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

        .secondaryButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .page {
            padding: 20px;
          }

          .header {
            flex-direction: column;
          }

          .primaryButton {
            width: 100%;
          }

          .stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .toolbar {
            flex-direction: column;
          }

          .search,
          .select {
            max-width: none;
          }
        }

        @media (max-width: 560px) {
          .page {
            padding: 14px;
          }

          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}