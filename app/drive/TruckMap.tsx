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
  fullScreen?: boolean;
  onArrival?: (stop: NavigationStop) => void;
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
const ARRIVAL_RADIUS_METERS = 161;
const ARRIVAL_RESET_RADIUS_METERS = 200;
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
      (isES ? "Continúa por la bifurcación" : "Continue through the fork");
  } else if (type === "on ramp") {
    instruction = isES ? "Toma la rampa de acceso" : "Take the entrance ramp";
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
    instruction += isES ? ` hacia ${roadName}` : ` onto ${roadName}`;
  }

  return instruction;
}

function createTruckIcon(heading: number) {
  // The map pane rotates by -heading; counter-rotate this arrow so it always
  // points to the top of the screen while the road map rotates underneath it.
  const counterRotation = ((heading % 360) + 360) % 360;

  return L.divIcon({
    className: "navigation-arrow-marker",
    html: `
      <div style="
        width:42px;height:42px;display:flex;align-items:center;justify-content:center;
        transform:rotate(${counterRotation}deg);transform-origin:center;
        filter:drop-shadow(0 2px 3px rgba(15,23,42,.55));
      ">
        <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M24 2 L43 42 L24 33 L5 42 Z" fill="#0891b2" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
          <path d="M24 10 L24 31" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

/** Calculates minimum distance to route segments, not only their vertices. */
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
    minimumDistance = Math.min(
      minimumDistance,
      position.distanceTo(closestLatLng)
    );
  }

  return minimumDistance;
}

function getRouteBearing(position: L.LatLng, route: L.Polyline | null): number | null {
  if (!route) return null;
  const points = route.getLatLngs() as L.LatLng[];
  if (points.length < 2) return null;

  let closestIndex = 0;
  let closestDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const distance = position.distanceTo(points[i]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  const next = points[Math.min(closestIndex + 1, points.length - 1)];
  if (next === points[closestIndex]) return null;
  const toRad = Math.PI / 180;
  const lat1 = position.lat * toRad;
  const lat2 = next.lat * toRad;
  const deltaLng = (next.lng - position.lng) * toRad;
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function applyMapBearing(_map: L.Map, _heading: number) {
  // Keep Leaflet's map pane untouched. Rotating/resizing the pane can displace
  // or clip raster tiles, leaving a gray map even when tile requests succeed.
  // The truck heading remains represented by the navigation marker/arrow.
}

function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined
): lat is number {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export default function TruckMap({
  lastLocation,
  destination,
  isES,
  fullScreen = false,
  onArrival,
}: TruckMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileErrorCountRef = useRef(0);
  const fallbackTilesActiveRef = useRef(false);

  const headingRef = useRef(0);
  const lastRouteOriginRef = useRef<L.LatLng | null>(null);
  const lastRouteDestinationRef = useRef<string | null>(null);
  const lastSuccessfulRouteTimeRef = useRef(0);
  const lastRouteAttemptTimeRef = useRef(0);
  const routeRequestRef = useRef(0);
  const routeInFlightRef = useRef(false);
  const onArrivalRef = useRef(onArrival);
  const lastArrivalStopRef = useRef<string | null>(null);
  onArrivalRef.current = onArrival;

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

  // Speak new instructions without repeating the same instruction continuously.
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
    const utterance = new SpeechSynthesisUtterance(navigation.instruction);
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

  // Initialize Leaflet once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Start with a neutral continental-US view; never imply a hard-coded truck location.
    // A valid live GPS position or the active stop will center the map when available.
    const map = L.map(containerRef.current).setView([39.5, -98.35], 4);
    mapRef.current = map;

    const osmTiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        keepBuffer: 5,
        crossOrigin: true,
      }
    );
    tileLayerRef.current = osmTiles;
    osmTiles.addTo(map);
    osmTiles.on("tileerror", () => {
      tileErrorCountRef.current += 1;
      // If the primary tile server is unavailable, switch once to a second
      // public tile source instead of leaving the user with a blank map.
      if (tileErrorCountRef.current >= 3 && !fallbackTilesActiveRef.current) {
        fallbackTilesActiveRef.current = true;
        osmTiles.remove();
        const fallback = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
            keepBuffer: 5,
          }
        );
        tileLayerRef.current = fallback;
        fallback.on("tileerror", (event) => {
          console.error("TRUCK MAP TILE ERROR (CARTO fallback):", event);
        });
        fallback.addTo(map);
      }
    });

    const refreshMapSize = () => {
      map.invalidateSize({ pan: false });
      applyMapBearing(map, headingRef.current);
    };
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(refreshMapSize)
      : null;
    observer?.observe(containerRef.current);
    window.addEventListener("resize", refreshMapSize);
    requestAnimationFrame(refreshMapSize);

    return () => {
      routeRequestRef.current++;
      routeInFlightRef.current = false;
      observer?.disconnect();
      window.removeEventListener("resize", refreshMapSize);
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      truckMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeRef.current = null;
      stepsRef.current = [];
    };
  }, []);

  // Recalculate Leaflet's viewport when Drive switches between embedded and fullscreen.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      applyMapBearing(map, headingRef.current);
      if (lastLocation && isValidCoordinate(lastLocation.lat, lastLocation.lng)) {
        map.setView(
          [lastLocation.lat, lastLocation.lng],
          Math.max(map.getZoom(), 15),
          { animate: false }
        );
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fullScreen, lastLocation]);

  // Update truck position, arrival state, and distance to the next maneuver.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lastLocation) return;

    const { lat, lng, heading } = lastLocation;
    if (!isValidCoordinate(lat, lng)) return;

    if (
      typeof heading === "number" &&
      Number.isFinite(heading) &&
      heading >= 0 &&
      heading <= 360
    ) {
      headingRef.current = heading;
    } else {
      const routeBearing = getRouteBearing(L.latLng(lat, lng), routeRef.current);
      if (routeBearing !== null) headingRef.current = routeBearing;
    }

    const position = L.latLng(lat, lng);
    applyMapBearing(map, headingRef.current);
    const icon = createTruckIcon(headingRef.current);

    if (!truckMarkerRef.current) {
      truckMarkerRef.current = L.marker(position, {
        icon,
        zIndexOffset: 1000,
        title: isES ? "Ubicación del camión" : "Truck location",
      }).addTo(map);
    } else {
      truckMarkerRef.current.setLatLng(position);
      truckMarkerRef.current.setIcon(icon);
    }

    // Seguir el GPS en ambos tamaños de pantalla. El camión queda centrado;
    // el mapa y la ruta se desplazan debajo de la flecha fija hacia arriba.
    const followZoom = Math.max(map.getZoom(), 15);
    map.setView(position, followZoom, { animate: false });
    applyMapBearing(map, headingRef.current);

    if (
      destination &&
      isValidCoordinate(destination.latitude, destination.longitude)
    ) {
      const destinationPosition = L.latLng(
        Number(destination.latitude),
        Number(destination.longitude)
      );
      const distanceToDestination = position.distanceTo(destinationPosition);

      if (distanceToDestination <= ARRIVAL_RADIUS_METERS) {
        setNavigation((previous) => ({
          ...previous,
          instruction: isES
            ? "Has llegado a la parada"
            : "You have arrived at the stop",
          roadName: destination.address ?? "",
          distanceToManeuver: distanceToDestination,
          routeDistance: 0,
          routeDuration: 0,
          isOffRoute: false,
          isArrived: true,
          isCalculating: false,
          routeError: false,
        }));

        if (lastArrivalStopRef.current !== destination.id) {
          lastArrivalStopRef.current = destination.id;
          onArrivalRef.current?.(destination);
        }
      } else {
        if (distanceToDestination > ARRIVAL_RESET_RADIUS_METERS) {
          lastArrivalStopRef.current = null;
        }
        setNavigation((previous) =>
          previous.isArrived
            ? { ...previous, isArrived: false }
            : previous
        );
      }
    }

    const steps = stepsRef.current;
    let stepIndex = currentStepIndexRef.current;

    while (stepIndex < steps.length - 1) {
      const distance = position.distanceTo(steps[stepIndex].location);
      if (distance <= ARRIVAL_TO_MANEUVER_METERS) {
        stepIndex++;
      } else {
        break;
      }
    }

    currentStepIndexRef.current = stepIndex;
    const currentStep = steps[stepIndex];

    if (currentStep) {
      const distanceToManeuver = position.distanceTo(currentStep.location);
      // Keep the displayed distance and ETA as the remaining route, rather
      // than leaving the original full-trip values on screen.
      const remainingSteps = steps.slice(stepIndex);
      const remainingDistance = remainingSteps.reduce(
        (total, step) => total + step.distance,
        0
      );
      const remainingDuration = remainingSteps.reduce(
        (total, step) => total + step.duration,
        0
      );

      setNavigation((previous) => {
        if (previous.isArrived) return previous;
        return {
          ...previous,
          instruction: currentStep.instruction,
          roadName: currentStep.roadName,
          distanceToManeuver,
          routeDistance: remainingDistance,
          routeDuration: remainingDuration,
        };
      });
    }

    const route = routeRef.current;
    if (route) {
      const distanceFromRoute = getDistanceFromRoute(position, route, map);
      const isOffRoute = distanceFromRoute > OFF_ROUTE_METERS;
      offRouteRef.current = isOffRoute;

      setNavigation((previous) => ({
        ...previous,
        isOffRoute: previous.isArrived ? false : isOffRoute,
      }));

      if (isOffRoute) {
        const now = Date.now();
        const previousReroutePosition = lastReroutePositionRef.current;
        const movedEnough =
          !previousReroutePosition ||
          previousReroutePosition.distanceTo(position) >=
            MIN_REROUTE_MOVEMENT_METERS;
        const cooldownPassed =
          now - lastRerouteTimeRef.current >= REROUTE_COOLDOWN_MS;

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

    // Navigation mode keeps the live vehicle centered; zoom is not changed.
    const center = map.getCenter();
    if (center.distanceTo(position) > 8) {
      map.panTo(position, { animate: false });
    }
  }, [lastLocation, destination, isES]);

  // Calculate and refresh the road route.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      !destination ||
      !isValidCoordinate(destination.latitude, destination.longitude)
    ) {
      routeRequestRef.current++;
      routeInFlightRef.current = false;

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
      lastArrivalStopRef.current = null;

      setNavigation({
        ...initialNavigation(isES),
        instruction: !destination
          ? (isES ? "Esperando la próxima parada..." : "Waiting for the next stop...")
          : (isES
              ? "La parada no tiene coordenadas GPS válidas. Revisa la dirección en Loads."
              : "The stop has no valid GPS coordinates. Check the address in Loads."),
        routeError: Boolean(destination),
      });
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
      destinationMarkerRef.current = L.marker(destinationPosition, {
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
      }).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(destinationPosition);
    }

    const popupContent = document.createElement("div");
    const popupTitle = document.createElement("strong");
    popupTitle.textContent = isES ? "Próxima parada" : "Next stop";
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
      if (!truckMarkerRef.current) {
        map.setView(destinationPosition, 14);
      }
      setNavigation((previous) => ({
        ...previous,
        instruction: isES
          ? "Esperando ubicación GPS..."
          : "Waiting for GPS location...",
        isCalculating: false,
      }));
      return;
    }

    const origin = L.latLng(lastLocation.lat, lastLocation.lng);
    const distanceToDestination = origin.distanceTo(destinationPosition);

    // Map arrival does not complete or modify the stop in Supabase.
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
    if (destinationChanged) {
      routeRef.current?.remove();
      routeRef.current = null;
      stepsRef.current = [];
      currentStepIndexRef.current = 0;
    }
    const routeMissing = !routeRef.current;
    const originMoved =
      !previousOrigin ||
      previousOrigin.distanceTo(origin) >= ROUTE_REFRESH_DISTANCE_METERS;
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

    // Don't launch overlapping requests for every GPS update. A changed
    // destination may start a new request immediately; otherwise respect cooldown.
    if (!destinationChanged && routeInFlightRef.current) return;
    if (
      !destinationChanged &&
      lastRouteAttemptTimeRef.current > 0 &&
      now - lastRouteAttemptTimeRef.current < ROUTE_RETRY_INTERVAL_MS
    ) {
      return;
    }

    const requestId = ++routeRequestRef.current;
    routeInFlightRef.current = true;
    lastRouteAttemptTimeRef.current = now;

    setNavigation((previous) => ({
      ...previous,
      isCalculating: true,
      routeError: false,
      instruction: isES ? "Calculando ruta..." : "Calculating route...",
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
        if (requestId !== routeRequestRef.current) return;

        if (result.code !== "Ok" || !result.routes?.length) {
          throw new Error("No se encontró una ruta por carretera.");
        }

        const routeResult = result.routes[0];
        const coordinates = routeResult.geometry?.coordinates;
        if (!coordinates || coordinates.length < 2) {
          throw new Error("La ruta no contiene suficientes coordenadas.");
        }

        const latLngs: L.LatLngExpression[] = coordinates.map(
          (point: [number, number]) => [point[1], point[0]]
        );
        const newSteps: NavigationStep[] = [];

        for (const leg of routeResult.legs ?? []) {
          for (const step of leg.steps ?? []) {
            const maneuverLocation = step.maneuver?.location;
            if (!maneuverLocation || maneuverLocation.length < 2) continue;

            const roadName = String(step.name ?? "").trim();
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
        const routeBearing = getRouteBearing(origin, newRoute);
        if (routeBearing !== null && !Number.isFinite(lastLocation?.heading ?? NaN)) {
          headingRef.current = routeBearing;
          applyMapBearing(map, headingRef.current);
          truckMarkerRef.current?.setIcon(createTruckIcon(headingRef.current));
        }
        stepsRef.current = newSteps;
        currentStepIndexRef.current = 0;
        offRouteRef.current = false;
        lastRouteOriginRef.current = origin;
        lastRouteDestinationRef.current = destinationKey;
        lastSuccessfulRouteTimeRef.current = Date.now();
        lastReroutePositionRef.current = origin;

        setNavigation({
          instruction: newSteps[0].instruction,
          roadName: newSteps[0].roadName,
          distanceToManeuver: origin.distanceTo(newSteps[0].location),
          routeDistance: Number(routeResult.distance ?? 0),
          routeDuration: Number(routeResult.duration ?? 0),
          isOffRoute: false,
          isArrived: false,
          isCalculating: false,
          routeError: false,
        });

        if (destinationChanged || routeMissing) {
          map.setView(origin, Math.max(map.getZoom(), 15), { animate: false });
          applyMapBearing(map, headingRef.current);
        }
      } catch (error) {
        if (requestId !== routeRequestRef.current) return;

        console.error("TRUCK MAP ROUTE ERROR:", error);
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
      } finally {
        if (requestId === routeRequestRef.current) {
          routeInFlightRef.current = false;
        }
      }
    };

    void fetchRoute();
  }, [destination, lastLocation, rerouteVersion, isES]);

  return (
    <div
      className={`relative w-full overflow-hidden ${
        fullScreen
          ? "h-full min-h-0 rounded-none border-0 shadow-none"
          : "h-[450px] rounded-xl border border-slate-700 shadow-lg"
      }`}
      style={fullScreen ? { height: "100%", minHeight: 0 } : { height: 450 }}
    >
      {
        <div
          className="absolute left-3 right-3 top-3 z-[1000] p-1"
          style={{ pointerEvents: "none", background: "transparent", border: "none", boxShadow: "none", backdropFilter: "none" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center bg-transparent font-bold text-black"
              style={{ fontSize: 28, textShadow: "0 1px 2px white" }}
            >
              {navigation.isArrived ? "✓" : "↗"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-black" style={{ textShadow: "0 1px 2px white" }}>
                {navigation.instruction}
              </div>

              {navigation.roadName && !navigation.isArrived && (
                <div className="mt-0.5 text-sm font-semibold text-black" style={{ textShadow: "0 1px 2px white" }}>
                  {navigation.roadName}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black">
                {!navigation.isArrived && (
                  <>
                    <span>
                      {isES ? "Maniobra:" : "Maneuver:"}{" "}
                      {formatDistance(navigation.distanceToManeuver)}
                    </span>
                    <span>
                      {isES ? "Ruta:" : "Route:"}{" "}
                      {navigation.routeError
                        ? "--"
                        : formatDistance(navigation.routeDistance)}
                    </span>
                    <span>
                      {isES ? "Tiempo estimado:" : "Estimated time:"}{" "}
                      {navigation.routeError || navigation.isCalculating
                        ? "--"
                        : formatDuration(navigation.routeDuration)}
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

              {navigation.isOffRoute && !navigation.isArrived && (
                <div className="mt-2 text-sm font-bold text-red-600">
                  {isES
                    ? "Desvío detectado. Recalculando ruta..."
                    : "Off route. Recalculating route..."}
                </div>
              )}

              {navigation.routeError && (
                <div className="mt-2 text-sm font-semibold text-amber-800">
                  {destination && isValidCoordinate(destination.latitude, destination.longitude)
                    ? (isES
                        ? "No se pudo obtener la ruta por carretera. Comprueba la conexión y las coordenadas de la parada."
                        : "Road routing failed. Check the connection and stop coordinates.")
                    : (isES
                        ? "La navegación necesita una parada seleccionada con coordenadas válidas."
                        : "Navigation needs a selected stop with valid coordinates.")}
                </div>
              )}

              {navigation.isArrived && (
                <div className="mt-1 text-sm font-semibold text-emerald-700">
                  {isES
                    ? "Proximidad al destino confirmada por GPS. Completa la parada mediante el flujo operativo."
                    : "GPS proximity to destination confirmed. Complete the stop through the operational workflow."}
                </div>
              )}

              <div className="mt-2 text-[11px] font-medium text-black" style={{ textShadow: "0 1px 2px white" }}>
                {isES
                  ? "ETA aproximado; puede variar según las condiciones de la vía."
                  : "Estimated ETA; actual travel time may vary with road conditions."}
              </div>
            </div>
          </div>
        </div>
      }

      <div
        ref={containerRef}
        className={`z-10 w-full ${fullScreen ? "h-full" : "h-[450px]"}`}
        style={{
          height: fullScreen ? "100%" : 450,
          minHeight: fullScreen ? 0 : 450,
          width: "100%",
          background: "#e2e8f0",
        }}
      />
    </div>
  );
}
