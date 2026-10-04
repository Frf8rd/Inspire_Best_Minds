import React from "react";
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";

const PRIORITY_CONFIG = {
  LOW: { label: "Scăzută", bg: "#eff6ff", color: "#2563eb", icon: ArrowDown },
  MEDIUM: { label: "Medie", bg: "#fefce8", color: "#ca8a04", icon: ArrowUp },
  HIGH: { label: "Ridicată", bg: "#fff7ed", color: "#ea580c", icon: AlertTriangle },
  CRITICAL: { label: "Critică", bg: "#fef2f2", color: "#dc2626", icon: AlertCircle },
};

export function PriorityBadge({ priority, score }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
  const Icon = config.icon;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      <Icon size={12} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.8, fontSize: "0.83em", marginLeft: "2px" }}>
          ({score})
        </span>
      )}
    </span>
  );
}
