"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "@/lib/LanguageProvider";

type Truck = {
  id: string;
  company_id: string | null;
  unit_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  license_plate: string | null;
  license_state: string | null;
  mileage: number | null;
  status: string | null;
  created_at: string | null;
};

type Trailer = {
  id: string;
  company_id: string | null;
  unit_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  trailer_type: string | null;
  status: string | null;
  created_at: string | null;
};

type Company = {
  id: string;
  name: string;
};

const trailerDb = supabase as any;

const STATUS_OPTIONS = [
  "active",
  "available",
  "maintenance",
  "inactive",
  "out of service",
];

export default function FleetPage() {
  const { language } = useLanguage();
  const isES = language === "ES";

  const text = {
    projectLogistics: isES
      ? "LOGÍSTICA DEL PROYECTO"
      : "PROJECT LOGISTICS",

    fleet: isES ? "Flota" : "Fleet",

    fleetDescription: isES
      ? "Administra camiones, remolques, información de vehículos, millaje, VIN y estado operativo."
      : "Manage trucks, trailers, vehicle information, mileage, VINs and operational status.",

    add: isES ? "Agregar" : "Add",
    truck: isES ? "Camión" : "Truck",
    trailer: isES ? "Remolque" : "Trailer",
    trucks: isES ? "Camiones" : "Trucks",
    trailers: isES ? "Remolques" : "Trailers",

    fleetManagement: isES
      ? "GESTIÓN DE FLOTA"
      : "FLEET MANAGEMENT",

    createNewFleet: isES
      ? "Crear un nuevo"
      : "Create a new fleet",

    vehicle: isES ? "vehículo" : "vehicle",

    messageSuccess: isES ? "✓" : "✓",
    messageError: isES ? "!" : "!",

    totalTrucks: isES ? "TOTAL DE CAMIONES" : "TOTAL TRUCKS",
    totalTrailers: isES ? "TOTAL DE REMOLQUES" : "TOTAL TRAILERS",
    fleetUnits: isES ? "Unidades de flota" : "Fleet units",
    fleetTrailers: isES ? "Remolques de flota" : "Fleet trailers",

    active: isES ? "ACTIVOS" : "ACTIVE",
    currentlyActive: isES ? "Actualmente activos" : "Currently active",

    available: isES ? "DISPONIBLES" : "AVAILABLE",
    readyForDispatch: isES
      ? "Listos para despacho"
      : "Ready for dispatch",

    maintenance: isES ? "MANTENIMIENTO" : "MAINTENANCE",
    serviceRequired: isES
      ? "Servicio requerido"
      : "Service required",

    fleetVehicles: isES ? "Vehículos de flota" : "Fleet Vehicles",
    fleetTrailersTitle: isES
      ? "Remolques de flota"
      : "Fleet Trailers",

    vehicleSingular: isES ? "vehículo" : "vehicle",
    vehiclesSingular: isES ? "vehículo" : "vehicle",
    trailerSingular: isES ? "remolque" : "trailer",

    displayed: isES ? "mostrados" : "displayed",
    inactive: isES ? "inactivos" : "inactive",

    searchTruckPlaceholder: isES
      ? "Buscar unidad, marca, modelo, VIN o placa..."
      : "Search unit, make, model, VIN or plate...",

    searchTrailerPlaceholder: isES
      ? "Buscar unidad, marca, modelo, VIN o tipo..."
      : "Search unit, make, model, VIN or type...",

    allStatuses: isES ? "Todos los estados" : "All Statuses",
    activeStatus: isES ? "Activo" : "Active",
    availableStatus: isES ? "Disponible" : "Available",
    maintenanceStatus: isES ? "Mantenimiento" : "Maintenance",
    inactiveStatus: isES ? "Inactivo" : "Inactive",
    outOfService: isES ? "Fuera de servicio" : "Out of Service",

    refresh: isES ? "Actualizar" : "Refresh",

    loadingFleet: isES
      ? "Cargando flota"
      : "Loading fleet",

    retrievingVehicleInfo: isES
      ? "Obteniendo información del vehículo..."
      : "Retrieving vehicle information...",

    retrievingTrailerInfo: isES
      ? "Obteniendo información del remolque..."
      : "Retrieving trailer information...",

    noTrucksFound: isES
      ? "No se encontraron camiones"
      : "No trucks found",

    noTrailersFound: isES
      ? "No se encontraron remolques"
      : "No trailers found",

    addTruckOrFilter: isES
      ? "Agrega un camión o cambia los filtros."
      : "Add a truck or change your filters.",

    addTrailerOrFilter: isES
      ? "Agrega un remolque o cambia los filtros."
      : "Add a trailer or change your filters.",

    unit: isES ? "UNIDAD" : "UNIT",
    vehicleColumn: isES ? "VEHÍCULO" : "VEHICLE",
    trailerColumn: isES ? "REMOLQUE" : "TRAILER",
    type: isES ? "TIPO" : "TYPE",
    company: isES ? "EMPRESA" : "COMPANY",
    vin: isES ? "VIN" : "VIN",
    plate: isES ? "PLACA" : "PLATE",
    mileage: isES ? "MILLAJE" : "MILEAGE",
    status: isES ? "ESTADO" : "STATUS",
    created: isES ? "CREADO" : "CREATED",
    action: isES ? "ACCIÓN" : "ACTION",

    view: isES ? "Ver" : "View",
    noUnit: isES ? "Sin unidad" : "No Unit",
    yearNA: isES ? "Año N/D" : "Year N/A",
    unknown: isES ? "Desconocido" : "Unknown",

    addTruck: isES ? "Agregar camión" : "Add Truck",
    addTrailer: isES ? "Agregar remolque" : "Add Trailer",

    createTruck: isES ? "Crear camión" : "Create Truck",
    createTrailer: isES
      ? "Crear remolque"
      : "Create Trailer",

    creating: isES ? "Creando..." : "Creating...",

    createNewTruck: isES
      ? "Crear un nuevo camión."
      : "Create a new fleet vehicle.",

    createNewTrailer: isES
      ? "Crear un nuevo remolque."
      : "Create a new fleet trailer.",

    cancel: isES ? "Cancelar" : "Cancel",
    close: isES ? "Cerrar" : "Close",
    edit: isES ? "Editar" : "Edit",

    fleetProfile: isES
      ? "PERFIL DE FLOTA"
      : "FLEET PROFILE",

    trailerProfile: isES
      ? "PERFIL DEL REMOLQUE"
      : "TRAILER PROFILE",

    trailerUnitNumber: isES
      ? "Número de unidad del remolque"
      : "Trailer unit number",

    unitNumber: isES ? "Número de unidad" : "Unit Number",
    year: isES ? "Año" : "Year",
    make: isES ? "Marca" : "Make",
    model: isES ? "Modelo" : "Model",
    licensePlate: isES ? "Placa" : "License Plate",
    licenseState: isES
      ? "Estado de la placa"
      : "License State",

    trailerType: isES ? "Tipo de remolque" : "Trailer Type",

    operationalStatus: isES
      ? "Estado operativo"
      : "Operational Status",

    saving: isES ? "Guardando..." : "Saving...",
    saveChanges: isES ? "Guardar cambios" : "Save Changes",

    selectCompany: isES
      ? "Seleccionar empresa"
      : "Select company",

    unitNumberRequired: isES
      ? "El número de unidad es obligatorio."
      : "Unit number is required.",

    trailerUnitRequired: isES
      ? "El número de unidad del remolque es obligatorio."
      : "Trailer unit number is required.",

    companyRequired: isES
      ? "La empresa es obligatoria."
      : "Company is required.",

    validVehicleYear: isES
      ? "Introduce un año válido para el vehículo."
      : "Please enter a valid vehicle year.",

    validTrailerYear: isES
      ? "Introduce un año válido para el remolque."
      : "Please enter a valid trailer year.",

    validMileage: isES
      ? "Introduce un millaje válido."
      : "Please enter valid mileage.",

    sessionExpired: isES
      ? "Tu sesión ha expirado. Inicia sesión nuevamente."
      : "Your session has expired. Please log in again.",

    identifyCompany: isES
      ? "No se pudo identificar tu empresa."
      : "Could not identify your company.",

    companyUnavailable: isES
      ? "La empresa seleccionada no está disponible."
      : "Selected company is not available.",

    unexpectedTruckUpdate: isES
      ? "Ocurrió un error inesperado al actualizar el camión."
      : "An unexpected error occurred while updating the truck.",

    unexpectedTrailerUpdate: isES
      ? "Ocurrió un error inesperado al actualizar el remolque."
      : "An unexpected error occurred while updating the trailer.",

    unexpectedTruckCreate: isES
      ? "Ocurrió un error inesperado al crear el camión."
      : "An unexpected error occurred while creating the truck.",

    unexpectedTrailerCreate: isES
      ? "Ocurrió un error inesperado al crear el remolque."
      : "An unexpected error occurred while creating the trailer.",

    truckUpdated: isES
      ? "se actualizó correctamente."
      : "was updated successfully.",

    trailerUpdated: isES
      ? "se actualizó correctamente."
      : "was updated successfully.",

    truckCreated: isES
      ? "se creó correctamente."
      : "was created successfully.",

    trailerCreated: isES
      ? "se creó correctamente."
      : "was created successfully.",

    truckStatusUpdated: isES
      ? "El estado del camión se actualizó correctamente."
      : "Truck status updated successfully.",

    trailerStatusUpdated: isES
      ? "El estado del remolque se actualizó correctamente."
      : "Trailer status updated successfully.",
  };

  const [activeTab, setActiveTab] =
    useState<"trucks" | "trailers">("trucks");

  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedTruck, setSelectedTruck] =
    useState<Truck | null>(null);

  const [selectedTrailer, setSelectedTrailer] =
    useState<Trailer | null>(null);

  const [editingTruck, setEditingTruck] =
    useState(false);

  const [editingTrailer, setEditingTrailer] =
    useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [unitNumber, setUnitNumber] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [mileage, setMileage] = useState("");
  const [companyId, setCompanyId] = useState("");

  const [trailerUnitNumber, setTrailerUnitNumber] =
    useState("");
  const [trailerYear, setTrailerYear] = useState("");
  const [trailerMake, setTrailerMake] = useState("");
  const [trailerModel, setTrailerModel] = useState("");
  const [trailerVin, setTrailerVin] = useState("");
  const [trailerType, setTrailerType] = useState("");
  const [trailerCompanyId, setTrailerCompanyId] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [
      trucksResult,
      trailersResult,
      companiesResult,
    ] = await Promise.all([
      supabase
        .from("trucks")
        .select(
          "id,company_id,unit_number,year,make,model,vin,license_plate,license_state,mileage,status,created_at"
        )
        .order("created_at", {
          ascending: false,
        }),

      trailerDb
        .from("trailers")
        .select(
          "id,company_id,unit_number,year,make,model,vin,trailer_type,status,created_at"
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("companies")
        .select("id,name")
        .order("name", {
          ascending: true,
        }),
    ]);

    if (trucksResult.error) {
      showMessage(
        trucksResult.error.message,
        "error"
      );
    } else {
      setTrucks((trucksResult.data || []) as Truck[]);
    }

    if (trailersResult.error) {
      console.error(
        "Load trailers error:",
        trailersResult.error
      );
    } else {
      setTrailers((trailersResult.data || []) as Trailer[]);
    }

    if (companiesResult.error) {
      console.error(
        "Load companies error:",
        companiesResult.error
      );
    } else {
      const loadedCompanies =
        (companiesResult.data || []) as Company[];

      setCompanies(loadedCompanies);

      if (
        !companyId &&
        loadedCompanies.length > 0
      ) {
        setCompanyId(loadedCompanies[0].id);
      }

      if (
        !trailerCompanyId &&
        loadedCompanies.length > 0
      ) {
        setTrailerCompanyId(
          loadedCompanies[0].id
        );
      }
    }

    setLoading(false);
  }

  function showMessage(
    value: string,
    type: "success" | "error"
  ) {
    setMessage(value);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function openAddModal() {
    if (activeTab === "trucks") {
      setUnitNumber("");
      setYear("");
      setMake("");
      setModel("");
      setVin("");
      setLicensePlate("");
      setLicenseState("");
      setMileage("");

      setCompanyId(
        companies.length > 0
          ? companies[0].id
          : ""
      );
    } else {
      setTrailerUnitNumber("");
      setTrailerYear("");
      setTrailerMake("");
      setTrailerModel("");
      setTrailerVin("");
      setTrailerType("");

      setTrailerCompanyId(
        companies.length > 0
          ? companies[0].id
          : ""
      );
    }

    setShowAddModal(true);
  }

  function closeAddModal() {
    if (!saving) {
      setShowAddModal(false);
    }
  }

  function openTruckProfile(truck: Truck) {
    setSelectedTruck(truck);
    setEditingTruck(false);
  }

  function openTrailerProfile(trailer: Trailer) {
    setSelectedTrailer(trailer);
    setEditingTrailer(false);
  }

  function startTruckEdit() {
    if (!selectedTruck) return;

    setUnitNumber(selectedTruck.unit_number || "");

    setYear(
      selectedTruck.year !== null &&
      selectedTruck.year !== undefined
        ? String(selectedTruck.year)
        : ""
    );

    setMake(selectedTruck.make || "");
    setModel(selectedTruck.model || "");
    setVin(selectedTruck.vin || "");

    setLicensePlate(
      selectedTruck.license_plate || ""
    );

    setLicenseState(
      selectedTruck.license_state || ""
    );

    setMileage(
      selectedTruck.mileage !== null &&
      selectedTruck.mileage !== undefined
        ? String(selectedTruck.mileage)
        : ""
    );

    setCompanyId(selectedTruck.company_id || "");

    setEditingTruck(true);
  }

  function startTrailerEdit() {
    if (!selectedTrailer) return;

    setTrailerUnitNumber(
      selectedTrailer.unit_number || ""
    );

    setTrailerYear(
      selectedTrailer.year !== null &&
      selectedTrailer.year !== undefined
        ? String(selectedTrailer.year)
        : ""
    );

    setTrailerMake(selectedTrailer.make || "");
    setTrailerModel(selectedTrailer.model || "");
    setTrailerVin(selectedTrailer.vin || "");
    setTrailerType(
      selectedTrailer.trailer_type || ""
    );

    setTrailerCompanyId(
      selectedTrailer.company_id || ""
    );

    setEditingTrailer(true);
  }

  function cancelTruckEdit() {
    setEditingTruck(false);
  }

  function cancelTrailerEdit() {
    setEditingTrailer(false);
  }

  async function saveTruckChanges() {
    if (!selectedTruck) return;

    if (!unitNumber.trim()) {
      showMessage(
        text.unitNumberRequired,
        "error"
      );
      return;
    }

    if (!companyId) {
      showMessage(
        text.companyRequired,
        "error"
      );
      return;
    }

    const parsedYear =
      year.trim() !== ""
        ? Number(year)
        : null;

    const parsedMileage =
      mileage.trim() !== ""
        ? Number(mileage)
        : null;

    if (
      parsedYear !== null &&
      (!Number.isFinite(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > 2100)
    ) {
      showMessage(
        text.validVehicleYear,
        "error"
      );
      return;
    }

    if (
      parsedMileage !== null &&
      (!Number.isFinite(parsedMileage) ||
        parsedMileage < 0)
    ) {
      showMessage(
        text.validMileage,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("trucks")
        .update({
          company_id: companyId,
          unit_number: unitNumber.trim(),
          year: parsedYear,
          make: make.trim() || null,
          model: model.trim() || null,
          vin: vin.trim().toUpperCase() || null,
          license_plate:
            licensePlate.trim().toUpperCase() ||
            null,
          license_state:
            licenseState.trim().toUpperCase() ||
            null,
          mileage: parsedMileage,
        })
        .eq("id", selectedTruck.id)
        .select(
          "id,company_id,unit_number,year,make,model,vin,license_plate,license_state,mileage,status,created_at"
        )
        .single();

      if (error) {
        showMessage(
          error.message ||
            (isES
              ? "No se pudo actualizar el camión."
              : "Could not update truck."),
          "error"
        );
        return;
      }

      const updatedTruck = data as Truck;

      setTrucks((current) =>
        current.map((truck) =>
          truck.id === updatedTruck.id
            ? updatedTruck
            : truck
        )
      );

      setSelectedTruck(updatedTruck);
      setEditingTruck(false);

      showMessage(
        `${text.truck} ${
          updatedTruck.unit_number || ""
        } ${text.truckUpdated}`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        text.unexpectedTruckUpdate,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveTrailerChanges() {
    if (!selectedTrailer) return;

    if (!trailerUnitNumber.trim()) {
      showMessage(
        text.trailerUnitRequired,
        "error"
      );
      return;
    }

    if (!trailerCompanyId) {
      showMessage(
        text.companyRequired,
        "error"
      );
      return;
    }

    const parsedYear =
      trailerYear.trim() !== ""
        ? Number(trailerYear)
        : null;

    if (
      parsedYear !== null &&
      (!Number.isFinite(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > 2100)
    ) {
      showMessage(
        text.validTrailerYear,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await trailerDb
        .from("trailers")
        .update({
          company_id: trailerCompanyId,
          unit_number:
            trailerUnitNumber.trim(),
          year: parsedYear,
          make:
            trailerMake.trim() || null,
          model:
            trailerModel.trim() || null,
          vin:
            trailerVin.trim().toUpperCase() ||
            null,
          trailer_type:
            trailerType.trim() || null,
        })
        .eq("id", selectedTrailer.id)
        .select(
          "id,company_id,unit_number,year,make,model,vin,trailer_type,status,created_at"
        )
        .single();

      if (error) {
        showMessage(
          error.message ||
            (isES
              ? "No se pudo actualizar el remolque."
              : "Could not update trailer."),
          "error"
        );
        return;
      }

      const updatedTrailer =
        data as Trailer;

      setTrailers((current) =>
        current.map((trailer) =>
          trailer.id === updatedTrailer.id
            ? updatedTrailer
            : trailer
        )
      );

      setSelectedTrailer(updatedTrailer);
      setEditingTrailer(false);

      showMessage(
        `${text.trailer} ${
          updatedTrailer.unit_number || ""
        } ${text.trailerUpdated}`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        text.unexpectedTrailerUpdate,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createTruck() {
    if (!unitNumber.trim()) {
      showMessage(
        text.unitNumberRequired,
        "error"
      );
      return;
    }

    if (!companyId) {
      showMessage(
        text.companyRequired,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const { data: authData } =
        await supabase.auth.getUser();

      if (!authData.user) {
        showMessage(
          text.sessionExpired,
          "error"
        );
        return;
      }

      const {
        data: userProfile,
        error: userError,
      } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (userError) {
        showMessage(
          userError.message,
          "error"
        );
        return;
      }

      if (!userProfile?.company_id) {
        showMessage(
          text.identifyCompany,
          "error"
        );
        return;
      }

      if (
        !companies.some(
          (company) =>
            company.id === companyId
        )
      ) {
        showMessage(
          text.companyUnavailable,
          "error"
        );
        return;
      }

      const parsedYear =
        year.trim() !== ""
          ? Number(year)
          : null;

      const parsedMileage =
        mileage.trim() !== ""
          ? Number(mileage)
          : null;

      if (
        parsedYear !== null &&
        (!Number.isFinite(parsedYear) ||
          parsedYear < 1900 ||
          parsedYear > 2100)
      ) {
        showMessage(
          text.validVehicleYear,
          "error"
        );
        return;
      }

      if (
        parsedMileage !== null &&
        (!Number.isFinite(parsedMileage) ||
          parsedMileage < 0)
      ) {
        showMessage(
          text.validMileage,
          "error"
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("trucks")
        .insert({
          company_id: companyId,
          unit_number: unitNumber.trim(),
          year: parsedYear,
          make: make.trim() || null,
          model: model.trim() || null,
          vin: vin.trim().toUpperCase() || null,
          license_plate:
            licensePlate.trim().toUpperCase() ||
            null,
          license_state:
            licenseState.trim().toUpperCase() ||
            null,
          mileage: parsedMileage,
          status: "active",
        })
        .select(
          "id,company_id,unit_number,year,make,model,vin,license_plate,license_state,mileage,status,created_at"
        )
        .single();

      if (error) {
        showMessage(
          error.message ||
            (isES
              ? "No se pudo crear el camión."
              : "Could not create truck."),
          "error"
        );
        return;
      }

      setTrucks((current) => [
        data as Truck,
        ...current,
      ]);

      setShowAddModal(false);

      showMessage(
        `${text.truck} ${
          data.unit_number || ""
        } ${text.truckCreated}`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        text.unexpectedTruckCreate,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createTrailer() {
    if (!trailerUnitNumber.trim()) {
      showMessage(
        text.trailerUnitRequired,
        "error"
      );
      return;
    }

    if (!trailerCompanyId) {
      showMessage(
        text.companyRequired,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const { data: authData } =
        await supabase.auth.getUser();

      if (!authData.user) {
        showMessage(
          text.sessionExpired,
          "error"
        );
        return;
      }

      const {
        data: userProfile,
        error: userError,
      } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (userError) {
        showMessage(
          userError.message,
          "error"
        );
        return;
      }

      if (!userProfile?.company_id) {
        showMessage(
          text.identifyCompany,
          "error"
        );
        return;
      }

      if (
        !companies.some(
          (company) =>
            company.id === trailerCompanyId
        )
      ) {
        showMessage(
          text.companyUnavailable,
          "error"
        );
        return;
      }

      const parsedYear =
        trailerYear.trim() !== ""
          ? Number(trailerYear)
          : null;

      if (
        parsedYear !== null &&
        (!Number.isFinite(parsedYear) ||
          parsedYear < 1900 ||
          parsedYear > 2100)
      ) {
        showMessage(
          text.validTrailerYear,
          "error"
        );
        return;
      }

      const {
        data,
        error,
      } = await trailerDb
        .from("trailers")
        .insert({
          company_id: trailerCompanyId,
          unit_number:
            trailerUnitNumber.trim(),
          year: parsedYear,
          make:
            trailerMake.trim() || null,
          model:
            trailerModel.trim() || null,
          vin:
            trailerVin.trim().toUpperCase() ||
            null,
          trailer_type:
            trailerType.trim() || null,
          status: "available",
        })
        .select(
          "id,company_id,unit_number,year,make,model,vin,trailer_type,status,created_at"
        )
        .single();

      if (error) {
        showMessage(
          error.message ||
            (isES
              ? "No se pudo crear el remolque."
              : "Could not create trailer."),
          "error"
        );
        return;
      }

      setTrailers((current) => [
        data as Trailer,
        ...current,
      ]);

      setShowAddModal(false);

      showMessage(
        `${text.trailer} ${
          data.unit_number || ""
        } ${text.trailerCreated}`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        text.unexpectedTrailerCreate,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    truckId: string,
    status: string
  ) {
    const { error } =
      await supabase
        .from("trucks")
        .update({ status })
        .eq("id", truckId);

    if (error) {
      showMessage(
        error.message,
        "error"
      );
      return;
    }

    setTrucks((current) =>
      current.map((truck) =>
        truck.id === truckId
          ? { ...truck, status }
          : truck
      )
    );

    setSelectedTruck((current) =>
      current
        ? { ...current, status }
        : current
    );

    showMessage(
      text.truckStatusUpdated,
      "success"
    );
  }

  async function updateTrailerStatus(
    trailerId: string,
    status: string
  ) {
    const { error } =
      await trailerDb
        .from("trailers")
        .update({ status })
        .eq("id", trailerId);

    if (error) {
      showMessage(
        error.message,
        "error"
      );
      return;
    }

    setTrailers((current) =>
      current.map((trailer) =>
        trailer.id === trailerId
          ? { ...trailer, status }
          : trailer
      )
    );

    setSelectedTrailer((current) =>
      current
        ? { ...current, status }
        : current
    );

    showMessage(
      text.trailerStatusUpdated,
      "success"
    );
  }

  const filteredTrucks = useMemo(() => {
    const term = search.toLowerCase().trim();

    return trucks.filter((truck) => {
      const matchesSearch =
        !term ||
        (truck.unit_number || "")
          .toLowerCase()
          .includes(term) ||
        (truck.make || "")
          .toLowerCase()
          .includes(term) ||
        (truck.model || "")
          .toLowerCase()
          .includes(term) ||
        (truck.vin || "")
          .toLowerCase()
          .includes(term) ||
        (truck.license_plate || "")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (truck.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [trucks, search, statusFilter]);

  const filteredTrailers = useMemo(() => {
    const term = search.toLowerCase().trim();

    return trailers.filter((trailer) => {
      const matchesSearch =
        !term ||
        (trailer.unit_number || "")
          .toLowerCase()
          .includes(term) ||
        (trailer.make || "")
          .toLowerCase()
          .includes(term) ||
        (trailer.model || "")
          .toLowerCase()
          .includes(term) ||
        (trailer.vin || "")
          .toLowerCase()
          .includes(term) ||
        (trailer.trailer_type || "")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (trailer.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [trailers, search, statusFilter]);

  const activeTrucks = trucks.filter(
    (truck) =>
      (truck.status || "").toLowerCase() ===
      "active"
  ).length;

  const availableTrucks = trucks.filter(
    (truck) =>
      (truck.status || "").toLowerCase() ===
      "available"
  ).length;

  const maintenanceTrucks = trucks.filter(
    (truck) =>
      (truck.status || "").toLowerCase() ===
      "maintenance"
  ).length;

  const inactiveTrucks = trucks.filter(
    (truck) =>
      (truck.status || "").toLowerCase() ===
      "inactive"
  ).length;

  const activeTrailers = trailers.filter(
    (trailer) =>
      (trailer.status || "").toLowerCase() ===
      "active"
  ).length;

  const availableTrailers = trailers.filter(
    (trailer) =>
      (trailer.status || "").toLowerCase() ===
      "available"
  ).length;

  const maintenanceTrailers = trailers.filter(
    (trailer) =>
      (trailer.status || "").toLowerCase() ===
      "maintenance"
  ).length;

  const inactiveTrailers = trailers.filter(
    (trailer) =>
      (trailer.status || "").toLowerCase() ===
      "inactive"
  ).length;

  function companyName(id: string | null) {
    if (!id) return "—";

    return (
      companies.find(
        (company) => company.id === id
      )?.name || "—"
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function formatMileage(value: number | null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return `${value.toLocaleString()} mi`;
  }

  function statusClass(status: string | null) {
    const value = (status || "").toLowerCase();

    if (value === "active")
      return "status active";

    if (value === "available")
      return "status available";

    if (value === "maintenance")
      return "status maintenance";

    if (
      value === "inactive" ||
      value === "out of service"
    ) {
      return "status inactive";
    }

    return "status neutral";
  }

  function statusLabel(status: string | null) {
    if (!status) return isES ? "Desconocido" : "Unknown";

    if (
      status.toLowerCase() ===
      "out of service"
    ) {
      return text.outOfService;
    }

    switch (status.toLowerCase()) {
      case "active":
        return text.activeStatus;
      case "available":
        return text.availableStatus;
      case "maintenance":
        return text.maintenanceStatus;
      case "inactive":
        return text.inactiveStatus;
      default:
        return (
          status.charAt(0).toUpperCase() +
          status.slice(1)
        );
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <div className="headerContent">
            <div className="eyebrow">
              {text.projectLogistics}
            </div>

            <h1>{text.fleet}</h1>

            <p>{text.fleetDescription}</p>
          </div>

          <button
            className="primaryButton"
            onClick={openAddModal}
          >
            <span className="buttonPlus">+</span>
            {text.add}{" "}
            {activeTab === "trucks"
              ? text.truck
              : text.trailer}
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
            <span>
              {messageType === "success"
                ? text.messageSuccess
                : text.messageError}
            </span>

            {message}
          </div>
        )}

        <div className="tabs">
          <button
            className={
              activeTab === "trucks"
                ? "tab active"
                : "tab"
            }
            onClick={() => {
              setActiveTab("trucks");
              setSearch("");
              setStatusFilter("all");
              setSelectedTrailer(null);
              setEditingTrailer(false);
            }}
          >
            <span className="tabIcon">🚛</span>
            {text.trucks}
          </button>

          <button
            className={
              activeTab === "trailers"
                ? "tab active"
                : "tab"
            }
            onClick={() => {
              setActiveTab("trailers");
              setSearch("");
              setStatusFilter("all");
              setSelectedTruck(null);
              setEditingTruck(false);
            }}
          >
            <span className="tabIcon">▰</span>
            {text.trailers}
          </button>
        </div>

        {activeTab === "trucks" ? (
          <>
            <section className="stats">
              <Stat
                label={text.totalTrucks}
                value={trucks.length}
                text={text.fleetUnits}
              />

              <Stat
                label={text.active}
                value={activeTrucks}
                text={text.currentlyActive}
              />

              <Stat
                label={text.available}
                value={availableTrucks}
                text={text.readyForDispatch}
              />

              <Stat
                label={text.maintenance}
                value={maintenanceTrucks}
                text={text.serviceRequired}
              />
            </section>

            <section className="panel">
              <PanelHeader
                title={text.fleetVehicles}
                count={filteredTrucks.length}
                singular={text.vehicleSingular}
                inactive={inactiveTrucks}
                isES={isES}
                labels={{
                  displayed: text.displayed,
                  inactive: text.inactive,
                }}
              />

              <Toolbar
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                placeholder={text.searchTruckPlaceholder}
                onRefresh={loadData}
                isES={isES}
              />

              {loading ? (
                <div className="empty">
                  <div className="loadingSpinner" />
                  <strong>
                    {text.loadingFleet}
                  </strong>
                  <span>
                    {text.retrievingVehicleInfo}
                  </span>
                </div>
              ) : filteredTrucks.length === 0 ? (
                <div className="empty">
                  <div className="emptyIcon">
                    🚛
                  </div>

                  <strong>
                    {text.noTrucksFound}
                  </strong>

                  <span>
                    {text.addTruckOrFilter}
                  </span>
                </div>
              ) : (
                <div className="tableWrap">
                  <table className="fleetTable truckTable">
                    <thead>
                      <tr>
                        <th>{text.unit}</th>
                        <th>
                          {text.vehicleColumn}
                        </th>
                        <th>{text.company}</th>
                        <th>{text.vin}</th>
                        <th>{text.plate}</th>
                        <th>{text.mileage}</th>
                        <th>{text.status}</th>
                        <th>{text.action}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTrucks.map(
                        (truck) => (
                          <tr key={truck.id}>
                            <td>
                              <div className="unitCell">
                                <div className="truckIcon">
                                  🚛
                                </div>

                                <div className="unitInfo">
                                  <strong>
                                    {truck.unit_number ||
                                      text.noUnit}
                                  </strong>

                                  <small>
                                    {truck.year ||
                                      text.yearNA}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="vehicleInfo">
                                <strong>
                                  {truck.make ||
                                    text.unknown}
                                </strong>

                                <span>
                                  {truck.model || "—"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="companyText">
                                {companyName(
                                  truck.company_id
                                )}
                              </span>
                            </td>

                            <td>
                              <span className="mono vinText">
                                {truck.vin || "—"}
                              </span>
                            </td>

                            <td>
                              <span className="plateText">
                                {truck.license_plate
                                  ? `${truck.license_plate}${
                                      truck.license_state
                                        ? ` (${truck.license_state})`
                                        : ""
                                    }`
                                  : "—"}
                              </span>
                            </td>

                            <td>
                              <span className="mileageText">
                                {formatMileage(
                                  truck.mileage
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                className={statusClass(
                                  truck.status
                                )}
                              >
                                <span className="dot" />
                                {statusLabel(
                                  truck.status
                                )}
                              </span>
                            </td>

                            <td>
                              <button
                                className="viewButton"
                                onClick={() =>
                                  openTruckProfile(
                                    truck
                                  )
                                }
                              >
                                {text.view}
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="stats">
              <Stat
                label={text.totalTrailers}
                value={trailers.length}
                text={text.fleetTrailers}
              />

              <Stat
                label={text.active}
                value={activeTrailers}
                text={text.currentlyActive}
              />

              <Stat
                label={text.available}
                value={availableTrailers}
                text={text.readyForDispatch}
              />

              <Stat
                label={text.maintenance}
                value={maintenanceTrailers}
                text={text.serviceRequired}
              />
            </section>

            <section className="panel">
              <PanelHeader
                title={text.fleetTrailersTitle}
                count={filteredTrailers.length}
                singular={text.trailerSingular}
                inactive={inactiveTrailers}
                isES={isES}
                labels={{
                  displayed: text.displayed,
                  inactive: text.inactive,
                }}
              />

              <Toolbar
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                placeholder={text.searchTrailerPlaceholder}
                onRefresh={loadData}
                isES={isES}
              />

              {loading ? (
                <div className="empty">
                  <div className="loadingSpinner" />

                  <strong>
                    {text.loadingFleet}
                  </strong>

                  <span>
                    {text.retrievingTrailerInfo}
                  </span>
                </div>
              ) : filteredTrailers.length === 0 ? (
                <div className="empty">
                  <div className="emptyIcon">
                    ▰
                  </div>

                  <strong>
                    {text.noTrailersFound}
                  </strong>

                  <span>
                    {text.addTrailerOrFilter}
                  </span>
                </div>
              ) : (
                <div className="tableWrap">
                  <table className="fleetTable trailerTable">
                    <thead>
                      <tr>
                        <th>{text.unit}</th>
                        <th>
                          {text.trailerColumn}
                        </th>
                        <th>{text.type}</th>
                        <th>{text.company}</th>
                        <th>{text.vin}</th>
                        <th>{text.status}</th>
                        <th>{text.created}</th>
                        <th>{text.action}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTrailers.map(
                        (trailer) => (
                          <tr key={trailer.id}>
                            <td>
                              <div className="unitCell">
                                <div className="trailerIcon">
                                  ▰
                                </div>

                                <div className="unitInfo">
                                  <strong>
                                    {trailer.unit_number ||
                                      text.noUnit}
                                  </strong>

                                  <small>
                                    {trailer.year ||
                                      text.yearNA}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="vehicleInfo">
                                <strong>
                                  {trailer.make ||
                                    text.unknown}
                                </strong>

                                <span>
                                  {trailer.model ||
                                    "—"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="companyText">
                                {trailer.trailer_type ||
                                  "—"}
                              </span>
                            </td>

                            <td>
                              <span className="companyText">
                                {companyName(
                                  trailer.company_id
                                )}
                              </span>
                            </td>

                            <td>
                              <span className="mono vinText">
                                {trailer.vin || "—"}
                              </span>
                            </td>

                            <td>
                              <span
                                className={statusClass(
                                  trailer.status
                                )}
                              >
                                <span className="dot" />
                                {statusLabel(
                                  trailer.status
                                )}
                              </span>
                            </td>

                            <td>
                              <span className="dateText">
                                {formatDate(
                                  trailer.created_at
                                )}
                              </span>
                            </td>

                            <td>
                              <button
                                className="viewButton"
                                onClick={() =>
                                  openTrailerProfile(
                                    trailer
                                  )
                                }
                              >
                                {text.view}
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showAddModal && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddModal();
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  {text.fleetManagement}
                </div>

                <h2>
                  {text.add}{" "}
                  {activeTab === "trucks"
                    ? text.truck
                    : text.trailer}
                </h2>

                <p>
                  {isES
                    ? `Crear un nuevo ${
                        activeTab === "trucks"
                          ? "vehículo"
                          : "remolque"
                      } de flota.`
                    : `Create a new fleet ${
                        activeTab === "trucks"
                          ? "vehicle"
                          : "trailer"
                      }.`}
                </p>
              </div>

              <button
                className="closeButton"
                onClick={closeAddModal}
              >
                ×
              </button>
            </div>

            {activeTab === "trucks" ? (
              <TruckForm
                unitNumber={unitNumber}
                setUnitNumber={setUnitNumber}
                companyId={companyId}
                setCompanyId={setCompanyId}
                year={year}
                setYear={setYear}
                make={make}
                setMake={setMake}
                model={model}
                setModel={setModel}
                mileage={mileage}
                setMileage={setMileage}
                vin={vin}
                setVin={setVin}
                licensePlate={licensePlate}
                setLicensePlate={setLicensePlate}
                licenseState={licenseState}
                setLicenseState={setLicenseState}
                companies={companies}
                text={text}
              />
            ) : (
              <TrailerForm
                unitNumber={trailerUnitNumber}
                setUnitNumber={setTrailerUnitNumber}
                companyId={trailerCompanyId}
                setCompanyId={setTrailerCompanyId}
                year={trailerYear}
                setYear={setTrailerYear}
                make={trailerMake}
                setMake={setTrailerMake}
                model={trailerModel}
                setModel={setTrailerModel}
                trailerType={trailerType}
                setTrailerType={setTrailerType}
                vin={trailerVin}
                setVin={setTrailerVin}
                companies={companies}
                text={text}
              />
            )}

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
                onClick={
                  activeTab === "trucks"
                    ? createTruck
                    : createTrailer
                }
                disabled={saving}
              >
                {saving
                  ? text.creating
                  : activeTab === "trucks"
                  ? text.createTruck
                  : text.createTrailer}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTruck && (
        <ProfileModal
          title={text.fleetProfile}
          unit={selectedTruck.unit_number}
          subtitle={`${selectedTruck.year || ""} ${
            selectedTruck.make || ""
          } ${selectedTruck.model || ""}`}
          onClose={() => {
            if (!saving) {
              setSelectedTruck(null);
              setEditingTruck(false);
            }
          }}
          editing={editingTruck}
          saving={saving}
          onEdit={startTruckEdit}
          onCancel={cancelTruckEdit}
          onSave={saveTruckChanges}
          editForm={
            <TruckForm
              unitNumber={unitNumber}
              setUnitNumber={setUnitNumber}
              companyId={companyId}
              setCompanyId={setCompanyId}
              year={year}
              setYear={setYear}
              make={make}
              setMake={setMake}
              model={model}
              setModel={setModel}
              mileage={mileage}
              setMileage={setMileage}
              vin={vin}
              setVin={setVin}
              licensePlate={licensePlate}
              setLicensePlate={setLicensePlate}
              licenseState={licenseState}
              setLicenseState={setLicenseState}
              companies={companies}
              text={text}
            />
          }
          fields={[
            [
              text.company,
              companyName(
                selectedTruck.company_id
              ),
            ],
            [
              text.unitNumber,
              selectedTruck.unit_number || "—",
            ],
            [
              text.year,
              selectedTruck.year?.toString() || "—",
            ],
            [text.make, selectedTruck.make || "—"],
            [text.model, selectedTruck.model || "—"],
            [
              text.mileage,
              formatMileage(
                selectedTruck.mileage
              ),
            ],
            [text.vin, selectedTruck.vin || "—"],
            [
              text.licensePlate,
              selectedTruck.license_plate || "—",
            ],
            [
              text.licenseState,
              selectedTruck.license_state || "—",
            ],
            [
              text.created,
              formatDate(
                selectedTruck.created_at
              ),
            ],
          ]}
          status={selectedTruck.status}
          onStatus={(status) =>
            updateStatus(selectedTruck.id, status)
          }
          text={text}
        />
      )}

      {selectedTrailer && (
        <ProfileModal
          title={text.trailerProfile}
          unit={selectedTrailer.unit_number}
          subtitle={`${selectedTrailer.year || ""} ${
            selectedTrailer.make || ""
          } ${selectedTrailer.model || ""}`}
          onClose={() => {
            if (!saving) {
              setSelectedTrailer(null);
              setEditingTrailer(false);
            }
          }}
          editing={editingTrailer}
          saving={saving}
          onEdit={startTrailerEdit}
          onCancel={cancelTrailerEdit}
          onSave={saveTrailerChanges}
          editForm={
            <TrailerForm
              unitNumber={trailerUnitNumber}
              setUnitNumber={setTrailerUnitNumber}
              companyId={trailerCompanyId}
              setCompanyId={setTrailerCompanyId}
              year={trailerYear}
              setYear={setTrailerYear}
              make={trailerMake}
              setMake={setTrailerMake}
              model={trailerModel}
              setModel={setTrailerModel}
              trailerType={trailerType}
              setTrailerType={setTrailerType}
              vin={trailerVin}
              setVin={setTrailerVin}
              companies={companies}
              text={text}
            />
          }
          fields={[
            [
              text.company,
              companyName(
                selectedTrailer.company_id
              ),
            ],
            [
              text.unitNumber,
              selectedTrailer.unit_number || "—",
            ],
            [
              text.year,
              selectedTrailer.year?.toString() || "—",
            ],
            [
              text.make,
              selectedTrailer.make || "—",
            ],
            [
              text.model,
              selectedTrailer.model || "—",
            ],
            [
              text.trailerType,
              selectedTrailer.trailer_type || "—",
            ],
            [text.vin, selectedTrailer.vin || "—"],
            [
              text.created,
              formatDate(
                selectedTrailer.created_at
              ),
            ],
          ]}
          status={selectedTrailer.status}
          onStatus={(status) =>
            updateTrailerStatus(
              selectedTrailer.id,
              status
            )
          }
          text={text}
        />
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f4f7fb;
          color: #0f172a;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          padding: 36px 32px 60px;
        }

        .container {
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 32px;
          margin-bottom: 28px;
        }

        .headerContent {
          min-width: 0;
        }

        .eyebrow {
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.14em;
          margin-bottom: 9px;
        }

        h1 {
          margin: 0;
          color: #0f172a;
          font-size: 36px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: -0.045em;
        }

        h2 {
          margin: 0;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.1;
          font-weight: 820;
          letter-spacing: -0.035em;
        }

        .header p,
        .modalHeader p {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .primaryButton {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          background: #2563eb;
          color: #fff;
          border-radius: 9px;
          padding: 0 18px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.16);
          transition:
            background 0.15s ease,
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .primaryButton:hover {
          background: #1d4ed8;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.18);
        }

        .primaryButton:active {
          transform: translateY(1px);
        }

        .primaryButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .buttonPlus {
          font-size: 19px;
          line-height: 1;
          font-weight: 500;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 46px;
          padding: 11px 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 700;
        }

        .message span {
          width: 23px;
          height: 23px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 12px;
          flex: 0 0 23px;
        }

        .message.success {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .message.success span {
          background: #d1fae5;
        }

        .message.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .message.error span {
          background: #fee2e2;
        }

        .tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 24px;
          padding: 4px;
          width: fit-content;
          background: #e9eef5;
          border: 1px solid #dde5ef;
          border-radius: 11px;
        }

        .tab {
          min-width: 125px;
          height: 39px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          padding: 0 18px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 0.15s ease,
            color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .tab:hover {
          color: #0f172a;
        }

        .tab.active {
          color: #0f172a;
          background: #fff;
          box-shadow:
            0 1px 3px rgba(15, 23, 42, 0.08),
            0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .tabIcon {
          font-size: 15px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .statCard {
          min-height: 136px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #fff;
          border: 1px solid #e1e8f0;
          border-radius: 13px;
          padding: 22px 24px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
        }

        .statLabel {
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.1em;
        }

        .statValue {
          margin-top: 9px;
          color: #0f172a;
          font-size: 31px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: -0.045em;
        }

        .statText {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.4;
        }

        .panel {
          background: #fff;
          border: 1px solid #e1e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.025);
        }

        .panelHeader {
          min-height: 78px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 20px 26px;
        }

        .panelTitle {
          color: #0f172a;
          font-size: 16px;
          font-weight: 820;
          letter-spacing: -0.015em;
        }

        .panelSubtitle {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 12px;
        }

        .panelBadge {
          flex: 0 0 auto;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 11px;
          color: #64748b;
          font-size: 11px;
          font-weight: 750;
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 26px 20px;
          border-bottom: 1px solid #e5eaf0;
        }

        .search,
        .select {
          height: 43px;
          border: 1px solid #d3dce7;
          border-radius: 8px;
          background: #fff;
          padding: 0 13px;
          color: #0f172a;
          font-size: 12px;
          outline: none;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .search {
          flex: 1;
          min-width: 220px;
        }

        .search::placeholder {
          color: #a0aec0;
        }

        .select {
          width: 175px;
          flex: 0 0 175px;
        }

        .search:focus,
        .select:focus,
        .field input:focus,
        .field select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
        }

        .refreshButton {
          height: 43px;
          border: 1px solid #d3dce7;
          border-radius: 8px;
          background: #fff;
          padding: 0 16px;
          color: #334155;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .refreshButton:hover {
          background: #f8fafc;
          border-color: #aebccc;
        }

        .tableWrap {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .fleetTable {
          width: 100%;
          min-width: 1240px;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: auto;
        }

        .fleetTable th {
          height: 45px;
          background: #f8fafc;
          color: #64748b;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-align: left;
          padding: 0 24px;
          border-bottom: 1px solid #e5eaf0;
          white-space: nowrap;
        }

        .fleetTable td {
          height: 76px;
          padding: 14px 24px;
          border-bottom: 1px solid #eef2f6;
          font-size: 12px;
          color: #475569;
          vertical-align: middle;
          white-space: nowrap;
        }

        .fleetTable tbody tr:last-child td {
          border-bottom: 0;
        }

        .fleetTable tbody tr {
          transition: background 0.12s ease;
        }

        .fleetTable tbody tr:hover {
          background: #f8fbff;
        }

        .truckTable {
          min-width: 1450px;
        }

        .truckTable th,
        .truckTable td {
          padding-left: 30px;
          padding-right: 30px;
        }

        .truckTable th:nth-child(1),
        .truckTable td:nth-child(1) {
          min-width: 195px;
        }

        .truckTable th:nth-child(2),
        .truckTable td:nth-child(2) {
          min-width: 200px;
        }

        .truckTable th:nth-child(3),
        .truckTable td:nth-child(3) {
          min-width: 190px;
        }

        .truckTable th:nth-child(4),
        .truckTable td:nth-child(4) {
          min-width: 230px;
        }

        .truckTable th:nth-child(5),
        .truckTable td:nth-child(5) {
          min-width: 165px;
        }

        .truckTable th:nth-child(6),
        .truckTable td:nth-child(6) {
          min-width: 150px;
        }

        .truckTable th:nth-child(7),
        .truckTable td:nth-child(7) {
          min-width: 165px;
        }

        .truckTable th:last-child,
        .truckTable td:last-child {
          min-width: 115px;
          padding-left: 30px;
          padding-right: 30px;
        }

        .trailerTable {
          min-width: 1450px;
        }

        .trailerTable th,
        .trailerTable td {
          padding-left: 30px;
          padding-right: 30px;
        }

        .trailerTable th:nth-child(1),
        .trailerTable td:nth-child(1) {
          min-width: 190px;
        }

        .trailerTable th:nth-child(2),
        .trailerTable td:nth-child(2) {
          min-width: 210px;
        }

        .trailerTable th:nth-child(3),
        .trailerTable td:nth-child(3) {
          min-width: 160px;
        }

        .trailerTable th:nth-child(4),
        .trailerTable td:nth-child(4) {
          min-width: 190px;
        }

        .trailerTable th:nth-child(5),
        .trailerTable td:nth-child(5) {
          min-width: 230px;
        }

        .trailerTable th:nth-child(6),
        .trailerTable td:nth-child(6) {
          min-width: 165px;
        }

        .trailerTable th:nth-child(7),
        .trailerTable td:nth-child(7) {
          min-width: 160px;
        }

        .trailerTable th:last-child,
        .trailerTable td:last-child {
          min-width: 115px;
          padding-left: 30px;
          padding-right: 30px;
        }

        .unitCell {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .truckIcon,
        .trailerIcon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eef4ff;
          color: #2563eb;
          font-size: 17px;
        }

        .trailerIcon {
          background: #f1f5f9;
          color: #475569;
        }

        .unitInfo {
          min-width: 90px;
        }

        .unitCell strong {
          display: block;
          color: #0f172a;
          font-size: 13px;
          font-weight: 820;
        }

        .unitCell small {
          display: block;
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
        }

        .vehicleInfo strong {
          display: block;
          color: #0f172a;
          font-size: 12px;
          font-weight: 780;
        }

        .vehicleInfo span {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
        }

        .companyText,
        .plateText,
        .mileageText,
        .dateText {
          color: #475569;
          font-size: 12px;
        }

        .mileageText {
          font-variant-numeric: tabular-nums;
        }

        .mono {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
        }

        .vinText {
          color: #64748b;
          font-size: 10px;
          letter-spacing: 0.015em;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 10px;
          font-weight: 800;
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

        .status.maintenance {
          background: #fffbeb;
          color: #b45309;
        }

        .status.inactive {
          background: #fef2f2;
          color: #b91c1c;
        }

        .status.neutral {
          background: #f1f5f9;
          color: #64748b;
        }

        .dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .viewButton {
          height: 34px;
          border: 1px solid #d1dae5;
          background: #fff;
          color: #334155;
          border-radius: 7px;
          padding: 0 13px;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
        }

        .viewButton:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }

        .empty {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748b;
          text-align: center;
        }

        .empty strong {
          margin-top: 4px;
          color: #0f172a;
          font-size: 14px;
        }

        .empty span {
          color: #94a3b8;
          font-size: 12px;
        }

        .emptyIcon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f1f5f9;
          font-size: 25px;
        }

        .loadingSpinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: fleetSpin 0.8s linear infinite;
        }

        @keyframes fleetSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backdrop-filter: blur(2px);
        }

        .modal {
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          box-shadow:
            0 30px 80px rgba(15, 23, 42, 0.25),
            0 5px 20px rgba(15, 23, 42, 0.08);
        }

        .modalHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 25px 26px;
          border-bottom: 1px solid #e5eaf0;
        }

        .closeButton {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          border: 0;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .closeButton:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          padding: 26px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          color: #334155;
          font-size: 11px;
          font-weight: 800;
        }

        .field input,
        .field select {
          width: 100%;
          height: 44px;
          border: 1px solid #d3dce7;
          border-radius: 8px;
          background: #fff;
          padding: 0 13px;
          color: #0f172a;
          font-size: 13px;
          outline: none;
        }

        .field input::placeholder {
          color: #a0aec0;
        }

        .modalFooter {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          padding: 18px 26px;
          border-top: 1px solid #e5eaf0;
          background: #fafbfd;
        }

        .secondaryButton {
          min-height: 42px;
          border: 1px solid #d1dae5;
          background: #fff;
          color: #334155;
          border-radius: 8px;
          padding: 0 16px;
          font-size: 12px;
          font-weight: 780;
          cursor: pointer;
        }

        .secondaryButton:hover {
          background: #f8fafc;
        }

        .secondaryButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .profile {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
          padding: 26px;
        }

        .infoBox {
          min-height: 68px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 13px 15px;
          background: #fbfcfe;
        }

        .infoBox.full {
          grid-column: 1 / -1;
        }

        .infoBox span {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 7px;
        }

        .infoBox strong {
          color: #0f172a;
          font-size: 12px;
          line-height: 1.4;
          word-break: break-word;
        }

        .statusSection {
          padding: 0 26px 26px;
        }

        .sectionTitle {
          color: #0f172a;
          font-size: 13px;
          font-weight: 820;
          margin-bottom: 11px;
        }

        .statusButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .statusButton {
          border: 1px solid #d1dae5;
          background: #fff;
          color: #475569;
          border-radius: 8px;
          padding: 9px 13px;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            background 0.15s ease,
            color 0.15s ease;
        }

        .statusButton:hover {
          background: #f8fafc;
          border-color: #aebccc;
        }

        .statusButton.selected {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .editButton {
          min-height: 42px;
          border: 1px solid #2563eb;
          background: #fff;
          color: #2563eb;
          border-radius: 8px;
          padding: 0 17px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .editButton:hover {
          background: #eff6ff;
        }

        @media (max-width: 1100px) {
          .page {
            padding: 28px 22px 50px;
          }

          .stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .truckTable {
            min-width: 1280px;
          }

          .trailerTable {
            min-width: 1260px;
          }
        }

        @media (max-width: 760px) {
          .page {
            padding: 20px 15px 40px;
          }

          .header {
            align-items: stretch;
            flex-direction: column;
            gap: 20px;
          }

          h1 {
            font-size: 31px;
          }

          .primaryButton {
            width: 100%;
          }

          .tabs {
            width: 100%;
          }

          .tab {
            flex: 1;
            min-width: 0;
          }

          .stats {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .statCard {
            min-height: 118px;
          }

          .panelHeader {
            align-items: flex-start;
            padding: 18px;
          }

          .toolbar {
            align-items: stretch;
            flex-direction: column;
            padding: 0 18px 18px;
          }

          .search,
          .select {
            width: 100%;
            min-width: 0;
            flex: auto;
          }

          .refreshButton {
            width: 100%;
          }

          .formGrid,
          .profile {
            grid-template-columns: 1fr;
            padding: 20px;
          }

          .field.full,
          .infoBox.full {
            grid-column: auto;
          }

          .modalHeader {
            padding: 20px;
          }

          .modalFooter {
            padding: 16px 20px;
          }

          .statusSection {
            padding: 0 20px 20px;
          }
        }

        @media (max-width: 480px) {
          .page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .tabs {
            padding: 3px;
          }

          .tab {
            height: 37px;
            font-size: 11px;
          }

          .tabIcon {
            font-size: 13px;
          }

          .panelHeader {
            gap: 12px;
          }

          .panelBadge {
            font-size: 10px;
          }

          .modal {
            max-height: 94vh;
            border-radius: 13px;
          }

          .modalFooter {
            flex-direction: column-reverse;
          }

          .modalFooter button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({
  label,
  value,
  text,
}: {
  label: string;
  value: number;
  text: string;
}) {
  return (
    <div className="statCard">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
      <div className="statText">{text}</div>
    </div>
  );
}

function PanelHeader({
  title,
  count,
  singular,
  inactive,
  labels,
}: {
  title: string;
  count: number;
  singular: string;
  inactive: number;
  isES: boolean;
  labels: {
    displayed: string;
    inactive: string;
  };
}) {
  return (
    <div className="panelHeader">
      <div>
        <div className="panelTitle">
          {title}
        </div>

        <div className="panelSubtitle">
          {count} {singular}
          {count === 1 ? "" : "s"}{" "}
          {labels.displayed}
        </div>
      </div>

      <div className="panelBadge">
        {inactive} {labels.inactive}
      </div>
    </div>
  );
}

function Toolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  placeholder,
  onRefresh,
  isES,
}: {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  placeholder: string;
  onRefresh: () => void;
  isES: boolean;
}) {
  return (
    <div className="toolbar">
      <input
        className="search"
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder={placeholder}
      />

      <select
        className="select"
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value)
        }
      >
        <option value="all">
          {isES
            ? "Todos los estados"
            : "All Statuses"}
        </option>

        <option value="active">
          {isES ? "Activo" : "Active"}
        </option>

        <option value="available">
          {isES ? "Disponible" : "Available"}
        </option>

        <option value="maintenance">
          {isES ? "Mantenimiento" : "Maintenance"}
        </option>

        <option value="inactive">
          {isES ? "Inactivo" : "Inactive"}
        </option>

        <option value="out of service">
          {isES
            ? "Fuera de servicio"
            : "Out of Service"}
        </option>
      </select>

      <button
        className="refreshButton"
        onClick={onRefresh}
      >
        {isES ? "Actualizar" : "Refresh"}
      </button>
    </div>
  );
}

function TruckForm({
  unitNumber,
  setUnitNumber,
  companyId,
  setCompanyId,
  year,
  setYear,
  make,
  setMake,
  model,
  setModel,
  mileage,
  setMileage,
  vin,
  setVin,
  licensePlate,
  setLicensePlate,
  licenseState,
  setLicenseState,
  companies,
  text,
}: any) {
  return (
    <div className="formGrid">
      <Field
        label={`${text.unitNumber} *`}
        value={unitNumber}
        setValue={setUnitNumber}
        placeholder="TRK-001"
      />

      <SelectField
        label={`${text.company} *`}
        value={companyId}
        setValue={setCompanyId}
        companies={companies}
        text={text}
      />

      <Field
        label={text.year}
        value={year}
        setValue={setYear}
        placeholder="2024"
        type="number"
      />

      <Field
        label={text.make}
        value={make}
        setValue={setMake}
        placeholder="Freightliner"
      />

      <Field
        label={text.model}
        value={model}
        setValue={setModel}
        placeholder="Cascadia"
      />

      <Field
        label={text.mileage}
        value={mileage}
        setValue={setMileage}
        placeholder="125000"
        type="number"
      />

      <Field
        label={text.vin}
        value={vin}
        setValue={setVin}
        placeholder="1FU..."
        full
      />

      <Field
        label={text.licensePlate}
        value={licensePlate}
        setValue={setLicensePlate}
        placeholder="ABC123"
      />

      <Field
        label={text.licenseState}
        value={licenseState}
        setValue={setLicenseState}
        placeholder="FL"
        maxLength={2}
      />
    </div>
  );
}

function TrailerForm({
  unitNumber,
  setUnitNumber,
  companyId,
  setCompanyId,
  year,
  setYear,
  make,
  setMake,
  model,
  setModel,
  trailerType,
  setTrailerType,
  vin,
  setVin,
  companies,
  text,
}: any) {
  return (
    <div className="formGrid">
      <Field
        label={`${text.unitNumber} *`}
        value={unitNumber}
        setValue={setUnitNumber}
        placeholder="TRL-001"
      />

      <SelectField
        label={`${text.company} *`}
        value={companyId}
        setValue={setCompanyId}
        companies={companies}
        text={text}
      />

      <Field
        label={text.year}
        value={year}
        setValue={setYear}
        placeholder="2024"
        type="number"
      />

      <Field
        label={text.make}
        value={make}
        setValue={setMake}
        placeholder="Utility"
      />

      <Field
        label={text.model}
        value={model}
        setValue={setModel}
        placeholder="3000R"
      />

      <Field
        label={text.trailerType}
        value={trailerType}
        setValue={setTrailerType}
        placeholder="Dry Van"
      />

      <Field
        label={text.vin}
        value={vin}
        setValue={setVin}
        placeholder="1UY..."
        full
      />
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
  type = "text",
  full = false,
  maxLength,
}: any) {
  return (
    <div
      className={
        full ? "field full" : "field"
      }
    >
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  setValue,
  companies,
  text,
}: any) {
  return (
    <div className="field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
      >
        <option value="">
          {text.selectCompany}
        </option>

        {companies.map(
          (company: Company) => (
            <option
              key={company.id}
              value={company.id}
            >
              {company.name}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function ProfileModal({
  title,
  unit,
  subtitle,
  onClose,
  fields,
  status,
  onStatus,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  editForm,
  text,
}: {
  title: string;
  unit: string | null;
  subtitle: string;
  onClose: () => void;
  fields: [string, string][];
  status: string | null;
  onStatus: (status: string) => void;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  editForm: React.ReactNode;
  text: any;
}) {
  function translatedStatusLabel(option: string) {
    switch (option) {
      case "active":
        return text.activeStatus;
      case "available":
        return text.availableStatus;
      case "maintenance":
        return text.maintenanceStatus;
      case "inactive":
        return text.inactiveStatus;
      case "out of service":
        return text.outOfService;
      default:
        return option;
    }
  }

  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modalHeader">
          <div>
            <div className="eyebrow">
              {title}
            </div>

            <h2>
              {text.unit} {unit || "—"}
            </h2>

            <p>{subtitle}</p>
          </div>

          <button
            className="closeButton"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        {editing ? (
          <>
            {editForm}

            <div className="statusSection">
              <div className="sectionTitle">
                {text.operationalStatus}
              </div>

              <div className="statusButtons">
                {STATUS_OPTIONS.map(
                  (option) => (
                    <button
                      key={option}
                      className={
                        status === option
                          ? "statusButton selected"
                          : "statusButton"
                      }
                      onClick={() =>
                        onStatus(option)
                      }
                      disabled={saving}
                    >
                      {translatedStatusLabel(
                        option
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="profile">
              {fields.map(
                ([label, value]) => (
                  <div
                    className={
                      label === text.vin
                        ? "infoBox full"
                        : "infoBox"
                    }
                    key={label}
                  >
                    <span>{label}</span>

                    <strong
                      className={
                        label === text.vin
                          ? "mono"
                          : undefined
                      }
                    >
                      {value}
                    </strong>
                  </div>
                )
              )}
            </div>

            <div className="statusSection">
              <div className="sectionTitle">
                {text.operationalStatus}
              </div>

              <div className="statusButtons">
                {STATUS_OPTIONS.map(
                  (option) => (
                    <button
                      key={option}
                      className={
                        status === option
                          ? "statusButton selected"
                          : "statusButton"
                      }
                      onClick={() =>
                        onStatus(option)
                      }
                    >
                      {translatedStatusLabel(
                        option
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}

        <div className="modalFooter">
          {editing ? (
            <>
              <button
                className="secondaryButton"
                onClick={onCancel}
                disabled={saving}
              >
                {text.cancel}
              </button>

              <button
                className="primaryButton"
                onClick={onSave}
                disabled={saving}
              >
                {saving
                  ? text.saving
                  : text.saveChanges}
              </button>
            </>
          ) : (
            <>
              <button
                className="secondaryButton"
                onClick={onClose}
              >
                {text.close}
              </button>

              <button
                className="editButton"
                onClick={onEdit}
              >
                {text.edit}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}