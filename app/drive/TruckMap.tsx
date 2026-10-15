"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrección de iconos por defecto de Leaflet en React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
});
L.Marker.prototype.options.icon = DefaultIcon;

interface TruckMapProps {
  lastLocation: { lat: number; lng: number } | null;
}

// Icono personalizado para el camión
const truckIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097180.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

export default function TruckMap({ lastLocation }: TruckMapProps) {
  // Referencia directa al contenedor DOM del mapa
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const defaultLat = lastLocation?.lat ?? 25.7617;
      const defaultLng = lastLocation?.lng ?? -80.1918;

      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
      }).setView([defaultLat, defaultLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (!lastLocation || !mapRef.current) return;

    const { lat, lng } = lastLocation;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: truckIcon }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    mapRef.current.panTo([lat, lng], { animate: true });
  }, [lastLocation]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: "450px", width: "100%" }}
      className="w-full h-[450px] rounded-xl shadow-lg border border-slate-700 z-10" 
    />
  );
}