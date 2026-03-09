import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  ArrowLeft,
  Edit2,
  Clock,
  TrendingUp,
  Scan,
} from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { StatusBadge } from "../components/StatusBadge";
import { useEmployees } from "../hooks/useEmployees";
import { apiClient } from "../api/client";
// import { employees, attendanceRecords, monthlyCalendar } from "../data/mockData"; // Removed mock data

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
  bg: "#F5F7FA",
};

const STATUS_COLOR: Record<string, string> = {
  "on_time": "#00C853",
  "late": "#FF6D00",
  "absent": "#D50000",
  "off": "#E0E0E0",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function EmployeeProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { get, enrollFace, deleteFace, getAttendance, loading: actionLoading } = useEmployees();

  const [emp, setEmp] = useState<any>(null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "records">("calendar");
  const [empRecords, setEmpRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await get(id);
      setEmp(data);
      setFaceEnrolled(!!data.has_face_encoding);

      const history = await getAttendance(id);
      setEmpRecords(history.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleFaceEnroll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !id) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
      try {
        await enrollFace(id, base64String);
        setFaceEnrolled(true);
        alert("Face ID muvaffaqiyatli saqlandi!");
      } catch (err: any) {
        alert("Xato: " + (err.response?.data?.error || err.message));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaceDelete = async () => {
    if (!id || !window.confirm("Face ID ma'lumotlarini o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteFace(id);
      setFaceEnrolled(false);
    } catch (err: any) {
      alert("Xato: " + err.message);
    }
  };

  if (loading || !emp) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Yuklanmoqda...</div>;
  }

  // Simplified stats for demonstration based on fetched records
  const presentCount = empRecords.filter((r) => r.status === "on_time").length;
  const lateCount = empRecords.filter((r) => r.status === "late").length;
  const absentCount = empRecords.filter((r) => r.status === "absent").length;
  const offCount = 0; // Mock for now or use real data if available

  const deptName = typeof emp.department === 'object' ? emp.department?.name : emp.department ?? 'General';
  const roleName = typeof emp.system_role === 'object' ? emp.system_role?.name : emp.system_role ?? 'User';

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1.5px solid #E8EAF0",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} color="#6B7280" />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Employee Profile</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>View and manage employee details</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (window.confirm("Xodimni faolsizlantirishni (deactivate) tasdiqlaysizmi?")) {
                apiClient.put(`/api/v1/employees/${id}/`, { is_active: false })
                  .then(() => {
                    alert("Xodim faolsizlantirildi");
                    fetchProfile();
                  })
                  .catch((err: any) => alert("Xato: " + (err.response?.data?.detail || err.message)));
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px solid #FFCDD2",
              backgroundColor: "#FFF5F5",
              color: "#D50000",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Deactivate
          </button>

          <button
            onClick={() => {
              const newName = prompt("Yangi ism sharif:", `${emp.first_name} ${emp.last_name}`);
              const newDept = prompt("Yangi bo'lim:", deptName);
              if (newName || newDept) {
                const body: any = {};
                if (newName) {
                  body.first_name = newName.split(' ')[0];
                  body.last_name = newName.split(' ').slice(1).join(' ') || '';
                }
                if (newDept) body.department = newDept;

                apiClient.put(`/api/v1/employees/${id}/`, body)
                  .then(() => {
                    alert("Profil yangilandi");
                    fetchProfile();
                  })
                  .catch((err: any) => alert("Xato: " + (err.response?.data?.detail || err.message)));
              }
            }}
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
            <Edit2 size={14} />
            Edit Profile
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Avatar card */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "28px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${BRAND.primary} 0%, #283593 100%)`,
                margin: "-28px -24px 20px",
                padding: "24px 24px 0",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <div style={{ width: 84, height: 84, margin: "0 auto 16px", position: "relative" }}>
                <img
                  src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.first_name + " " + emp.last_name)}&background=3949AB&color=fff&size=84`}
                  alt={emp.first_name}
                  style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: emp.is_active ? "#00C853" : "#9CA3AF",
                    border: "2px solid #fff",
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{emp.first_name} {emp.last_name}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{roleName}</div>
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={emp.today_status} />
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "8px 12px",
                backgroundColor: BRAND.bg,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              <Building2 size={13} color="#9CA3AF" />
              {deptName} · ID: {emp.id.slice(0, 8)}
            </div>
          </div>

          {/* Face ID Card */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Face ID Enrollment</span>
              {faceEnrolled ? (
                <CheckCircle size={18} color="#00C853" />
              ) : (
                <span style={{ fontSize: 11, color: "#D50000", fontWeight: 600 }}>NOT SET</span>
              )}
            </div>
            {faceEnrolled ? (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    backgroundColor: "#E8F5E9",
                    borderRadius: 8,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "#2E7D32",
                  }}
                >
                  <Scan size={14} />
                  Face biometric enrolled
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>
                No face data enrolled. Click below to set up Face ID for this employee.
              </p>
            )}

            <input
              type="file"
              id="face-upload"
              hidden
              accept="image/*"
              onChange={handleFaceEnroll}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => document.getElementById('face-upload')?.click()}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: `1.5px solid ${BRAND.teal}`,
                  backgroundColor: faceEnrolled ? "#fff" : "#F0FDF9",
                  color: BRAND.teal,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Camera size={15} />
                {faceEnrolled ? "Re-enroll" : "Enroll Face"}
              </button>

              {faceEnrolled && (
                <button
                  onClick={handleFaceDelete}
                  disabled={actionLoading}
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    border: '1.5px solid #FFCDD2',
                    backgroundColor: '#FFF5F5',
                    color: '#D32F2F',
                    cursor: 'pointer',
                  }}
                >
                  O'chirish
                </button>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 14px" }}>Contact Details</h4>
            {[
              { icon: <Mail size={14} color="#9CA3AF" />, label: "Email", value: emp.email || "No email" },
              { icon: <Phone size={14} color="#9CA3AF" />, label: "Phone", value: emp.phone },
              { icon: <Calendar size={14} color="#9CA3AF" />, label: "Joined", value: new Date(emp.join_date || emp.date_joined).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
              { icon: <Clock size={14} color="#9CA3AF" />, label: "Last Check-in", value: emp.last_check_in || "Not checked in" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ paddingTop: 2, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 1 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Monthly stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Present", value: presentCount, color: "#00C853", bg: "#E8F5E9" },
              { label: "Late", value: lateCount, color: "#FF6D00", bg: "#FFF3E0" },
              { label: "Absent", value: absentCount, color: "#D50000", bg: "#FFEBEE" },
              { label: "Days Off", value: offCount, color: "#9E9E9E", bg: "#F5F5F5" },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{label}</div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 6,
                    padding: "2px 8px",
                    borderRadius: 100,
                    backgroundColor: bg,
                    fontSize: 11,
                    color,
                  }}
                >
                  This month
                </div>
              </div>
            ))}
          </div>

          {/* Calendar heatmap */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>March 2026 Attendance</h3>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Attendance heatmap</p>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9CA3AF" }}>
                {[
                  { label: "On Time", color: "#00C853" },
                  { label: "Late", color: "#FF6D00" },
                  { label: "Absent", color: "#D50000" },
                  { label: "Off", color: "#E0E0E0" },
                ].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Weekday headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid — Placeholder */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Array(31).fill(null).map((_, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 8,
                    backgroundColor: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9CA3AF",
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Recent records table */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Recent Records</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <TrendingUp size={14} color={BRAND.teal} />
                <span style={{ fontSize: 12, color: BRAND.teal, fontWeight: 600 }}>98.2% attendance rate</span>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Date", "Check-in", "Check-out", "Duration", "Status", "Method"].map((h) => (
                    <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empRecords.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB", backgroundColor: i % 2 === 0 ? "#fff" : BRAND.bg }}>
                    <td style={{ padding: "10px 0", fontSize: 13, color: "#374151" }}>
                      {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "10px 0", fontSize: 13, color: "#374151" }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, color: "#374151" }}>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, color: "#374151" }}>{r.net_seconds ? `${Math.floor(r.net_seconds / 3600)}h ${Math.floor((r.net_seconds % 3600) / 60)}m` : "—"}</td>
                    <td style={{ padding: "10px 0" }}><StatusBadge status={r.status} size="sm" /></td>
                    <td style={{ padding: "10px 0", fontSize: 12, color: "#6B7280" }}>{r.check_in_method || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}