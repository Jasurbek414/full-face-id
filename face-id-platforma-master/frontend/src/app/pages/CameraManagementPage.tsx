import React, { useState, useEffect, useCallback } from "react";
import {
  Camera, Plus, RefreshCw, Trash2, MapPin, X, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Loader2, Network, ScanFace, Copy, Check,
} from "lucide-react";
import { devicesAPI } from "../api/devices";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

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
  const { t } = useLanguage();
  const isOnline = status === "online";
  const isOffline = status === "offline";
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
        isOffline ? "bg-rose-500" : "bg-slate-400"
      }`} />
      <span className={`text-xs font-semibold ${
        isOnline ? "text-emerald-600 dark:text-emerald-400" : 
        isOffline ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
      }`}>
        {isOnline ? "Online" : isOffline ? "Offline" : t('unknown')}
      </span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
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
      className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all outline-none
        ${disabled 
          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        }`}
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
      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
      {children}
    </div>
  );
}

export function CameraManagementPage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
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
    if (!form.name.trim()) { setFormError(t('deviceNameRequired') || "Qurilma nomi kiritilishi shart."); return; }
    if (!form.ip_address.trim()) { setFormError(t('ipRequired') || "IP manzil kiritilishi shart."); return; }
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
          : t('errorOccurred')
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
        ...p, [device.id]: { success: false, detail: t('serverError') || "Server xatoligi." },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDeleteDevice'))) return;
    setDeletingId(id);
    try {
      await devicesAPI.delete(id);
      setDevices((p) => p.filter((d) => d.id !== id));
    } catch {
      alert(t('errorOccurred'));
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
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('devicesManagement')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('devicesSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {t('refresh')}
          </button>
          <button
            onClick={() => openModal(activeTab === "cameras" ? "camera" : "face_id")}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all active:scale-95 border-none cursor-pointer"
          >
            <Plus size={18} />
            {activeTab === "cameras" ? t('addCamera') : t('addFaceId')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "cameras" as Tab, label: t('cameras'), icon: Camera },
          { id: "face_id" as Tab, label: t('faceIdDevices'), icon: ScanFace },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const count = devices.filter((d) =>
            id === "cameras" ? d.device_type === "camera" : d.device_type === "face_id"
          ).length;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-6 py-3 text-sm font-bold transition-all relative border-none bg-transparent cursor-pointer
                ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <Icon size={18} />
              {label}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                ${active ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {count}
              </span>
              {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Device list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p className="text-sm font-medium">{t('loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
            {activeTab === "cameras" ? <Camera size={32} className="text-slate-300" /> : <ScanFace size={32} className="text-slate-300" />}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('noDevices')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs mb-8">
            {t('addFirstDevice')}
          </p>
          <button
            onClick={() => openModal(activeTab === "cameras" ? "camera" : "face_id")}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 border-none cursor-pointer"
          >
            <Plus size={18} />
            {activeTab === "cameras" ? t('addCamera') : t('addFaceId')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  {form.device_type === "camera" ? <Camera size={20} /> : <ScanFace size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {form.device_type === "camera" ? t('addCamera') : t('addFaceId')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('networkSettings')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {/* Basic Section */}
              <SectionTitle>{t('profileData')}</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <FieldLabel>{t('deviceName')} *</FieldLabel>
                  <StyledInput value={form.name} onChange={setField("name")} placeholder="..." />
                </div>
                <div>
                  <FieldLabel>{t('location')}</FieldLabel>
                  <StyledInput value={form.location} onChange={setField("location")} placeholder="..." />
                </div>
              </div>

              {/* Network Section */}
              <SectionTitle>{t('networkSettings')}</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-1">
                  <FieldLabel>{t('ipAddress')} *</FieldLabel>
                  <StyledInput value={form.ip_address} onChange={setField("ip_address")} placeholder="192.168.1.100" />
                </div>
                <div className="col-span-1">
                  <FieldLabel>{t('port')}</FieldLabel>
                  <StyledInput value={form.port} onChange={setField("port")} type="number" placeholder={form.device_type === "camera" ? "554" : "80"} />
                </div>
                <div className="col-span-1">
                  <FieldLabel>{t('macAddress')}</FieldLabel>
                  <StyledInput value={form.mac_address} onChange={setField("mac_address")} placeholder="00:00:00..." />
                </div>
                {form.device_type === "camera" && (
                  <div className="col-span-1">
                    <FieldLabel>{t('rtspUrl')}</FieldLabel>
                    <StyledInput value={form.rtsp_url} onChange={setField("rtsp_url")} placeholder="rtsp://..." />
                  </div>
                )}
              </div>

              {/* Login Section */}
              <SectionTitle>{t('deviceLogin')}</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <FieldLabel>{t('username')}</FieldLabel>
                  <StyledInput value={form.device_username} onChange={setField("device_username")} placeholder="admin" />
                </div>
                <div>
                  <FieldLabel>{t('password')}</FieldLabel>
                  <div className="relative">
                    <StyledInput
                      type={showPassword ? "text" : "password"}
                      value={form.device_password}
                      onChange={setField("device_password")}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Section */}
              <SectionTitle>{t('deviceSettings')}</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-1">
                  <FieldLabel>{t('checkType')}</FieldLabel>
                  <StyledSelect
                    value={form.check_type}
                    onChange={setField("check_type")}
                    options={[
                      { value: "both", label: t('both') },
                      { value: "entry", label: t('entryOnly') },
                      { value: "exit", label: t('exitOnly') },
                    ]}
                  />
                </div>
                {form.device_type === "face_id" && (
                  <div className="col-span-1">
                    <FieldLabel>{t('faceThreshold')}: {Number(form.face_threshold).toFixed(2)}</FieldLabel>
                    <input
                      type="range" min="0.4" max="0.9" step="0.05"
                      value={form.face_threshold}
                      onChange={(e) => setField("face_threshold")(e.target.value)}
                      className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5 px-1 uppercase tracking-tighter">
                      <span>{t('soft')}</span><span>{t('strict')}</span>
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div className="p-3 mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border-none bg-transparent cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 border-none cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const { t, lang } = useLanguage();
  const isCamera = device.device_type === "camera";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/5 transition-all group">
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            {isCamera ? <Camera size={20} /> : <ScanFace size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{device.name}</h4>
            {device.location && (
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                <MapPin size={10} />
                {device.location}
              </div>
            )}
          </div>
        </div>
        <StatusDot status={device.connection_status} />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-5">
          {[
            { label: t('ipAddress'), value: device.ip_address || "—" },
            { label: t('port'), value: device.port != null ? String(device.port) : "—" },
            { label: t('macAddress'), value: device.mac_address || "—" },
            { 
              label: t('checkType'), 
              value: device.check_type === "both" ? t('both') : device.check_type === "entry" ? t('entryOnly') : t('exitOnly') 
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{label}</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>

        {isCamera && device.rtsp_url && (
          <div className="mb-5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter px-1">{t('rtspUrl')}</span>
            <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1 break-all line-clamp-2 px-1 leading-relaxed">
              {device.rtsp_url}
            </p>
          </div>
        )}

        {/* API Key Section */}
        <div className="mb-5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{t('apiKey')}</span>
          <div className="flex items-center gap-2 mt-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <code className="flex-1 text-[10px] font-mono text-slate-500 overflow-hidden whitespace-nowrap text-ellipsis">
              {device.api_key.slice(0, 20)}••••••••
            </code>
            <button
              onClick={() => onCopy(device.api_key)}
              className="p-1 px-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border-none bg-transparent cursor-pointer"
              title={t('copy')}
            >
              {copiedKey === device.api_key ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`mb-5 p-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            testResult.success 
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" 
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
          }`}>
            <div className={`p-1.5 rounded-lg ${testResult.success ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-rose-100 dark:bg-rose-500/20"}`}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            </div>
            <p className="text-xs font-bold leading-tight flex-1">{testResult.detail}</p>
          </div>
        )}

        {device.last_ping && !testResult && (
          <p className="text-[10px] font-medium text-slate-400 mb-5 px-1 tracking-tight italic">
            {t('lastCheck')}: {new Date(device.last_ping).toLocaleString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru' : 'en-US')}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onTest}
            disabled={testing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all border-none cursor-pointer
              bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
          >
            {testing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Network size={14} />
            )}
            {testing ? t('testingConnection') : t('testConnection')}
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all border-none bg-transparent cursor-pointer active:scale-90 shadow-sm"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin text-rose-500" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
