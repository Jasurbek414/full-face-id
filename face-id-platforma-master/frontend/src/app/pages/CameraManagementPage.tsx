import React, { useState, useEffect, useCallback } from "react";
import {
  Camera, Plus, RefreshCw, Trash2, MapPin, X, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Loader2, Network, ScanFace, Copy, Check,
} from "lucide-react";
import { devicesAPI } from "../api/devices";

const BRAND = { primary: "#1A237E", accent: "#3949AB", teal: "#00897B", bg: "#F5F7FA" };

type Tab = "cameras" | "face_id";
type DeviceType = "camera" | "face_id";

interface Device {
  id: string;
  device_type: DeviceType;
  name: string;
  location: string;
  ip_address: string;
  port: number | null;
  mac_address: string;
  rtsp_url: string;
  device_username: string;
  face_threshold: number;
  check_type: string;
  connection_status: "online" | "offline" | "unknown";
  last_ping: string | null;
  is_active: boolean;
  api_key: string;
  created_at: string;
}

const emptyForm = {
  device_type: "face_id" as DeviceType,
  name: "",
  location: "",
  ip_address: "",
  port: "",
  mac_address: "",
  rtsp_url: "",
  device_username: "",
  device_password: "",
  face_threshold: "0.6",
  check_type: "both",
};

function StatusDot({ status }: { status: string }) {
  const color =
    status === "online" ? "#10B981" : status === "offline" ? "#EF4444" : "#9CA3AF";
  const label =
    status === "online" ? "Online" : status === "offline" ? "Offline" : "Noma'lum";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 8, height: 8, borderRadius: "50%", backgroundColor: color,
          boxShadow: status === "online" ? `0 0 6px ${color}` : "none",
        }}
      />
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function StyledInput({
  value, onChange, placeholder, type = "text", disabled,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box", border: "1.5px solid #E5E7EB",
        borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#111827",
        outline: "none", backgroundColor: disabled ? "#F5F7FA" : "#fff",
      }}
      onFocus={(e) => !disabled && (e.target.style.borderColor = "#3949AB")}
      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
    />
  );
}

function StyledSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", boxSizing: "border-box", border: "1.5px solid #E5E7EB",
        borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#111827",
        outline: "none", backgroundColor: "#fff", cursor: "pointer",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em",
      textTransform: "uppercase", marginBottom: 12, paddingBottom: 8,
      borderBottom: "1px solid #F3F4F6",
    }}>
      {children}
    </div>
  );
}

