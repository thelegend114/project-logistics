
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
}

const OFF_ROUTE_METERS = 80;
const ARRIVAL_TO_MANEUVER_METERS = 45;
const REROUTE_COOLDOWN_MS = 12000;
const MIN_REROUTE_MOVEMENT_METERS = 30;

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "--";

  if (meters < 1609.344) {
    return `${Math.round(meters / 10) * 10} m`;
  }

  return `${(meters / 1609.344).toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
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
  roadName: string
): string {
  const type = String(maneuver.type ?? "").toLowerCase();
  const modifier = String(maneuver.modifier ?? "").toLowerCase();

  const directions: Record<string, string> = {
    left: "Gira a la izquierda",
    "slight left": "Mantente ligeramente a la izquierda",
    "sharp left": "Gira cerradamente a la izquierda",
    right: "Gira a la derecha",
    "slight right": "Mantente ligeramente a la derecha",
    "sharp right": "Gira cerradamente a la derecha",
    straight: "Continúa recto",
    uturn: "Haz un cambio de sentido",
  };

  let instruction: string;

  if (type === "depart") {
    instruction = "Comienza la ruta";
  } else if (type === "arrive") {
    instruction = "Has llegado a la parada";
  } else if (type === "roundabout" || type === "rotary") {
    instruction =
      typeof maneuver.exit === "number"
        ? `En la rotonda, toma la salida ${maneuver.exit}`
        : "Continúa por la rotonda";
  } else if (type === "merge") {
    instruction = "Incorpórate a la vía";
  } else if (type === "fork") {
    instruction =
      directions[modifier] ?? "Continúa por la bifurcación";
  } else if (type === "on ramp") {
    instruction = "Toma la rampa de acceso";
  } else if (type === "off ramp") {
    instruction = "Toma la salida";
  } else if (type === "end of road") {
    instruction =
      directions[modifier] ?? "Continúa hasta el final de la vía";
  } else {
    instruction =
      directions[modifier] ??
      (type === "continue"
        ? "Continúa por la vía"
        : "Continúa siguiendo la ruta");
  }

  if (roadName) {
    instruction += ` hacia ${roadName}`;
  }

  return instruction;
}

function createTruckIcon(heading: number) {
  const rotation = ((heading % 360) + 360) % 360;

  return L.divIcon({
    className: "tractor-trailer-map-icon",
    html: `
      <div style="
        width:36px;height:52px;
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
  route: L.Polyline
): number {
  const points = route.getLatLngs() as L.LatLng[];

  if (points.length < 2) return Infinity;

  let minimumDistance = Infinity;

  for (const point of points) {
    minimumDistance = Math.min(
      minimumDistance,
      position.distanceTo(point)
    );
  }

  return minimumDistance;
}

