import React from "react";

const STATUS_CONFIG = {
  NEW: { label: "Nouă", bg: "#dbeafe", color: "#1e40af" },
  IN_REVIEW: { label: "În verificare", bg: "#f3e8ff", color: "#6b21a8" },
  CONFIRMED: { label: "Confirmată", bg: "#cffaffe", color: "#155e75" },
  ASSIGNED: { label: "Repartizată", bg: "#e0e7ff", color: "#3730a3" },
  IN_PROGRESS: { label: "În lucru", bg: "#fef9c3", color: "#854d0e" },
  RESOLVED_PENDING_CONFIRMATION: { label: "Așteaptă confirmarea", bg: "#ffedd5", color: "#9a3412" },
  RESOLVED: { label: "Rezolvată", bg: "#dcfce7", color: "#166534" },
  REOPENED: { label: "Redeschisă", bg: "#fce7f3", color: "#9d174d" },
  REJECTED: { label: "Respinsă", bg: "#f1f5f9", color: "#475569" },
  DUPLICATE: { label: "Duplicat", bg: "#e2e8f0", color: "#64748b" },
  NEEDS_INFO: { label: "Necesită info", bg: "#fef3c7", color: "#92400e" },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: "#e2e8f0", color: "#334155" };

  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