export function CameraManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("cameras");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; detail: string }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filtered = devices.filter((d) =>
    activeTab === "cameras" ? d.device_type === "camera" : d.device_type === "face_id"
  );

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await devicesAPI.list();
      setDevices(data.results || data || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const openModal = (type: DeviceType) => {
    setForm({ ...emptyForm, device_type: type });
    setFormError("");
    setShowPassword(false);
    setShowModal(true);
  };

  const setField = (key: keyof typeof emptyForm) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError("Qurilma nomi kiritilishi shart."); return; }
    if (!form.ip_address.trim()) { setFormError("IP manzil kiritilishi shart."); return; }
    setSubmitting(true);
    setFormError("");
    try {
      await devicesAPI.create({
        device_type: form.device_type,
        name: form.name,
        location: form.location,
        ip_address: form.ip_address,
        port: form.port ? Number(form.port) : null,
        mac_address: form.mac_address,
        rtsp_url: form.rtsp_url,
        device_username: form.device_username,
        device_password: form.device_password,
        face_threshold: Number(form.face_threshold),
        check_type: form.check_type,
      });
      setShowModal(false);
      fetchDevices();
    } catch (e: any) {
      const d = e.response?.data;
      setFormError(
        typeof d === "object"
          ? Object.values(d).flat().join(" ")
          : "Xatolik yuz berdi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestConnection = async (device: Device) => {
    setTestingId(device.id);
    try {
      const { data } = await devicesAPI.testConnection(device.id);
      setTestResult((p) => ({ ...p, [device.id]: data }));
      setDevices((p) =>
        p.map((d) => d.id === device.id ? { ...d, connection_status: data.connection_status } : d)
      );
    } catch {
      setTestResult((p) => ({
        ...p, [device.id]: { success: false, detail: "Server xatoligi." },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Qurilmani o'chirishni tasdiqlaysizmi?")) return;
    setDeletingId(id);
    try {
      await devicesAPI.delete(id);
      setDevices((p) => p.filter((d) => d.id !== id));
    } catch {
      alert("O'chirishda xatolik yuz berdi.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            Qurilmalar boshqaruvi
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Kameralar va Yuz ID qurilmalarini ulash va boshqarish
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchDevices}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8, border: "1.5px solid #E5E7EB",
              background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Yangilash
          </button>
          <button
            onClick={() => openModal(activeTab === "cameras" ? "camera" : "face_id")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8, border: "none",
              background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(26,35,126,0.25)",
            }}
          >
            <Plus size={15} />
            {activeTab === "cameras" ? "Kamera qo'shish" : "Yuz ID qo'shish"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #E5E7EB" }}>
        {([
          { id: "cameras" as Tab, label: "Kameralar", icon: Camera },
          { id: "face_id" as Tab, label: "Yuz ID qurilmalari", icon: ScanFace },
        ]).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const count = devices.filter((d) =>
            id === "cameras" ? d.device_type === "camera" : d.device_type === "face_id"
          ).length;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", border: "none", cursor: "pointer",
                background: "none", fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? BRAND.primary : "#6B7280",
                borderBottom: active ? `2px solid ${BRAND.primary}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              <Icon size={16} />
              {label}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                background: active ? BRAND.primary : "#E5E7EB",
                color: active ? "#fff" : "#6B7280",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Device list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Yuklanmoqda...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, border: "1.5px dashed #E5E7EB" }}>
          {activeTab === "cameras" ? <Camera size={40} color="#D1D5DB" /> : <ScanFace size={40} color="#D1D5DB" />}
          <div style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: "#374151" }}>
            Hali {activeTab === "cameras" ? "kamera" : "Yuz ID qurilmasi"} qo'shilmagan
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#9CA3AF" }}>
            Yuqoridagi tugmani bosib yangi qurilma qo'shing
          </div>
          <button
            onClick={() => openModal(activeTab === "cameras" ? "camera" : "face_id")}
            style={{
              marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Plus size={15} />
            {activeTab === "cameras" ? "Kamera qo'shish" : "Yuz ID qo'shish"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              testing={testingId === device.id}
              testResult={testResult[device.id]}
              deleting={deletingId === device.id}
              copiedKey={copiedKey}
              onTest={() => handleTestConnection(device)}
              onDelete={() => handleDelete(device.id)}
              onCopy={copyApiKey}
            />
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
              maxHeight: "92vh", overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid #E5E7EB",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "sticky", top: 0, background: "#fff", zIndex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {form.device_type === "camera" ? <Camera size={18} color="#fff" /> : <ScanFace size={18} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    {form.device_type === "camera" ? "Kamera qo'shish" : "Yuz ID qurilma qo'shish"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Tarmoq ma'lumotlarini to'ldirib ulanishni tekshiring
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Basic info */}
              <SectionTitle>Asosiy ma'lumotlar</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <FieldLabel>Qurilma nomi *</FieldLabel>
                  <StyledInput value={form.name} onChange={setField("name")} placeholder="Kirish kamerasi 1" />
                </div>
                <div>
                  <FieldLabel>Joylashuv</FieldLabel>
                  <StyledInput value={form.location} onChange={setField("location")} placeholder="1-qavat, asosiy kirish" />
                </div>
              </div>

              {/* Network */}
              <SectionTitle>Tarmoq sozlamalari</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <FieldLabel>IP manzil *</FieldLabel>
                  <StyledInput value={form.ip_address} onChange={setField("ip_address")} placeholder="192.168.1.100" />
                </div>
                <div>
                  <FieldLabel>Port</FieldLabel>
                  <StyledInput
                    value={form.port}
                    onChange={setField("port")}
                    placeholder={form.device_type === "camera" ? "554 (RTSP)" : "80 (HTTP)"}
                    type="number"
                  />
                </div>
                <div>
                  <FieldLabel>MAC manzil</FieldLabel>
                  <StyledInput value={form.mac_address} onChange={setField("mac_address")} placeholder="AA:BB:CC:DD:EE:FF" />
                </div>
                {form.device_type === "camera" && (
                  <div>
                    <FieldLabel>RTSP URL</FieldLabel>
                    <StyledInput
                      value={form.rtsp_url}
                      onChange={setField("rtsp_url")}
                      placeholder="rtsp://192.168.1.100:554/stream1"
                    />
                  </div>
                )}
              </div>

              {/* Device login */}
              <SectionTitle>Qurilma login ma'lumotlari</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <FieldLabel>Login (username)</FieldLabel>
                  <StyledInput value={form.device_username} onChange={setField("device_username")} placeholder="admin" />
                </div>
                <div>
                  <FieldLabel>Parol</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <StyledInput
                      type={showPassword ? "text" : "password"}
                      value={form.device_password}
                      onChange={setField("device_password")}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <SectionTitle>Qurilma sozlamalari</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <div>
                  <FieldLabel>Tekshiruv turi</FieldLabel>
                  <StyledSelect
                    value={form.check_type}
                    onChange={setField("check_type")}
                    options={[
                      { value: "both", label: "Kirish & Chiqish" },
                      { value: "entry", label: "Faqat kirish" },
                      { value: "exit", label: "Faqat chiqish" },
                    ]}
                  />
                </div>
                {form.device_type === "face_id" && (
                  <div>
                    <FieldLabel>Yuz aniqlash chegarasi: {Number(form.face_threshold).toFixed(2)}</FieldLabel>
                    <input
                      type="range" min="0.4" max="0.9" step="0.05"
                      value={form.face_threshold}
                      onChange={(e) => setField("face_threshold")(e.target.value)}
                      style={{ width: "100%", marginTop: 8, accentColor: BRAND.primary }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF" }}>
                      <span>Yumshoq (0.4)</span><span>Qattiq (0.9)</span>
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 8, padding: "10px 14px", color: "#DC2626",
                  fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={14} /> {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 20px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                    background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: "10px 24px", borderRadius: 8, border: "none",
                    background: submitting ? "#9CA3AF" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: submitting ? "none" : "0 2px 8px rgba(26,35,126,0.3)",
                  }}
                >
                  {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DeviceCard({
  device, testing, testResult, deleting, copiedKey, onTest, onDelete, onCopy,
}: {
  device: Device;
  testing: boolean;
  testResult?: { success: boolean; detail: string };
  deleting: boolean;
  copiedKey: string | null;
  onTest: () => void;
  onDelete: () => void;
  onCopy: (key: string) => void;
}) {
  const isCamera = device.device_type === "camera";

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden",
    }}>
      {/* Top */}
      <div style={{
        padding: "14px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid #F3F4F6",
        background: "linear-gradient(135deg, #F8F9FF 0%, #F0F2FF 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, #1A237E, #00897B)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isCamera ? <Camera size={18} color="#fff" /> : <ScanFace size={18} color="#fff" />}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{device.name}</div>
            {device.location && (
              <div style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={11} /> {device.location}
              </div>
            )}
          </div>
        </div>
        <StatusDot status={device.connection_status} />
      </div>

      {/* Network info grid */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { label: "IP manzil", value: device.ip_address || "—" },
            { label: "Port", value: device.port != null ? String(device.port) : "—" },
            { label: "MAC manzil", value: device.mac_address || "—" },
            {
              label: "Tekshiruv",
              value: device.check_type === "both" ? "Kirish & Chiqish"
                : device.check_type === "entry" ? "Kirish" : "Chiqish",
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 13, color: "#374151", fontWeight: 500, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        {isCamera && device.rtsp_url && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>RTSP URL</div>
            <div style={{
              fontSize: 11, color: "#6B7280", fontFamily: "monospace",
              background: "#F5F7FA", padding: "5px 8px", borderRadius: 6, marginTop: 4,
              wordBreak: "break-all",
            }}>
              {device.rtsp_url}
            </div>
          </div>
        )}

        {/* API Key */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 4 }}>API Kalit</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              flex: 1, fontSize: 11, fontFamily: "monospace", color: "#6B7280",
              background: "#F5F7FA", padding: "5px 8px", borderRadius: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {device.api_key.slice(0, 24)}…
            </div>
            <button
              onClick={() => onCopy(device.api_key)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}
              title="Nusxa olish"
            >
              {copiedKey === device.api_key ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Test result banner */}
        {testResult && (
          <div style={{
            padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 12,
            background: testResult.success ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${testResult.success ? "#A7F3D0" : "#FECACA"}`,
            color: testResult.success ? "#059669" : "#DC2626",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {testResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {testResult.detail}
          </div>
        )}

        {device.last_ping && (
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>
            Oxirgi tekshiruv: {new Date(device.last_ping).toLocaleString("uz-UZ")}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onTest}
            disabled={testing}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8,
              border: `1.5px solid #3949AB`, background: "#fff",
              color: "#3949AB", fontSize: 12, fontWeight: 700,
              cursor: testing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {testing
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Tekshirilmoqda...</>
              : <><Network size={13} /> Ulanishni tekshirish</>
            }
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              border: "1.5px solid #FECACA", background: "#fff",
              color: "#DC2626", cursor: deleting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {deleting
              ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
              : <Trash2 size={13} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
