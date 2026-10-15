"use client";

import { useEffect, useRef } from "react";
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

  const initialLat = 25.77154;
  const initialLng = -80.38205;

  // Crear el mapa.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [initialLat, initialLng],
      14
    );

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      routeRequestRef.current++;
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      truckMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeRef.current = null;
    };
  }, []);

  // Mostrar el tractor-tráiler en la ubicación GPS actual.
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
    } else {
      truckMarkerRef.current.setLatLng(position);
      truckMarkerRef.current.setIcon(icon);
    }

    // Centrar inicialmente en el GPS, sin forzar zoom en cada actualización.
    if (!lastRouteOriginRef.current) {
      map.setView(position, 14);
    }
  }, [lastLocation]);

  // Dibujar el punto B y calcular la ruta por carretera.
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

    if (!validDestination) {
      routeRequestRef.current++;
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      routeRef.current?.remove();
      routeRef.current = null;
      lastRouteDestinationRef.current = null;
      lastRouteOriginRef.current = null;
      return;
    }

   
if (
  destination.latitude == null ||
  destination.longitude == null
) {
  routeRef.current?.remove();
  routeRef.current = null;
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
      destinationMarkerRef.current = L.marker(destinationPosition, {
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
      }).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(destinationPosition);
    }

    destinationMarkerRef.current.bindPopup(
      `<strong>Destino B</strong><br/>` +
      `Parada ${destination.stop_order}: ${destination.stop_type}` +
      `<br/>${destination.address ?? ""}` +
      `<br/>${destination.city ?? ""} ${destination.state ?? ""}`
    );

    if (!lastLocation) return;

    const origin = L.latLng(lastLocation.lat, lastLocation.lng);

    // Recalcular si cambia la parada o el camión avanza aproximadamente 500 m.
    const previousOrigin = lastRouteOriginRef.current;
    const originMoved =
      !previousOrigin || map.distance(previousOrigin, origin) >= 500;

    const destinationChanged =
      lastRouteDestinationRef.current !== destinationKey;

    if (!originMoved && !destinationChanged) return;

    const requestId = ++routeRequestRef.current;

    lastRouteOriginRef.current = origin;
    lastRouteDestinationRef.current = destinationKey;

    const fetchRoute = async () => {
      try {
        const url =
          "https://router.project-osrm.org/route/v1/driving/" +
          `${origin.lng},${origin.lat};` +
          `${destinationPosition.lng},${destinationPosition.lat}` +
          "?overview=full&geometries=geojson";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Routing HTTP ${response.status}`);
        }

        const result = await response.json();

        if (requestId !== routeRequestRef.current) return;

        const coordinates = result.routes?.[0]?.geometry?.coordinates;

        if (!coordinates || coordinates.length < 2) {
          throw new Error("No se encontró una ruta por carretera.");
        }

        const latLngs: L.LatLngExpression[] = coordinates.map(
          (point: [number, number]) => [point[1], point[0]]
        );

        routeRef.current?.remove();

        routeRef.current = L.polyline(latLngs, {
          color: "#2563eb",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        // Mostrar A, B y la ruta completa sin hacer zoom excesivo.
        const bounds = L.latLngBounds([
          origin,
          destinationPosition,
        ]);

        routeRef.current.getBounds().extend(bounds);

        map.fitBounds(routeRef.current.getBounds(), {
          padding: [40, 40],
          maxZoom: 15,
        });
      } catch (error) {
        if (requestId !== routeRequestRef.current) return;
        console.error("TRUCK MAP ROUTE ERROR:", error);
      }
    };

    void fetchRoute();
  }, [destination, lastLocation]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[450px] rounded-xl shadow-lg border border-slate-700 z-10"
      style={{ height: 450, width: "100%", background: "#e2e8f0" }}
    />
  );
}