export default function TruckMap({
  lastLocation,
  destination,
}: TruckMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  const headingRef = useRef(0);
  const lastRouteOriginRef = useRef<L.LatLng | null>(null);
  const lastRouteDestinationRef = useRef<string | null>(null);
  const routeRequestRef = useRef(0);
  const lastRerouteTimeRef = useRef(0);
  const lastReroutePositionRef = useRef<L.LatLng | null>(null);
  const stepsRef = useRef<NavigationStep[]>([]);
  const currentStepIndexRef = useRef(0);
  const offRouteRef = useRef(false);

  const [rerouteVersion, setRerouteVersion] = useState(0);
  const [navigation, setNavigation] = useState<RouteState>({
    instruction: "Esperando ubicación GPS...",
    roadName: "",
    distanceToManeuver: 0,
    routeDistance: 0,
    routeDuration: 0,
    isOffRoute: false,
  });

  const initialLat = 25.77154;
  const initialLng = -80.38205;

  // Inicializar el mapa.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [initialLat, initialLng],
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

  // Actualizar la posición del camión y seguir las maniobras.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lastLocation) return;

    const { lat, lng, heading } = lastLocation;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return;
    }

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
        title: "Tractor-tráiler — punto A",
      }).addTo(map);

      map.setView(position, 15);
    } else {
      truckMarkerRef.current.setLatLng(position);
      truckMarkerRef.current.setIcon(icon);
    }

    const steps = stepsRef.current;
    let stepIndex = currentStepIndexRef.current;

    while (stepIndex < steps.length - 1) {
      const step = steps[stepIndex];
      const distance = position.distanceTo(step.location);

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

      setNavigation((previous) => ({
        ...previous,
        instruction: currentStep.instruction,
        roadName: currentStep.roadName,
        distanceToManeuver,
      }));
    }

    const route = routeRef.current;

    if (route) {
      const distanceFromRoute = getDistanceFromRoute(
        position,
        route
      );

      const isOffRoute = distanceFromRoute > OFF_ROUTE_METERS;

      offRouteRef.current = isOffRoute;

      setNavigation((previous) => ({
        ...previous,
        isOffRoute,
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

                    // Solicitar un recálculo inmediato desde la ubicación GPS actual.
          lastRouteOriginRef.current = null;

          setNavigation((previous) => ({
            ...previous,
            instruction: "Desvío detectado. Recalculando ruta...",
          }));

          setRerouteVersion((version) => version + 1);
        }
      }
    }

    // Mantener el camión visible sin reajustar el zoom.
    if (
      !map.getBounds().pad(-0.15).contains(position)
    ) {
      map.panTo(position, { animate: true, duration: 0.4 });
    }
  }, [lastLocation]);

  // Calcular o recalcular la ruta, incluyendo instrucciones de maniobra.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const validDestination =
      destination &&
      destination.latitude !== null &&
      destination.longitude !== null &&
      Number.isFinite(destination.latitude) &&
      Number.isFinite(destination.longitude) &&
      Math.abs(destination.latitude) <= 90 &&
      Math.abs(destination.longitude) <= 180;

    

    if (
      !destination ||
      destination.latitude == null ||
      destination.longitude == null ||
      !Number.isFinite(destination.latitude) ||
      !Number.isFinite(destination.longitude) ||
      Math.abs(destination.latitude) > 90 ||
      Math.abs(destination.longitude) > 180
    ) {
      // Invalidar cualquier solicitud de ruta que siga en curso.
      routeRequestRef.current++;

      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;

      routeRef.current?.remove();
      routeRef.current = null;

      // Borrar todas las instrucciones y referencias de la ruta anterior.
      stepsRef.current = [];
      currentStepIndexRef.current = 0;
      lastRouteOriginRef.current = null;
      lastRouteDestinationRef.current = null;
      lastReroutePositionRef.current = null;
      lastRerouteTimeRef.current = 0;
      offRouteRef.current = false;

      setNavigation({
        instruction: "",
        roadName: "",
        distanceToManeuver: 0,
        routeDistance: 0,
        routeDuration: 0,
        isOffRoute: false,
      });

      return;
    }

    const destinationPosition = L.latLng(
      destination.latitude,
      destination.longitude
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
                width:32px;height:32px;border-radius:50%;
                background:#dc2626;color:white;
                border:3px solid white;
                box-shadow:0 2px 6px #64748b;
                display:flex;align-items:center;
                justify-content:center;font-weight:800;font-size:15px;
              ">B</div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
          title: `Destino B — parada ${destination.stop_order}`,
        }
      ).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(
        destinationPosition
      );
    }

    destinationMarkerRef.current.bindPopup(
      `<strong>Destino B</strong><br/>` +
        `Parada ${destination.stop_order}: ${destination.stop_type}` +
        `<br/>${destination.address ?? ""}` +
        `<br/>${destination.city ?? ""} ${destination.state ?? ""}`
    );

    if (!lastLocation) {
      setNavigation((previous) => ({
        ...previous,
        instruction: "Esperando ubicación GPS...",
      }));
      return;
    }

    const origin = L.latLng(
      lastLocation.lat,
      lastLocation.lng
    );

    const previousOrigin = lastRouteOriginRef.current;

    const destinationChanged =
      lastRouteDestinationRef.current !== destinationKey;

    const routeMissing = !routeRef.current;

    const originMoved =
      !previousOrigin ||
      map.distance(previousOrigin, origin) >= 500;

    const rerouteRequested = previousOrigin === null;

    if (
      !destinationChanged &&
      !routeMissing &&
      !originMoved &&
      !rerouteRequested
    ) {
      return;
    }

    const requestId = ++routeRequestRef.current;

    lastRouteOriginRef.current = origin;
    lastRouteDestinationRef.current = destinationKey;

    const fetchRoute = async () => {
      try {
        const url =
          "https://router.project-osrm.org/route/v1/driving/" +
          `${origin.lng},${origin.lat};` +
          `${destinationPosition.lng},${destinationPosition.lat}` +
          "?overview=full&geometries=geojson&steps=true";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Routing HTTP ${response.status}`
          );
        }

        const result = await response.json();

        if (requestId !== routeRequestRef.current) return;

        if (result.code !== "Ok" || !result.routes?.length) {
          throw new Error(
            "No se encontró una ruta por carretera."
          );
        }

        const routeResult = result.routes[0];
        const coordinates =
          routeResult.geometry?.coordinates;

        if (!coordinates || coordinates.length < 2) {
          throw new Error(
            "La ruta no contiene suficientes coordenadas."
          );
        }

        const latLngs: L.LatLngExpression[] =
          coordinates.map(
            (point: [number, number]) => [
              point[1],
              point[0],
            ]
          );

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

            const roadName = String(step.name ?? "").trim();

            newSteps.push({
              instruction: describeManeuver(
                step.maneuver ?? {},
                roadName
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
            instruction: "Continúa siguiendo la ruta",
            roadName: "",
            distance: Number(routeResult.distance ?? 0),
            duration: Number(routeResult.duration ?? 0),
            location: destinationPosition,
          });
        }

        routeRef.current?.remove();

        routeRef.current = L.polyline(latLngs, {
          color: "#2563eb",
          weight: 6,
          opacity: 0.9,
        }).addTo(map);

        stepsRef.current = newSteps;
        currentStepIndexRef.current = 0;
        offRouteRef.current = false;

        lastRouteOriginRef.current = origin;
        lastRouteDestinationRef.current = destinationKey;

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
        });

        // Solo encuadrar toda la ruta cuando se crea el primer
        // trazado o cambia la parada, no en cada recálculo.
        if (destinationChanged || routeMissing) {
          const bounds = routeRef.current.getBounds();

          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15,
          });
        }
      } catch (error) {
        if (requestId !== routeRequestRef.current) return;

        console.error("TRUCK MAP ROUTE ERROR:", error);

        setNavigation((previous) => ({
          ...previous,
          instruction:
            "No se pudo calcular la ruta. Reintentando al actualizar la ubicación.",
        }));
      }
    };

    void fetchRoute();
  }, [destination, lastLocation, rerouteVersion]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 shadow-lg">
            {destination && (
        <div
          className="absolute left-3 right-3 top-3 z-[1000] rounded-xl bg-white p-3 shadow-lg"
          style={{ pointerEvents: "none" }}
        >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white"
            style={{ fontSize: 22 }}
          >
            ↗
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-slate-900">
              {navigation.instruction}
            </div>

            {navigation.roadName && (
              <div className="mt-0.5 text-sm text-slate-600">
                {navigation.roadName}
              </div>
            )}

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
              <span>
                Maniobra:{" "}
                {formatDistance(navigation.distanceToManeuver)}
              </span>
              <span>
                Ruta: {formatDistance(navigation.routeDistance)}
              </span>
              <span>
                Tiempo estimado:{" "}
                {formatDuration(navigation.routeDuration)}
              </span>
            </div>

            {navigation.isOffRoute && (
              <div className="mt-2 text-sm font-bold text-red-600">
                Desvío detectado — recalculando...
              </div>
            )}
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
