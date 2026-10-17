
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface NavigationStop {
  id: string;
  stop_order: number;
  stop_type: string;
  address?: string | null;
  city?: string;
  state?: string;
  latitude: number | null;
  longitude: number | null;
}

interface TruckMapProps {
  lastLocation: {
    lat: number;
    lng: number;
    heading?: number | null;
  } | null;
  destination: NavigationStop | null;
  isES: boolean;
}

interface NavigationStep {
  instruction: string;
  roadName: string;
  distance: number;
  duration: number;
  location: L.LatLng;
}

interface RouteState {
  instruction: string;
  roadName: string;
  distanceToManeuver: number;
  routeDistance: number;
  routeDuration: number;
  isOffRoute: boolean;
  isArrived: boolean;
  isCalculating: boolean;
  routeError: boolean;
}

const OFF_ROUTE_METERS = 70;
const ARRIVAL_RADIUS_METERS = 35;
const ARRIVAL_TO_MANEUVER_METERS = 45;
const ROUTE_REFRESH_DISTANCE_METERS = 100;
const ROUTE_REFRESH_INTERVAL_MS = 30_000;
const REROUTE_COOLDOWN_MS = 12_000;
const MIN_REROUTE_MOVEMENT_METERS = 15;
const ROUTE_RETRY_INTERVAL_MS = 15_000;

function initialNavigation(isES: boolean): RouteState {
  return {
    instruction: isES
      ? "Esperando ubicación GPS..."
      : "Waiting for GPS location...",
    roadName: "",
    distanceToManeuver: 0,
    routeDistance: 0,
    routeDuration: 0,
    isOffRoute: false,
    isArrived: false,
    isCalculating: false,
    routeError: false,
  };
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "--";

  if (meters < 1609.344) {
    return `${Math.round(meters / 10) * 10} m`;
  }

  return `${(meters / 1609.344).toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "--";

  const minutes = Math.max(0, Math.round(seconds / 60));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} h ${remainingMinutes} min`
    : `${hours} h`;
}

function describeManeuver(
  maneuver: {
    type?: string;
    modifier?: string;
    exit?: number;
  },
  roadName: string,
  isES: boolean
): string {
  const type = String(maneuver.type ?? "").toLowerCase();
  const modifier = String(maneuver.modifier ?? "").toLowerCase();

  const directionsES: Record<string, string> = {
    left: "Gira a la izquierda",
    "slight left": "Mantente ligeramente a la izquierda",
    "sharp left": "Gira cerradamente a la izquierda",
    right: "Gira a la derecha",
    "slight right": "Mantente ligeramente a la derecha",
    "sharp right": "Gira cerradamente a la derecha",
    straight: "Continúa recto",
    uturn: "Haz un cambio de sentido",
  };

  const directionsEN: Record<string, string> = {
    left: "Turn left",
    "slight left": "Keep slightly left",
    "sharp left": "Make a sharp left",
    right: "Turn right",
    "slight right": "Keep slightly right",
    "sharp right": "Make a sharp right",
    straight: "Continue straight",
    uturn: "Make a U-turn",
  };

  const directions = isES ? directionsES : directionsEN;
  let instruction: string;

  if (type === "depart") {
    instruction = isES ? "Comienza la ruta" : "Start route";
  } else if (type === "arrive") {
    instruction = isES
      ? "Has llegado a la parada"
      : "You have arrived at the stop";
  } else if (type === "roundabout" || type === "rotary") {
    instruction =
      typeof maneuver.exit === "number"
        ? isES
          ? `En la rotonda, toma la salida ${maneuver.exit}`
          : `At the roundabout, take exit ${maneuver.exit}`
        : isES
          ? "Continúa por la rotonda"
          : "Continue through the roundabout";
  } else if (type === "merge") {
    instruction = isES ? "Incorpórate a la vía" : "Merge onto the road";
  } else if (type === "fork") {
    instruction =
      directions[modifier] ??
      (isES
        ? "Continúa por la bifurcación"
        : "Continue through the fork");
  } else if (type === "on ramp") {
    instruction = isES
      ? "Toma la rampa de acceso"
      : "Take the entrance ramp";
  } else if (type === "off ramp") {
    instruction = isES ? "Toma la salida" : "Take the exit ramp";
  } else if (type === "end of road") {
    instruction =
      directions[modifier] ??
      (isES
        ? "Continúa hasta el final de la vía"
        : "Continue to the end of the road");
  } else {
    instruction =
      directions[modifier] ??
      (type === "continue"
        ? isES
          ? "Continúa por la vía"
          : "Continue on the road"
        : isES
          ? "Continúa siguiendo la ruta"
          : "Continue following the route");
  }

  if (roadName) {
    instruction += isES
      ? ` hacia ${roadName}`
      : ` onto ${roadName}`;
  }

  return instruction;
}

