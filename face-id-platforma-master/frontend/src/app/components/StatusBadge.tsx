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
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap
        ${size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}
      `}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span
        className={`rounded-full shrink-0 ${size === "sm" ? "w-1.5 h-1.5" : "w-1.5 h-1.5"}`}
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}
