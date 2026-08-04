"use client";

/**
 * LeafletDraggableMap
 * ---------------------
 * Used inside AddressMapPicker (wrapped with next/dynamic, ssr: false).
 * Renders an interactive OpenStreetMap tile layer with a draggable pin.
 * When draggable=false it behaves as a plain view-only map.
 */

import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Fix Leaflet's broken default icon paths when bundled by webpack ────────────
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Keeps the map view centered when lat/lng props change (e.g. user picks a new suggestion) */
function RecenterView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

/** Handles dragend events on the marker and propagates new coords */
function DraggableMarker({
  lat,
  lng,
  draggable,
  onDrag,
}: {
  lat: number;
  lng: number;
  draggable: boolean;
  onDrag?: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const m = markerRef.current;
      if (m && onDrag) {
        const pos = m.getLatLng();
        onDrag(pos.lat, pos.lng);
      }
    },
  };

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={markerIcon}
      draggable={draggable}
      eventHandlers={draggable ? eventHandlers : {}}
    />
  );
}

interface LeafletDraggableMapProps {
  lat: number;
  lng: number;
  draggable?: boolean;
  onDrag?: (lat: number, lng: number) => void;
}

export default function LeafletDraggableMap({
  lat,
  lng,
  draggable = false,
  onDrag,
}: LeafletDraggableMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-gray-100 animate-pulse" />;
  }

  return (
    <MapContainer
      key={`${lat}-${lng}`}
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterView lat={lat} lng={lng} />
      <DraggableMarker lat={lat} lng={lng} draggable={draggable} onDrag={onDrag} />
    </MapContainer>
  );
}
