import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, RefreshCw, Filter, MapPin, Clock } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import { useLiveAttendance } from "../hooks/useAttendance";
import { useAttendanceWebSocket } from "../hooks/useWebSocket";
import { formatTime } from "../utils/time";

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
  bg: "#F5F7FA",
};

export function LiveMonitoringPage() {
  const navigate = useNavigate();
  const { data: liveData, loading, refetch } = useLiveAttendance();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "inside" | "outside">("all");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [spinning, setSpinning] = useState(false);

  // WebSocket for real-time updates
  useAttendanceWebSocket((msg) => {
    if (msg.type === "attendance.check_in" || msg.type === "attendance.check_out") {
      refetch();
    }
  });

  const handleRefresh = async () => {
    setSpinning(true);
    await refetch();
    setLastUpdate(new Date());
    setSpinning(false);
  };

  const employees = liveData.map((emp: any) => ({
    id: emp.id,
    name: emp.user_name,
    department: typeof emp.department === 'object' ? emp.department?.name : emp.department || emp.department_name || "General",
    role: typeof emp.system_role === 'object' ? emp.system_role?.name : typeof emp.role === 'object' ? emp.role?.name : emp.system_role || emp.role || "Employee",
    avatar: emp.user_photo || "",
    status: ((emp.check_in && !emp.check_out) ? "inside" : "outside") as "inside" | "outside",
    checkIn: emp.check_in ? formatTime(emp.check_in) : "",
    checkOut: emp.check_out ? formatTime(emp.check_out) : null,
  }));

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.department.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || emp.status === filter;
    return matchSearch && matchFilter;
  });

  const inside = employees.filter((e) => e.status === "inside").length;
  const outside = employees.filter((e) => e.status === "outside").length;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Live Monitoring</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Real-time employee location tracking — Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 8,
            border: "1.5px solid #E8EAF0",
            backgroundColor: "#fff",
            color: "#374151",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} style={{ animation: spinning ? "spin 0.8s linear" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Employees", value: employees.length, color: "#374151", bg: "#fff" },
          { label: "Inside Office", value: inside, color: "#2E7D32", bg: "#E8F5E9" },
          { label: "Outside / Away", value: outside, color: "#1565C0", bg: "#E3F2FD" },
          { label: "Absent Today", value: 7, color: "#B71C1C", bg: "#FFEBEE" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: "12px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color,
              }}
            >
              {value}
            </div>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#fff",
            border: "1.5px solid #E8EAF0",
            borderRadius: 8,
            padding: "8px 14px",
            flex: 1,
            maxWidth: 340,
          }}
        >
          <Search size={15} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", width: "100%", backgroundColor: "transparent" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, backgroundColor: "#fff", border: "1.5px solid #E8EAF0", borderRadius: 8, padding: 4 }}>
          {(["all", "inside", "outside"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: filter === f ? BRAND.primary : "transparent",
                color: filter === f ? "#fff" : "#6B7280",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All" : f === "inside" ? "Inside" : "Outside"}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {filtered.map((emp) => (
          <div
            key={emp.id}
            onClick={() => navigate(`/app/employees/${emp.id}`)}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              border: emp.status === "inside" ? "1.5px solid transparent" : "1.5px solid #E8EAF0",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }}
          >
            {/* Status bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: emp.status === "inside" ? "#00C853" : "#1976D2",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 4 }}>
              <UserAvatar src={emp.avatar} name={emp.name} size={56} status={emp.status} />
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{emp.role}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <StatusBadge status={emp.status as any} />
              </div>
              <div style={{ marginTop: 10, width: "100%", borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={11} style={{ marginRight: 3 }} />
                    {emp.checkIn || "—"}
                  </div>
                  <div>
                    <MapPin size={11} style={{ marginRight: 2 }} />
                    {emp.department}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
          <Clock size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14 }}>Hozir hech kim ishda emas</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
          <Filter size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14 }}>No employees match your search</p>
        </div>
      ) : null}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
