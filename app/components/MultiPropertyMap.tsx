"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

// Fix broken default icon paths in webpack bundles
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MultiPropertyMapProps {
  properties: any[];
}

export default function MultiPropertyMap({ properties }: MultiPropertyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-neutral-100 animate-pulse" />;
  }

  // Find center of all properties or fallback to India default (20.5937, 78.9629)
  let center: [number, number] = [20.5937, 78.9629];
  let zoom = 5;

  // Filter properties that have valid coordinates
  const validProps = properties.filter((p) => p.location?.coordinates && p.location.coordinates.length === 2);

  if (validProps.length === 1) {
    const coords = validProps[0].location.coordinates;
    center = [coords[1], coords[0]]; // coordinates = [longitude, latitude] in geojson
    zoom = 12;
  } else if (validProps.length > 1) {
    // Average center
    let latSum = 0;
    let lngSum = 0;
    validProps.forEach((p) => {
      const coords = p.location.coordinates;
      latSum += coords[1];
      lngSum += coords[0];
    });
    center = [latSum / validProps.length, lngSum / validProps.length];
    zoom = 6;
  }

  return (
    <MapContainer
      key={validProps.map((p) => p._id).join("-")}
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validProps.map((prop) => {
        const coords = prop.location.coordinates;
        return (
          <Marker key={prop._id} position={[coords[1], coords[0]]} icon={markerIcon}>
            <Popup>
              <div className="text-xs space-y-1 font-semibold text-neutral-800">
                <p className="font-extrabold">{prop.address}</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase capitalize mt-0.5">{prop.status.replace("_", " ")} · {prop.city}</p>
                <p className="text-[10px] text-emerald-600 font-bold">Rent: ₹{prop.rentAmount?.toLocaleString()}/mo</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