function createTruckIcon(heading: number) {
  const rotation = ((heading % 360) + 360) % 360;

  return L.divIcon({
    className: "tractor-trailer-map-icon",
    html: `
      <div style="
        width:36px;
        height:52px;
        transform:rotate(${rotation}deg);
        transform-origin:center;
        filter:drop-shadow(0 2px 3px #64748b);
      ">
        <svg viewBox="0 0 40 58" width="36" height="52"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M20 1 L25 8 L20 6 L15 8 Z"
            fill="#06b6d4" stroke="white" stroke-width="1"/>
          <path d="M11 10 Q11 7 15 7 H25 Q29 7 29 10
            L31 19 V24 H9 V19 Z"
            fill="#2563eb" stroke="#172554" stroke-width="1.5"/>
          <path d="M13 11 Q13 9 16 9 H24 Q27 9 27 11
            L28 16 H12 Z"
            fill="#a5f3fc" stroke="#0f172a" stroke-width="1.2"/>
          <rect x="5" y="15" width="5" height="9" rx="1.5" fill="#111827"/>
          <rect x="30" y="15" width="5" height="9" rx="1.5" fill="#111827"/>
          <rect x="17" y="23" width="6" height="5" rx="1" fill="#475569"/>
          <rect x="8" y="27" width="24" height="27" rx="3"
            fill="#e2e8f0" stroke="#334155" stroke-width="1.5"/>
          <rect x="11" y="30" width="18" height="21" rx="1.5"
            fill="#f8fafc" stroke="#94a3b8"/>
          <path d="M13 34 H27 M13 38 H27 M13 42 H27 M13 46 H27"
            stroke="#cbd5e1" stroke-width="1"/>
          <rect x="4" y="39" width="5" height="9" rx="1.5" fill="#111827"/>
          <rect x="31" y="39" width="5" height="9" rx="1.5" fill="#111827"/>
          <rect x="10" y="52" width="4" height="2.5" fill="#ef4444"/>
          <rect x="26" y="52" width="4" height="2.5" fill="#ef4444"/>
        </svg>
      </div>
    `,
    iconSize: [36, 52],
    iconAnchor: [18, 26],
  });
}

function getDistanceFromRoute(
  position: L.LatLng,
  route: L.Polyline,
  map: L.Map
): number {
  const points = route.getLatLngs() as L.LatLng[];

  if (points.length < 2) return Infinity;

  const projectedPosition = map.latLngToLayerPoint(position);
  let minimumDistance = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const start = map.latLngToLayerPoint(points[i]);
    const end = map.latLngToLayerPoint(points[i + 1]);

    const closest = L.LineUtil.closestPointOnSegment(
      projectedPosition,
      start,
      end
    );

    const closestLatLng = map.layerPointToLatLng(closest);
    const distance = position.distanceTo(closestLatLng);

    minimumDistance = Math.min(minimumDistance, distance);
  }

  return minimumDistance;
}

function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180
  );
}

