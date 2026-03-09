import React from "react";

type AttendanceStatus = "on-time" | "late" | "absent" | "off" | "pending" | "approved" | "rejected" | "draft" | "paid" | "inside" | "outside" | "online" | "offline";

interface StatusBadgeProps {
  status: AttendanceStatus | string;
  size?: "sm" | "md";
}

const configs: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  "on-time": { label: "On Time", bg: "#E8F5E9", color: "#2E7D32", dot: "#00C853" },
  late: { label: "Late", bg: "#FFF3E0", color: "#E65100", dot: "#FF6D00" },
  absent: { label: "Absent", bg: "#FFEBEE", color: "#B71C1C", dot: "#D50000" },
  off: { label: "Off", bg: "#F5F5F5", color: "#616161", dot: "#9E9E9E" },
  inside: { label: "Inside", bg: "#E8F5E9", color: "#2E7D32", dot: "#00C853" },
  outside: { label: "Outside", bg: "#E3F2FD", color: "#1565C0", dot: "#1976D2" },
  online: { label: "Online", bg: "#E8F5E9", color: "#2E7D32", dot: "#00C853" },
  offline: { label: "Offline", bg: "#FFEBEE", color: "#B71C1C", dot: "#D50000" },
  pending: { label: "Pending", bg: "#FFF3E0", color: "#E65100", dot: "#FF6D00" },
  approved: { label: "Approved", bg: "#E8F5E9", color: "#2E7D32", dot: "#00C853" },
  rejected: { label: "Rejected", bg: "#FFEBEE", color: "#B71C1C", dot: "#D50000" },
  draft: { label: "Draft", bg: "#F5F5F5", color: "#616161", dot: "#9E9E9E" },
  paid: { label: "Paid", bg: "#E8F5E9", color: "#2E7D32", dot: "#00C853" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const cfg = configs[status] || configs["off"];
  const padding = size === "sm" ? "3px 8px" : "4px 10px";
  const fontSize = size === "sm" ? "11px" : "12px";
  const dotSize = size === "sm" ? "5px" : "6px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        backgroundColor: cfg.bg,
        color: cfg.color,
        padding,
        borderRadius: "100px",
        fontSize,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
