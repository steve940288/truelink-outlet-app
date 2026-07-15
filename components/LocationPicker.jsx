"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Simple SVG pin - avoids the classic Leaflet "missing default marker icon"
// bundler issue since it doesn't depend on external image files.
const pinIcon = L.divIcon({
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 26 16 26s16-15 16-26C32 7.16 24.84 0 16 0z" fill="#E8A030" stroke="#0F2044" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="6" fill="#0F2044"/>
  </svg>`,
  className: "",
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom() || 17);
    }
  }, [lat, lng, map]);
  return null;
}

function DraggableMarker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

export default function LocationPicker({ lat, lng, onChange }) {
  const [geoError, setGeoError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [layer, setLayer] = useState("street"); // "street" | "satellite"

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported on this device/browser.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setGeoError(
          "Couldn't get your location automatically. You can still tap/drag the pin on the map to set it manually."
        );
        setLocating(false);
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPosition = lat != null && lng != null;
  const center = hasPosition ? [lat, lng] : [9.03, 38.74]; // fallback: Addis Ababa

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          style={{
            background: "#1557A0",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {locating ? "Locating..." : "Re-detect my location"}
        </button>
        {hasPosition && (
          <span style={{ fontSize: 13, color: "#0F2044" }}>
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setLayer("street")}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 13,
            borderRadius: 8,
            border: layer === "street" ? "2px solid #1557A0" : "1.5px solid #d3dae5",
            background: layer === "street" ? "#eaf2fb" : "white",
            color: "#0F2044",
            cursor: "pointer",
          }}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => setLayer("satellite")}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 13,
            borderRadius: 8,
            border: layer === "satellite" ? "2px solid #1557A0" : "1.5px solid #d3dae5",
            background: layer === "satellite" ? "#eaf2fb" : "white",
            color: "#0F2044",
            cursor: "pointer",
          }}
        >
          Satellite
        </button>
      </div>

      {geoError && <p style={{ color: "#B23A3A", fontSize: 13, marginBottom: 8 }}>{geoError}</p>}

      <div style={{ height: 320, borderRadius: 12, overflow: "hidden" }}>
        <MapContainer center={center} zoom={17} style={{ height: "100%", width: "100%" }}>
          {layer === "street" ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}
          <Recenter lat={lat} lng={lng} />
          <DraggableMarker position={hasPosition ? [lat, lng] : null} onChange={onChange} />
        </MapContainer>
      </div>
      <p style={{ fontSize: 12, color: "#1557A0", marginTop: 6 }}>
        Drag the pin (or tap anywhere on the map) to fine-tune the exact outlet location.
        Switch to Satellite for a clearer view of the building.
      </p>
    </div>
  );
}