export default function TruckMap({
  lastLocation,
  destination,
  isES,
}: TruckMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  const headingRef = useRef(0);
  const lastRouteOriginRef = useRef<L.LatLng | null>(null);
  const lastRouteDestinationRef = useRef<string | null>(null);
  const lastSuccessfulRouteTimeRef = useRef(0);
  const lastRouteAttemptTimeRef = useRef(0);
  const routeRequestRef = useRef(0);

  const lastRerouteTimeRef = useRef(0);
  const lastReroutePositionRef = useRef<L.LatLng | null>(null);

  const stepsRef = useRef<NavigationStep[]>([]);
  const currentStepIndexRef = useRef(0);
  const offRouteRef = useRef(false);
  const lastSpokenInstructionRef = useRef("");

  const [rerouteVersion, setRerouteVersion] = useState(0);
  const [navigation, setNavigation] = useState<RouteState>(() =>
    initialNavigation(isES)
  );

  // Anunciar instrucciones nuevas sin repetirlas continuamente.
  useEffect(() => {
    if (!destination || !navigation.instruction.trim()) return;
    if (navigation.isCalculating || navigation.routeError) return;

    if (
      !("speechSynthesis" in window) ||
      navigation.instruction.startsWith("Esperando") ||
      navigation.instruction.startsWith("Waiting") ||
      navigation.instruction.startsWith("No se pudo") ||
      navigation.instruction.startsWith("Could not") ||
      navigation.instruction.startsWith("Desvío") ||
      navigation.instruction.startsWith("Detour")
    ) {
      return;
    }

    const speechKey =
      `${destination.id}:${isES ? "es" : "en"}:${navigation.instruction}`;

    if (lastSpokenInstructionRef.current === speechKey) return;

    lastSpokenInstructionRef.current = speechKey;

    const utterance = new SpeechSynthesisUtterance(
      navigation.instruction
    );

    utterance.lang = isES ? "es-US" : "en-US";
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
  }, [
    navigation.instruction,
    navigation.isCalculating,
    navigation.routeError,
    destination?.id,
    isES,
  ]);

  // Inicializar Leaflet una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [25.77154, -80.38205],
      14
    );

    mapRef.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(containerRef.current);

    return () => {
      routeRequestRef.current++;
      observer.disconnect();
      map.remove();

      mapRef.current = null;
      truckMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeRef.current = null;
      stepsRef.current = [];
    };
  }, []);

  // Actualizar la posición del camión y comprobar la llegada.
  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !lastLocation ||
      !isValidCoordinate(lastLocation.lat, lastLocation.lng)
    ) {
      return;
    }

    const { lat, lng, heading } = lastLocation;

    if (
      typeof heading === "number" &&
      Number.isFinite(heading) &&
      heading >= 0 &&
      heading <= 360
    ) {
      headingRef.current = heading;
    }

    const position = L.latLng(lat, lng);
    const icon = createTruckIcon(headingRef.current);

    if (!truckMarkerRef.current) {
      truckMarkerRef.current = L.marker(position, {
        icon,
        zIndexOffset: 1000,
        title: isES ? "Ubicación del camión" : "Truck location",
      }).addTo(map);

      map.setView(position, 15);
    } else {
      truckMarkerRef.current.setLatLng(position);
      truckMarkerRef.current.setIcon(icon);
    }

    // La llegada visual no completa la parada en Supabase.
    if (
      destination &&
      isValidCoordinate(destination.latitude, destination.longitude)
    ) {
      const destinationPosition = L.latLng(
        Number(destination.latitude),
        Number(destination.longitude)
      );

      const distanceToDestination =
        position.distanceTo(destinationPosition);

      if (distanceToDestination <= ARRIVAL_RADIUS_METERS) {
        setNavigation((previous) => ({
          ...previous,
          instruction: isES
            ? "Has llegado a la parada"
            : "You have arrived at the stop",
          roadName: destination.address ?? "",
          distanceToManeuver: 0,
          routeDistance: 0,
          routeDuration: 0,
          isOffRoute: false,
          isArrived: true,
          isCalculating: false,
          routeError: false,
        }));
      } else {
        setNavigation((previous) =>
          previous.isArrived
            ? { ...previous, isArrived: false }
            : previous
        );
      }
    }

    // Actualizar la siguiente maniobra.
    const steps = stepsRef.current;
    let stepIndex = currentStepIndexRef.current;

    while (stepIndex < steps.length - 1) {
      const distance = position.distanceTo(
        steps[stepIndex].location
      );

      if (distance <= ARRIVAL_TO_MANEUVER_METERS) {
        stepIndex++;
      } else {
        break;
      }
    }

    currentStepIndexRef.current = stepIndex;

    const currentStep = steps[stepIndex];

    if (currentStep) {
      const distanceToManeuver = position.distanceTo(
        currentStep.location
      );

      setNavigation((previous) => {
        if (previous.isArrived) return previous;

        return {
          ...previous,
          instruction: currentStep.instruction,
          roadName: currentStep.roadName,
          distanceToManeuver,
        };
      });
    }

    // Detectar desviaciones comparando la posición con los segmentos de ruta.
    const route = routeRef.current;

    if (route) {
      const distanceFromRoute = getDistanceFromRoute(
        position,
        route,
        map
      );

      const isOffRoute =
        distanceFromRoute > OFF_ROUTE_METERS;

      offRouteRef.current = isOffRoute;

      setNavigation((previous) => ({
        ...previous,
        isOffRoute: previous.isArrived ? false : isOffRoute,
      }));

      if (isOffRoute) {
        const now = Date.now();
        const previousReroutePosition =
          lastReroutePositionRef.current;

        const movedEnough =
          !previousReroutePosition ||
          previousReroutePosition.distanceTo(position) >=
            MIN_REROUTE_MOVEMENT_METERS;

        const cooldownPassed =
          now - lastRerouteTimeRef.current >=
          REROUTE_COOLDOWN_MS;

        if (movedEnough && cooldownPassed) {
          lastRerouteTimeRef.current = now;
          lastReroutePositionRef.current = position;
          lastRouteOriginRef.current = null;

          setNavigation((previous) => ({
            ...previous,
            instruction: isES
              ? "Desvío detectado. Recalculando ruta..."
              : "Detour detected. Recalculating route...",
            isCalculating: true,
            routeError: false,
          }));

          setRerouteVersion((version) => version + 1);
        }
      }
    }

    // Mantener el camión visible sin cambiar el zoom continuamente.
    if (!map.getBounds().pad(-0.15).contains(position)) {
      map.panTo(position, {
        animate: true,
        duration: 0.4,
      });
    }
  }, [lastLocation, destination, isES]);

  // Calcular y actualizar la ruta.
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (
      !destination ||
      !isValidCoordinate(
        destination.latitude,
        destination.longitude
      )
    ) {
      routeRequestRef.current++;

      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;

      routeRef.current?.remove();
      routeRef.current = null;

      stepsRef.current = [];
      currentStepIndexRef.current = 0;
      lastRouteOriginRef.current = null;
      lastRouteDestinationRef.current = null;
      lastSuccessfulRouteTimeRef.current = 0;
      lastRouteAttemptTimeRef.current = 0;
      lastReroutePositionRef.current = null;
      lastRerouteTimeRef.current = 0;
      offRouteRef.current = false;

      setNavigation(initialNavigation(isES));
      return;
    }

    const destinationPosition = L.latLng(
      Number(destination.latitude),
      Number(destination.longitude)
    );

    const destinationKey = [
      destination.id,
      destination.latitude,
      destination.longitude,
    ].join(":");

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(
        destinationPosition,
        {
          icon: L.divIcon({
            className: "navigation-destination-icon",
            html: `
              <div style="
                width:22px;
                height:22px;
                border-radius:50%;
                background:#dc2626;
                border:4px solid white;
                box-shadow:0 2px 6px #64748b;
              "></div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          title: isES ? "Próxima parada" : "Next stop",
        }
      ).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(
        destinationPosition
      );
    }

    const popupContent = document.createElement("div");
    const popupTitle = document.createElement("strong");

    popupTitle.textContent = isES
      ? "Próxima parada"
      : "Next stop";

    popupContent.appendChild(popupTitle);

    const popupDetails = document.createElement("div");

    popupDetails.textContent =
      `${isES ? "Parada" : "Stop"} ${destination.stop_order}: ` +
      `${destination.stop_type} · ${destination.address ?? ""} · ` +
      `${destination.city ?? ""} ${destination.state ?? ""}`;

    popupContent.appendChild(popupDetails);
    destinationMarkerRef.current.bindPopup(popupContent);

    if (
      !lastLocation ||
      !isValidCoordinate(lastLocation.lat, lastLocation.lng)
    ) {
      setNavigation((previous) => ({
        ...previous,
        instruction: isES
          ? "Esperando ubicación GPS..."
          : "Waiting for GPS location...",
        isCalculating: false,
      }));

      return;
    }

    const origin = L.latLng(
      lastLocation.lat,
      lastLocation.lng
    );

    const distanceToDestination =
      origin.distanceTo(destinationPosition);

    // Llegada visual: no modifica el estado operativo de la parada.
    if (distanceToDestination <= ARRIVAL_RADIUS_METERS) {
      setNavigation((previous) => ({
        ...previous,
        instruction: isES
          ? "Has llegado a la parada"
          : "You have arrived at the stop",
        roadName: destination.address ?? "",
        distanceToManeuver: 0,
        routeDistance: 0,
        routeDuration: 0,
        isOffRoute: false,
        isArrived: true,
        isCalculating: false,
        routeError: false,
      }));

      return;
    }

    const previousOrigin = lastRouteOriginRef.current;

    const destinationChanged =
      lastRouteDestinationRef.current !== destinationKey;

    const routeMissing = !routeRef.current;

    const originMoved =
      !previousOrigin ||
      previousOrigin.distanceTo(origin) >=
        ROUTE_REFRESH_DISTANCE_METERS;

    const refreshDue =
      Date.now() - lastSuccessfulRouteTimeRef.current >=
      ROUTE_REFRESH_INTERVAL_MS;

    const rerouteRequested = previousOrigin === null;

    const needsRoute =
      destinationChanged ||
      routeMissing ||
      originMoved ||
      refreshDue ||
      rerouteRequested;

    if (!needsRoute) return;

    const now = Date.now();

    // Evitar demasiadas solicitudes al servicio de rutas público.
    if (
      !destinationChanged &&
      !routeMissing &&
      now - lastRouteAttemptTimeRef.current <
        ROUTE_RETRY_INTERVAL_MS
    ) {
      return;
    }

    const requestId = ++routeRequestRef.current;
    lastRouteAttemptTimeRef.current = now;

    setNavigation((previous) => ({
      ...previous,
      isCalculating: true,
      routeError: false,
      instruction: isES
        ? "Calculando ruta..."
        : "Calculating route...",
    }));

    const fetchRoute = async () => {
      try {
        const url =
          "https://router.project-osrm.org/route/v1/driving/" +
          `${origin.lng},${origin.lat};` +
          `${destinationPosition.lng},${destinationPosition.lat}` +
          "?overview=full&geometries=geojson&steps=true";

        const response = await fetch(url, {
          signal: AbortSignal.timeout(20_000),
        });

        if (!response.ok) {
          throw new Error(`Routing HTTP ${response.status}`);
        }

        const result = await response.json();

        // Ignorar respuestas antiguas si ya se solicitó otra ruta.
        if (requestId !== routeRequestRef.current) return;

        if (result.code !== "Ok" || !result.routes?.length) {
          throw new Error(
            "No se encontró una ruta por carretera."
          );
        }

        const routeResult = result.routes[0];
        const coordinates = routeResult.geometry?.coordinates;

        if (!coordinates || coordinates.length < 2) {
          throw new Error(
            "La ruta no contiene suficientes coordenadas."
          );
        }

        const latLngs: L.LatLngExpression[] =
          coordinates.map((point: [number, number]) => [
            point[1],
            point[0],
          ]);

        const newSteps: NavigationStep[] = [];

        for (const leg of routeResult.legs ?? []) {
          for (const step of leg.steps ?? []) {
            const maneuverLocation =
              step.maneuver?.location;

            if (
              !maneuverLocation ||
              maneuverLocation.length < 2
            ) {
              continue;
            }

            const roadName = String(
              step.name ?? ""
            ).trim();

            newSteps.push({
              instruction: describeManeuver(
                step.maneuver ?? {},
                roadName,
                isES
              ),
              roadName,
              distance: Number(step.distance ?? 0),
              duration: Number(step.duration ?? 0),
              location: L.latLng(
                maneuverLocation[1],
                maneuverLocation[0]
              ),
            });
          }
        }

        if (newSteps.length === 0) {
          newSteps.push({
            instruction: isES
              ? "Continúa siguiendo la ruta"
              : "Continue following the route",
            roadName: "",
            distance: Number(routeResult.distance ?? 0),
            duration: Number(routeResult.duration ?? 0),
            location: destinationPosition,
          });
        }

        const newRoute = L.polyline(latLngs, {
          color: "#2563eb",
          weight: 6,
          opacity: 0.9,
        }).addTo(map);

        routeRef.current?.remove();
        routeRef.current = newRoute;

        stepsRef.current = newSteps;
        currentStepIndexRef.current = 0;
        offRouteRef.current = false;

        // Guardar origen y hora solo después de una ruta válida.
        lastRouteOriginRef.current = origin;
        lastRouteDestinationRef.current = destinationKey;
        lastSuccessfulRouteTimeRef.current = Date.now();
        lastReroutePositionRef.current = origin;

        setNavigation({
          instruction: newSteps[0].instruction,
          roadName: newSteps[0].roadName,
          distanceToManeuver: origin.distanceTo(
            newSteps[0].location
          ),
          routeDistance: Number(routeResult.distance ?? 0),
          routeDuration: Number(routeResult.duration ?? 0),
          isOffRoute: false,
          isArrived: false,
          isCalculating: false,
          routeError: false,
        });

        if (destinationChanged || routeMissing) {
          map.fitBounds(newRoute.getBounds(), {
            padding: [40, 40],
            maxZoom: 15,
          });
        }
      } catch (error) {
        if (requestId !== routeRequestRef.current) return;

        console.error("TRUCK MAP ROUTE ERROR:", error);

        // No presentar un ETA anterior como si fuera actual.
        lastRouteOriginRef.current = null;

        setNavigation((previous) => ({
          ...previous,
          instruction: isES
            ? "No se pudo actualizar la ruta. Se reintentará."
            : "Could not update the route. It will retry.",
          routeDistance: 0,
          routeDuration: 0,
          isCalculating: false,
          routeError: true,
        }));
      }
    };

    void fetchRoute();
  }, [destination, lastLocation, rerouteVersion, isES]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 shadow-lg">
      {destination && (
        <div
          className="absolute left-3 right-3 top-3 z-[1000] rounded-xl bg-white p-3 shadow-lg"
          style={{ pointerEvents: "none" }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white ${
                navigation.isArrived
                  ? "bg-emerald-600"
                  : "bg-blue-600"
              }`}
              style={{ fontSize: 22 }}
            >
              {navigation.isArrived ? "✓" : "↗"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-slate-900">
                {navigation.instruction}
              </div>

              {navigation.roadName && !navigation.isArrived && (
                <div className="mt-0.5 text-sm text-slate-600">
                  {navigation.roadName}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                {!navigation.isArrived && (
                  <>
                    <span>
                      {isES ? "Maniobra:" : "Maneuver:"}{" "}
                      {formatDistance(
                        navigation.distanceToManeuver
                      )}
                    </span>

                    <span>
                      {isES ? "Ruta:" : "Route:"}{" "}
                      {navigation.routeError
                        ? "--"
                        : formatDistance(
                            navigation.routeDistance
                          )}
                    </span>

                    <span>
                      {isES
                        ? "Tiempo estimado:"
                        : "Estimated time:"}{" "}
                      {navigation.routeError ||
                      navigation.isCalculating
                        ? "--"
                        : formatDuration(
                            navigation.routeDuration
                          )}
                    </span>
                  </>
                )}
              </div>

              {navigation.isCalculating && (
                <div className="mt-2 text-sm font-semibold text-blue-700">
                  {isES
                    ? "Actualizando navegación..."
                    : "Updating navigation..."}
                </div>
              )}

              {navigation.isOffRoute &&
                !navigation.isArrived && (
                  <div className="mt-2 text-sm font-bold text-red-600">
                    {isES
                      ? "Desvío detectado. Recalculando ruta..."
                      : "Off route. Recalculating route..."}
                  </div>
                )}

              {navigation.routeError && (
                <div className="mt-2 text-sm font-semibold text-amber-700">
                  {isES
                    ? "El tiempo estimado no está disponible. Comprueba la conexión."
                    : "ETA unavailable. Check the connection."}
                </div>
              )}

              {navigation.isArrived && (
                <div className="mt-1 text-sm font-semibold text-emerald-700">
                  {isES
                    ? "Proximidad al destino confirmada por GPS. Completa la parada mediante el flujo operativo."
                    : "GPS proximity to destination confirmed. Complete the stop through the operational workflow."}
                </div>
              )}

              <div className="mt-2 text-[11px] text-slate-500">
                {isES
                  ? "ETA aproximado; puede variar según las condiciones de la vía."
                  : "Estimated ETA; actual travel time may vary with road conditions."}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="z-10 h-[450px] w-full"
        style={{
          height: 450,
          width: "100%",
          background: "#e2e8f0",
        }}
      />
    </div>
  );
}
