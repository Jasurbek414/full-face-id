import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
  valueColor?: string;
}

export function KPICard({ icon, value, label, trend, trendLabel, iconBg = "#EEF0FB", valueColor = "#111827" }: KPICardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 12,
              fontWeight: 500,
              color: isPositive ? "#2E7D32" : "#B71C1C",
              backgroundColor: isPositive ? "#E8F5E9" : "#FFEBEE",
              padding: "3px 8px",
              borderRadius: 100,
            }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: valueColor, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{label}</div>
        {trendLabel && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{trendLabel}</div>}
      </div>
    </div>
  );
}
