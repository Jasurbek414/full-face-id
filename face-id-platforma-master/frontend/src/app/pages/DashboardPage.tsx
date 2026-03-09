import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, Clock, UserX, Timer, Camera, Scan } from "lucide-react";
import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";
import { useWeeklySummary } from "../hooks/useReports";
import { formatTime } from "../utils/time";

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
  bg: "#F5F7FA",
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  "Face ID": <Scan size={12} />,
  PIN: <span style={{ fontSize: 10 }}>PIN</span>,
  Manual: <span style={{ fontSize: 10 }}>MNL</span>,
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [liveCheckins, setLiveCheckins] = useState<any[]>([]);
  const { data: weeklyAttendanceData } = useWeeklySummary();

  useEffect(() => {
    // Dashboard stats
    apiClient.get("/api/v1/companies/list/stats/")
      .then(r => setStats(r.data))
      .catch((err) => console.warn("Stats API failed:", err));

    // Live check-ins
    apiClient.get("/api/v1/attendance/live/")
      .then(r => setLiveCheckins(r.data.results || []))
      .catch((err) => console.warn("Live attendance API failed:", err));
  }, []);

  const displayCheckIns = liveCheckins.map(r => ({
    id: r.id,
    name: r.user_name,
    avatar: r.user_photo || "",
    time: r.check_in ? formatTime(r.check_in) : "—",
    status: r.status as any,
    method: r.check_in_method || "Manual"
  }));

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>System Overview</p>
        </div>
        <button
          onClick={() => navigate("/app/attendance")}
          style={{
            padding: "9px 18px",
            backgroundColor: BRAND.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Clock size={15} />
          View Attendance
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard
          icon={<Users size={22} color={BRAND.primary} />}
          value={stats?.present_today ?? "—"}
          label="Present Today"
          trend={3.2}
          trendLabel="vs yesterday"
          iconBg="#EEF0FB"
          valueColor={BRAND.primary}
        />
        <KPICard
          icon={<Clock size={22} color="#E65100" />}
          value={stats?.late_today ?? "—"}
          label="Late Arrivals"
          trend={-8.5}
          trendLabel="vs yesterday"
          iconBg="#FFF3E0"
          valueColor="#E65100"
        />
        <KPICard
          icon={<UserX size={22} color="#B71C1C" />}
          value={stats?.absent_today ?? "—"}
          label="Absent"
          trend={-1}
          trendLabel="vs yesterday"
          iconBg="#FFEBEE"
          valueColor="#B71C1C"
        />
        <KPICard
          icon={<Timer size={22} color={BRAND.teal} />}
          value="1,284h"
          label="Total Hours"
          trend={2.1}
          trendLabel="this week"
          iconBg="#E0F2F1"
          valueColor={BRAND.teal}
        />
      </div>

      {/* Charts + Live Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        {/* Bar Chart */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Weekly Attendance</h3>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Last 7 Days</p>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
              {[
                { color: `rgba(26,35,126,0.7)`, label: "Present" },
                { color: `rgba(255,109,0,0.7)`, label: "Late" },
                { color: `rgba(213,0,0,0.6)`, label: "Absent" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
                  <span style={{ color: "#6B7280" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyAttendanceData} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
                cursor={{ fill: "#F5F7FA" }}
              />
              <Bar dataKey="present" name="Present" fill="rgba(26,35,126,0.7)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="Late" fill="rgba(255,109,0,0.7)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="rgba(213,0,0,0.6)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live Feed */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Live Check-ins</h3>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Real-time feed</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#00C853",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: 11, color: "#00C853", fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {displayCheckIns.length === 0 ? (
              <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 20 }}>No check-ins yet today.</div>
            ) : displayCheckIns.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 10px",
                  borderRadius: 8,
                  backgroundColor: i % 2 === 0 ? "#fff" : "#F9FAFB",
                  transition: "background 0.1s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EEF0FB")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#fff" : "#F9FAFB")}
              >
                <UserAvatar src={item.avatar} name={item.name} size={34} status="inside" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                    <Camera size={10} color="#9CA3AF" />
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.method}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.time}</div>
                  <div style={{ marginTop: 2 }}>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/app/attendance")}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "8px",
              borderRadius: 8,
              border: `1.5px solid #E8EAF0`,
              backgroundColor: "#fff",
              color: BRAND.accent,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View All Records →
          </button>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 20 }}>
        {/* Department breakdown */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>By Department</h3>
          {(stats?.department_breakdown || []).map((item: any, idx: number) => {
            const present = item.present || 0;
            const total = item.total || 0;
            const dept = item.department_name || item.dept || "Unknown";
            const color = [BRAND.primary, BRAND.teal, "#8E24AA", "#F57C00", "#2E7D32"][idx % 5];
            return (
              <div key={dept} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#374151" }}>{dept}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{present}/{total}</span>
                </div>
                <div style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3 }}>
                  <div
                    style={{
                      height: "100%",
                      width: total > 0 ? `${(present / total) * 100}%` : "0%",
                      backgroundColor: color,
                      borderRadius: 3,
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {(!stats?.department_breakdown || stats.department_breakdown.length === 0) && (
            <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>No data available</div>
          )}
        </div>

        {/* Check-in methods */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Check-in Methods</h3>
          {(stats?.checkin_methods || []).map((item: any, idx: number) => {
            const method = item.method || item.name || "Unknown";
            const count = item.count || 0;
            const pct = item.pct || item.percentage || 0;
            const color = [BRAND.primary, BRAND.teal, "#9CA3AF"][idx % 3];
            const icon = method === "Face ID" ? <Scan size={14} /> : null;
            return (
              <div key={method} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: `${color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon || <span style={{ fontSize: 11, fontWeight: 700, color }}>{method.slice(0, 1)}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{method}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3, opacity: 0.75 }} />
                  </div>
                </div>
              </div>
            );
          })}
          {(!stats?.checkin_methods || stats.checkin_methods.length === 0) && (
            <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>No data available</div>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Quick Actions</h3>
          {[
            { label: "Run Attendance Report", icon: "📊", to: "/app/reports", color: BRAND.primary },
            { label: "View Live Monitoring", icon: "📡", to: "/app/monitoring", color: BRAND.teal },
            { label: "Manage Cameras", icon: "📹", to: "/app/cameras", color: "#8E24AA" },
            { label: "Employee Profiles", icon: "👥", to: "/app/employees/1", color: "#F57C00" },
          ].map(({ label, icon, to, color }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #E8EAF0",
                backgroundColor: "#fff",
                cursor: "pointer",
                marginBottom: 8,
                textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F5F7FA";
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#E8EAF0";
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
              <span style={{ marginLeft: "auto", color: "#9CA3AF", fontSize: 12 }}>→</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
