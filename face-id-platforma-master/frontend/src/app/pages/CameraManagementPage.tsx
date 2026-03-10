import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera, Plus, RefreshCw, Trash2, MapPin, X, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Loader2, Network, ScanFace, Copy, Check,
  History, Edit3, UserCheck, UserX, Clock, Shield, ShieldOff,
  ChevronRight, Activity, Users, Wifi, WifiOff, TrendingUp,
  Search, Filter, MoreVertical, Fingerprint,
} from "lucide-react";
import { devicesAPI, faceAPI } from "../api/devices";
import { useLanguage } from "../context/LanguageContext";

type Tab = "cameras" | "face_id";
type DeviceType = "camera" | "face_id";
type ToastType = "ok" | "err" | "info";

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

interface LogEntry {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_phone: string | null;
  distance: number;
  success: boolean;
  created_at: string;
}

interface EnrolledFace {
  user_id: string;
  full_name: string;
  phone: string;
  department: string | null;
  photo_url: string | null;
  enrolled_at: string;
  updated_at: string;
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

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const { t } = useLanguage();
  const isOnline = status === "online";
  const isOffline = status === "offline";
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
        isOffline ? "bg-rose-500" : "bg-slate-400"
        }`} />
      <span className={`text-xs font-semibold ${isOnline ? "text-emerald-600 dark:text-emerald-400" :
        isOffline ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
        }`}>
        {isOnline ? t('online') : isOffline ? t('offline') : "—"}
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

function StyledInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value} disabled={disabled}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all outline-none
        ${disabled
          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        }`}
    />
  );
}

function StyledSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
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

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = type === "ok"
    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
    : type === "err"
      ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400"
      : "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400";
  const Icon = type === "ok" ? CheckCircle2 : type === "err" ? AlertTriangle : Activity;
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl shadow-slate-900/10 animate-in slide-in-from-bottom-4 duration-300 max-w-sm ${colors}`}>
      <Icon size={18} className="flex-shrink-0" />
      <p className="text-sm font-semibold flex-1">{msg}</p>
      <button onClick={onClose} className="border-none bg-transparent cursor-pointer opacity-60 hover:opacity-100 transition-opacity p-1">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Logs Slide Panel ────────────────────────────────────────────────────────

function LogsPanel({ device, logs, loading, onClose }: {
  device: Device; logs: LogEntry[]; loading: boolean; onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const successCount = logs.filter((l) => l.success).length;
  const rate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <History size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{device.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('entryHistory')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Stats strip */}
        {logs.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-6 flex-shrink-0">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('total')}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{logs.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('successful')}</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{successCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{t('rejected')}</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{logs.length - successCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('successRate')}</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{rate}%</p>
            </div>
          </div>
        )}

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
              <History size={32} className="opacity-30" />
              <p className="text-sm font-medium">{t('noHistory')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${log.success
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}>
                    {log.success ? <UserCheck size={16} /> : <UserX size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {log.user_name || t('unknown')}
                    </p>
                    {log.user_phone && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.user_phone}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      d={log.distance.toFixed(3)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(log.created_at).toLocaleString(
                        lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-US",
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Enrolled Faces Section ──────────────────────────────────────────────────

function EnrolledFacesSection({ faces, loading, onDelete, deleting }: {
  faces: EnrolledFace[];
  loading: boolean;
  onDelete: (userId: string) => void;
  deleting: string | null;
}) {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const filtered = faces.filter((f) =>
    f.full_name.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search)
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Fingerprint size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('enrolledFaces')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{faces.length} {t('employeesEnrolled')}</p>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">{t('loading')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
          <Fingerprint size={28} className="opacity-30" />
          <p className="text-sm font-medium">{search ? t('notFound') : t('noOneEnrolled')}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-80 overflow-y-auto">
          {filtered.map((face) => (
            <div key={face.user_id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              {face.photo_url ? (
                <img src={face.photo_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 text-sm font-bold">
                  {face.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{face.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {face.phone}{face.department ? ` · ${face.department}` : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0 mr-3">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(face.enrolled_at).toLocaleDateString(
                    lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-US",
                    { day: "numeric", month: "short", year: "numeric" }
                  )}
                </p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{t('enrolled')}</span>
                </div>
              </div>
              <button
                onClick={() => onDelete(face.user_id)}
                disabled={deleting === face.user_id}
                className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
                title={t('deleteFace')}
              >
                {deleting === face.user_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Device Card ─────────────────────────────────────────────────────────────

function DeviceCard({
  device, testing, testResult, deleting, copiedKey,
  onTest, onDelete, onCopy, onEdit, onViewLogs,
}: {
  device: Device;
  testing: boolean;
  testResult?: { success: boolean; detail: string };
  deleting: boolean;
  copiedKey: string | null;
  onTest: () => void;
  onDelete: () => void;
  onCopy: (key: string) => void;
  onEdit: () => void;
  onViewLogs: () => void;
}) {
  const { t, lang } = useLanguage();
  const isCamera = device.device_type === "camera";
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
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
        <div className="flex items-center gap-2">
          <StatusDot status={device.connection_status} />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden min-w-36 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <Edit3 size={14} className="text-slate-400" />
                  {t('edit')}
                </button>
                <button
                  onClick={() => { setShowMenu(false); onViewLogs(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <History size={14} className="text-slate-400" />
                  {t('viewHistory')}
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700" />
                <button
                  onClick={() => { setShowMenu(false); onDelete(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <Trash2 size={14} />
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 mb-5">
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

        {!isCamera && (
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{t('faceThreshold')}</span>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${((device.face_threshold - 0.4) / 0.5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums w-8 text-right">
                {device.face_threshold.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {isCamera && device.rtsp_url && (
          <div className="mb-4 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter px-1">RTSP URL</span>
            <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1 break-all line-clamp-2 px-1 leading-relaxed">
              {device.rtsp_url}
            </p>
          </div>
        )}

        {/* API Key */}
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

        {/* Test Result */}
        {testResult && (
          <div className={`mb-4 p-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${testResult.success
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
          <p className="text-[10px] font-medium text-slate-400 mb-4 px-1 tracking-tight italic flex items-center gap-1.5">
            <Clock size={10} />
            {t('lastCheck')}: {new Date(device.last_ping).toLocaleString(
              lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-US",
              { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
            )}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onTest}
            disabled={testing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all border-none cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Network size={14} />}
            {testing ? t('testing') : t('testConnection')}
          </button>
          <button
            onClick={onViewLogs}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border-none bg-transparent cursor-pointer shadow-sm"
            title={t('viewHistory')}
          >
            <History size={16} />
          </button>
          {deleting && (
            <div className="w-11 h-11 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-rose-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Device Form Modal ───────────────────────────────────────────────────────

function DeviceFormModal({
  initialType,
  editDevice,
  onClose,
  onSaved,
  showToast,
}: {
  initialType: DeviceType;
  editDevice: Device | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: ToastType) => void;
}) {
  const { t } = useLanguage();
  const isEdit = !!editDevice;
  const [form, setForm] = useState({
    ...emptyForm,
    device_type: initialType,
    ...(editDevice ? {
      name: editDevice.name,
      location: editDevice.location || "",
      ip_address: editDevice.ip_address || "",
      port: editDevice.port != null ? String(editDevice.port) : "",
      mac_address: editDevice.mac_address || "",
      rtsp_url: editDevice.rtsp_url || "",
      device_username: editDevice.device_username || "",
      device_password: "",
      face_threshold: String(editDevice.face_threshold ?? 0.6),
      check_type: editDevice.check_type || "both",
      device_type: editDevice.device_type,
    } : {}),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const setField = (key: keyof typeof emptyForm) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError(t('deviceNameRequired')); return; }
    if (!form.ip_address.trim()) { setFormError(t('ipRequired')); return; }
    setSubmitting(true);
    setFormError("");
    try {
      const payload: Record<string, unknown> = {
        device_type: form.device_type,
        name: form.name,
        location: form.location,
        ip_address: form.ip_address,
        port: form.port ? Number(form.port) : null,
        mac_address: form.mac_address,
        rtsp_url: form.rtsp_url,
        device_username: form.device_username,
        face_threshold: Number(form.face_threshold),
        check_type: form.check_type,
      };
      if (form.device_password) payload.device_password = form.device_password;

      if (isEdit && editDevice) {
        await devicesAPI.update(editDevice.id, payload);
        showToast(t('deviceUpdated'), "ok");
      } else {
        await devicesAPI.create(payload);
        showToast(t('deviceAdded'), "ok");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const d = (e as { response?: { data?: unknown } })?.response?.data;
      setFormError(
        typeof d === "object" && d !== null
          ? Object.values(d).flat().join(" ")
          : t('errorOccurred')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              {form.device_type === "camera" ? <Camera size={20} /> : <ScanFace size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isEdit ? t('editDevice') : form.device_type === "camera" ? t('addCamera') : t('addFaceId')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('networkSettings')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <SectionTitle>{t('mainInfo')}</SectionTitle>
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

          <SectionTitle>{t('networkSettings')}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <FieldLabel>{t('ipAddress')} *</FieldLabel>
              <StyledInput value={form.ip_address} onChange={setField("ip_address")} placeholder="192.168.1.100" />
            </div>
            <div>
              <FieldLabel>{t('port')}</FieldLabel>
              <StyledInput value={form.port} onChange={setField("port")} type="number" placeholder={form.device_type === "camera" ? "554" : "80"} />
            </div>
            <div>
              <FieldLabel>{t('macAddress')}</FieldLabel>
              <StyledInput value={form.mac_address} onChange={setField("mac_address")} placeholder="00:00:00..." />
            </div>
            {form.device_type === "camera" && (
              <div>
                <FieldLabel>{t('rtspUrl')}</FieldLabel>
                <StyledInput value={form.rtsp_url} onChange={setField("rtsp_url")} placeholder="rtsp://..." />
              </div>
            )}
          </div>

          <SectionTitle>{t('deviceLogin')}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <FieldLabel>{t('username')}</FieldLabel>
              <StyledInput value={form.device_username} onChange={setField("device_username")} placeholder="admin" />
            </div>
            <div>
              <FieldLabel>{isEdit ? t('newPasswordOptional') : t('password')}</FieldLabel>
              <div className="relative">
                <StyledInput
                  type={showPassword ? "text" : "password"}
                  value={form.device_password}
                  onChange={setField("device_password")}
                  placeholder={isEdit ? t('unchanged') : "••••••••"}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <SectionTitle>{t('deviceSettings')}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
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
              <div>
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
            <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {formError}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
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
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function CameraManagementPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("cameras");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<DeviceType>("face_id");
  const [editDevice, setEditDevice] = useState<Device | null>(null);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; detail: string }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Logs panel
  const [logsDevice, setLogsDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Enrolled faces
  const [enrolledFaces, setEnrolledFaces] = useState<EnrolledFace[]>([]);
  const [loadingFaces, setLoadingFaces] = useState(false);
  const [deletingFace, setDeletingFace] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const showToast = useCallback((msg: string, type: ToastType = "ok") => {
    setToast({ msg, type });
  }, []);

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

  const fetchEnrolledFaces = useCallback(async () => {
    setLoadingFaces(true);
    try {
      const { data } = await faceAPI.enrolledFaces();
      setEnrolledFaces(data.results || []);
    } catch {
      setEnrolledFaces([]);
    } finally {
      setLoadingFaces(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);
  useEffect(() => {
    if (activeTab === "face_id") fetchEnrolledFaces();
  }, [activeTab, fetchEnrolledFaces]);

  const openLogs = useCallback(async (device: Device) => {
    setLogsDevice(device);
    setLogs([]);
    setLoadingLogs(true);
    try {
      const { data } = await devicesAPI.logs(device.id);
      setLogs(data.results || []);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const handleTestConnection = async (device: Device) => {
    setTestingId(device.id);
    try {
      const { data } = await devicesAPI.testConnection(device.id);
      setTestResult((p) => ({ ...p, [device.id]: data }));
      setDevices((p) =>
        p.map((d) => d.id === device.id ? { ...d, connection_status: data.connection_status } : d)
      );
      showToast(data.success ? t('connectionSuccess') : t('connectionFailed'), data.success ? "ok" : "err");
    } catch {
      setTestResult((p) => ({ ...p, [device.id]: { success: false, detail: t('serverError') } }));
      showToast(t('serverError'), "err");
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
      showToast(t('deviceDeleted'), "ok");
    } catch {
      showToast(t('errorOccurred'), "err");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFace = async (userId: string) => {
    if (!window.confirm(t('confirmDeleteFace'))) return;
    setDeletingFace(userId);
    try {
      await faceAPI.deleteEnrolledFace(userId);
      setEnrolledFaces((p) => p.filter((f) => f.user_id !== userId));
      showToast(t('faceDataDeleted'), "ok");
    } catch {
      showToast(t('errorOccurred'), "err");
    } finally {
      setDeletingFace(null);
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => { });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(t('apiKeyCopied'), "info");
  };

  // Stats
  const onlineCount = filtered.filter((d) => d.connection_status === "online").length;
  const offlineCount = filtered.filter((d) => d.connection_status === "offline").length;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Logs Panel */}
      {logsDevice && (
        <LogsPanel
          device={logsDevice}
          logs={logs}
          loading={loadingLogs}
          onClose={() => setLogsDevice(null)}
        />
      )}

      {/* Device Form Modal */}
      {showModal && (
        <DeviceFormModal
          initialType={modalType}
          editDevice={editDevice}
          onClose={() => { setShowModal(false); setEditDevice(null); }}
          onSaved={fetchDevices}
          showToast={showToast}
        />
      )}

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
            onClick={() => { fetchDevices(); if (activeTab === "face_id") fetchEnrolledFaces(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {t('refresh')}
          </button>
          <button
            onClick={() => {
              setEditDevice(null);
              setModalType(activeTab === "cameras" ? "camera" : "face_id");
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all active:scale-95 border-none cursor-pointer"
          >
            <Plus size={18} />
            {activeTab === "cameras" ? "Kamera qo'shish" : "Face ID qo'shish"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
        {([
          { id: "cameras" as Tab, label: t('cameras'), icon: Camera },
          { id: "face_id" as Tab, label: t('faceIdDevices'), icon: ScanFace },
        ] as const).map(({ id, label, icon: Icon }) => {
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

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={activeTab === "cameras" ? Camera : ScanFace}
          label={t('total')}
          value={filtered.length}
          color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={Wifi}
          label={t('online')}
          value={onlineCount}
          color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={WifiOff}
          label={t('offline')}
          value={offlineCount}
          color="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        {activeTab === "face_id" ? (
          <StatCard
            icon={Fingerprint}
            label={t('enrolledFaces')}
            value={enrolledFaces.length}
            color="bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
        ) : (
          <StatCard
            icon={Activity}
            label={t('unknownStatus')}
            value={filtered.filter((d) => d.connection_status === "unknown").length}
            color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        )}
      </div>

      {/* Face ID: enrolled faces section */}
      {activeTab === "face_id" && (
        <EnrolledFacesSection
          faces={enrolledFaces}
          loading={loadingFaces}
          onDelete={handleDeleteFace}
          deleting={deletingFace}
        />
      )}

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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('noDevice')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs mb-8">
            {t('addFirstDevice')}
          </p>
          <button
            onClick={() => {
              setEditDevice(null);
              setModalType(activeTab === "cameras" ? "camera" : "face_id");
              setShowModal(true);
            }}
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
              onEdit={() => {
                setEditDevice(device);
                setModalType(device.device_type);
                setShowModal(true);
              }}
              onViewLogs={() => openLogs(device)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
