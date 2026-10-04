import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { assetUrl } from "../api/client.js";

// Titlul/adresa vin de la utilizatori și ajung în HTML-ul popup-ului: trebuie escapate.
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);

// Priority marker color map
const PRIORITY_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#3b82f6",
};

const STATUS_LABELS = {
  NEW: "Nouă",
  IN_REVIEW: "În verificare",
  CONFIRMED: "Confirmată",
  ASSIGNED: "Repartizată",
  IN_PROGRESS: "În lucru",
  RESOLVED_PENDING_CONFIRMATION: "Așteaptă confirmarea",
  RESOLVED: "Rezolvată",
  REOPENED: "Redeschisă",
  REJECTED: "Respinsă",
  DUPLICATE: "Duplicat",
  NEEDS_INFO: "Necesită info",
};

function createCustomPinIcon(priority = "LOW", isSelected = false) {
  const color = isSelected ? "#2563eb" : (PRIORITY_COLORS[priority] || "#3b82f6");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="42">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40],
  });
}

export function LeafletMap({
  problems = [],
  center = [47.0245, 28.8322], // Default Chisinau/Moldova coordinates
  zoom = 13,
  height = "450px",
  selectable = false,
  selectedPosition = null,
  onPositionSelect = null,
  onMarkerClick = null,
  // Apelat (debounced) la încărcare și după fiecare mișcare/zoom, cu { minLat, maxLat, minLng, maxLng }.
  onBoundsChange = null,
  // Dacă harta e controlată prin bounding box, nu trebuie să se recentreze singură pe markere.
  fitToMarkers = true,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const selectionMarkerRef = useRef(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      let timer = null;
      const emitBounds = () => {
        const cb = onBoundsChangeRef.current;
        if (!cb) return;
        const b = map.getBounds();
        cb({
          minLat: Number(b.getSouth().toFixed(5)),
          maxLat: Number(b.getNorth().toFixed(5)),
          minLng: Number(b.getWest().toFixed(5)),
          maxLng: Number(b.getEast().toFixed(5)),
        });
      };
      map.on("moveend", () => {
        clearTimeout(timer);
        timer = setTimeout(emitBounds, 300);
      });
      map.whenReady(emitBounds);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle click to select location in selectable mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectable || !onPositionSelect) return;

    const handleClick = (e) => {
      const { lat, lng } = e.latlng;
      onPositionSelect({ latitude: lat, longitude: lng });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [selectable, onPositionSelect]);

  // Handle selectedPosition marker in picker mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectionMarkerRef.current) {
      map.removeLayer(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
    }

    if (selectedPosition && selectedPosition.latitude && selectedPosition.longitude) {
      const marker = L.marker([selectedPosition.latitude, selectedPosition.longitude], {
        icon: createCustomPinIcon("HIGH", true),
        draggable: true,
      }).addTo(map);

      if (onPositionSelect) {
        marker.on("dragend", (e) => {
          const latLng = e.target.getLatLng();
          onPositionSelect({ latitude: latLng.lat, longitude: latLng.lng });
        });
      }

      selectionMarkerRef.current = marker;
      map.panTo([selectedPosition.latitude, selectedPosition.longitude]);
    }
  }, [selectedPosition, onPositionSelect]);

  // Handle problems markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (problems.length === 0) return;

    const bounds = L.latLngBounds();

    problems.forEach((problem) => {
      if (!problem.latitude || !problem.longitude) return;

      const position = [problem.latitude, problem.longitude];
      bounds.extend(position);

      const icon = createCustomPinIcon(problem.priority);
      const marker = L.marker(position, { icon }).addTo(map);

      const code = problem.code || `#UP-${String(problem.number || 0).padStart(4, "0")}`;
      const photoUrl = assetUrl(problem.photos?.[0]?.publicPath);

      const popupHtml = `
        <div style="width: 240px; font-family: system-ui, sans-serif;">
          ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" style="width:100%; height:120px; object-fit:cover; border-radius:6px 6px 0 0;" />` : ""}
          <div style="padding: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:700; font-size:0.75rem; color:#2563eb;">${escapeHtml(code)}</span>
              <span style="font-size:0.7rem; font-weight:600; padding:2px 6px; border-radius:10px; background:#f1f5f9; color:#475569;">
                ${escapeHtml(STATUS_LABELS[problem.status] || problem.status)}
              </span>
            </div>
            <h4 style="margin:0 0 6px 0; font-size:0.95rem; font-weight:700; color:#0f172a; line-height:1.2;">${escapeHtml(problem.title)}</h4>
            <p style="margin:0 0 8px 0; font-size:0.75rem; color:#64748b;">${escapeHtml(problem.address || "Nesemnată")}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span style="font-size:0.75rem; font-weight:600; color:#10b981;">👍 +${problem.supportCount || 0} susțineri</span>
              <a href="/problems/${escapeHtml(problem.id)}" style="font-size:0.8rem; font-weight:600; color:#2563eb; text-decoration:none;">Detalii &rarr;</a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(problem));
      }

      markersRef.current.push(marker);
    });

    if (fitToMarkers && problems.length > 1 && !selectedPosition) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [problems, onMarkerClick]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px", zIndex: 1 }} />
      {selectable && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)",
            padding: "8px 14px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          📍 Dă click pe hartă pentru a plasa pinul
        </div>
      )}
    </div>
  );
}
