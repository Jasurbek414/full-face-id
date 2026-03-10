import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Download, Scan, Hash, PenLine,
  ChevronLeft, ChevronRight, MoreVertical, Plus, Users,
  UserCheck, AlertCircle, UserX, X, Loader2, Clock,
} from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";
import { formatTime, formatDate, formatDuration } from "../utils/time";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AttendanceRecord {
  id: string; user: string; user_name: string; user_photo: string | null;
  department_name: string | null; date: string;
  check_in: string | null; check_out: string | null;
  status: "on_time" | "late" | "early_leave" | "absent";
  check_in_method: string; net_seconds: number | null;
}
interface TodayStats { total_employees: number; present: number; late: number; on_time: number; on_site: number; absent: number; }
interface Employee  { id: string; first_name: string; last_name: string; }
interface Department{ id: string; name: string; }

const STATUS_CONFIG = {
  on_time:     { cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  late:        { cls: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
  early_leave: { cls: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  absent:      { cls: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
} as const;

const METHOD_ICON: Record<string, React.ReactNode> = {
  face_id: <Scan size={13} className="text-indigo-600 dark:text-indigo-400" />,
  pin:     <Hash size={13} className="text-teal-600 dark:text-teal-400" />,
  manual:  <PenLine size={13} className="text-gray-400" />,
  qr:      <Hash size={13} className="text-purple-600 dark:text-purple-400" />,
};
const METHOD_LABEL: Record<string, string> = { face_id: "Face ID", pin: "PIN", manual: "Manual", qr: "QR Code" };

// ─── Component ───────────────────────────────────────────────────────────────
export function AttendancePage() {
  const { t }      = useLanguage();
  const { isDark } = useTheme();

  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [departments, setDepts]     = useState<Department[]>([]);

  const [search, setSearch]     = useState("");
  const [statusF, setStatusF]   = useState("all");
  const [methodF, setMethodF]   = useState("all");
  const [userF, setUserF]       = useState("");
  const [deptF, setDeptF]       = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [page, setPage]         = useState(1);
  const perPage = 15;

  const [toast, setToast]           = useState<string | null>(null);
  const [actionOpen, setActionOpen] = useState<string | null>(null);
  const [addModal, setAddModal]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const [form, setForm] = useState({
    user: "", date: new Date().toISOString().slice(0, 10),
    check_in: "", check_out: "", check_in_method: "face_id",
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadTodayStats = useCallback(async () => {
    try { setTodayStats((await apiClient.get("/api/v1/attendance/today-stats/")).data); }
    catch { setTodayStats(null); }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (search)            params.search      = search;
      if (statusF !== "all") params.status      = statusF;
      if (methodF !== "all") params.method      = methodF;
      if (userF)             params.user_id     = userF;
      if (deptF)             params.department  = deptF;
      if (dateFrom)          params.date_from   = dateFrom;
      if (dateTo)            params.date_to     = dateTo;
      const r = await apiClient.get("/api/v1/attendance/", { params });
      setRecords(r.data.results ?? r.data ?? []);
      setTotal(r.data.count ?? 0);
    } catch { showToast("Ma'lumot yuklashda xatolik"); }
    finally { setLoading(false); }
  }, [page, search, statusF, methodF, userF, deptF, dateFrom, dateTo, showToast]);

  useEffect(() => {
    loadTodayStats();
    apiClient.get("/api/v1/employees/").then(r => setEmployees(r.data.results ?? r.data ?? [])).catch(() => {});
    apiClient.get("/api/v1/companies/departments/").then(r => setDepts(r.data.results ?? r.data ?? [])).catch(() => {});
  }, [loadTodayStats]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user || !form.date || !form.check_in) { showToast("Xodim, sana va kirish vaqtini to'ldiring"); return; }
    setSubmitting(true);
    try {
      await apiClient.post("/api/v1/attendance/", {
        user: form.user, date: form.date, check_in: form.check_in,
        check_out: form.check_out || null, check_in_method: form.check_in_method,
      });
      showToast(t('recordAdded'));
      setAddModal(false);
      setForm({ user: "", date: new Date().toISOString().slice(0, 10), check_in: "", check_out: "", check_in_method: "face_id" });
      await Promise.all([loadRecords(), loadTodayStats()]);
    } catch (e: any) {
      showToast(e.response?.data?.detail || "Qo'shishda xatolik");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/api/v1/attendance/${id}/`);
      showToast(t('recordDeleted'));
      setRecords(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
      await loadTodayStats();
    } catch { showToast("O'chirishda xatolik"); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, any> = {};
      if (statusF !== "all") params.status     = statusF;
      if (methodF !== "all") params.method     = methodF;
      if (dateFrom)          params.date_from  = dateFrom;
      if (dateTo)            params.date_to    = dateTo;
      if (search)            params.search     = search;
      const r = await apiClient.get<Blob>("/api/v1/attendance/", { params: { ...params, export_format: "csv" }, responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = Object.assign(document.createElement("a"), { href: url, download: "attendance.csv" });
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { showToast("Export muvaffaqiyatsiz"); }
  };

  const resetFilters = () => { setSearch(""); setStatusF("all"); setMethodF("all"); setUserF(""); setDeptF(""); setDateFrom(""); setDateTo(""); setPage(1); };
  const hasFilters   = !!(search || statusF !== "all" || methodF !== "all" || userF || deptF || dateFrom || dateTo);
  const totalPages   = Math.max(1, Math.ceil(total / perPage));

  const statusLabel = {
    on_time: t('onTime'), late: t('arrivedLate'), early_leave: t('earlyLeave'), absent: t('didntCome'),
  } as Record<string, string>;

  return (
    <div className="font-sans">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 m-0">{t('attendanceLog')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            {loading ? t('loading') : `${total} ${t('recordsFound')}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#1A1D2E] text-gray-700 dark:text-gray-300 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Download size={14} />{t('export')}
          </button>
          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors">
            <Plus size={14} />{t('addRecord')}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { icon: <Users size={18} />,       label: t('totalEmployees'), value: todayStats?.total_employees ?? "—", cls: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" },
          { icon: <UserCheck size={18} />,   label: t('onSiteNow'),      value: todayStats?.on_site ?? "—",         cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", sub: todayStats ? `${todayStats.present} ${t('cameToday')}` : undefined },
          { icon: <AlertCircle size={18} />, label: t('arrivedLate'),    value: todayStats?.late ?? "—",            cls: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
          { icon: <UserX size={18} />,       label: t('didntCome'),      value: todayStats?.absent ?? "—",          cls: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
        ].map(({ icon, label, value, cls, sub }) => (
          <div key={label} className="bg-white dark:bg-[#1A1D2E] rounded-xl px-4 py-3.5 border border-gray-200 dark:border-[#2D3148] shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>{icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
              <div className="text-[12px] text-gray-500 dark:text-gray-400">{label}</div>
              {sub && <div className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-[#1A1D2E] rounded-xl px-4 py-3 mb-4 border border-gray-200 dark:border-[#2D3148] shadow-sm">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2 border border-gray-200 dark:border-[#2D3148] rounded-lg px-3 py-1.5 flex-1 min-w-[180px] max-w-[280px]">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('searchEmployees')}
              className="border-none outline-none text-[13px] text-gray-800 dark:text-gray-200 bg-transparent w-full placeholder:text-gray-400 dark:placeholder:text-gray-600" />
          </div>

          {[
            { val: statusF, set: (v: string) => { setStatusF(v); setPage(1); }, opts: [
              ["all", t('allStatuses')], ["on_time", t('onTime')], ["late", t('arrivedLate')], ["early_leave", t('earlyLeave')], ["absent", t('didntCome')]
            ]},
            { val: methodF, set: (v: string) => { setMethodF(v); setPage(1); }, opts: [
              ["all", t('allMethods')], ["face_id", "Face ID"], ["pin", "PIN"], ["manual", "Manual"], ["qr", "QR Code"]
            ]},
          ].map(({ val, set, opts }, i) => (
            <select key={i} value={val} onChange={e => set(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#1A1D2E] text-[13px] text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}

          <select value={userF} onChange={e => { setUserF(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#1A1D2E] text-[13px] text-gray-700 dark:text-gray-300 outline-none cursor-pointer min-w-[140px]">
            <option value="">{t('allEmployees')}</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </select>

          <select value={deptF} onChange={e => { setDeptF(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#1A1D2E] text-[13px] text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="">{t('allDepts')}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex items-center gap-1.5 border border-gray-200 dark:border-[#2D3148] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1A1D2E]">
            <span className="text-[11px] text-gray-400">{t('from')}:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="border-none outline-none text-[12px] text-gray-700 dark:text-gray-300 cursor-pointer bg-transparent" />
          </div>
          <div className="flex items-center gap-1.5 border border-gray-200 dark:border-[#2D3148] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1A1D2E]">
            <span className="text-[11px] text-gray-400">{t('to')}:</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="border-none outline-none text-[12px] text-gray-700 dark:text-gray-300 cursor-pointer bg-transparent" />
          </div>

          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[12px] bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <X size={11} />{t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-[#2D3148]">
                {[t('employee'), t('date'), t('checkInTime'), t('checkOutTime'), t('duration'), "Status", t('method'), ""].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-14 text-center">
                  <Loader2 size={22} className="animate-spin mx-auto mb-2 text-gray-400" />
                  <span className="text-[13px] text-gray-400">{t('loading')}</span>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Clock size={36} className="opacity-20 mx-auto mb-3 text-gray-400" />
                  <div className="text-[14px] font-medium text-gray-500 dark:text-gray-500">{t('noRecords')}</div>
                  {hasFilters && <div className="text-[12px] text-gray-400 mt-1">{t('tryFilters')}</div>}
                </td></tr>
              ) : records.map((rec, i) => (
                <tr key={rec.id}
                  className={`border-b border-gray-100 dark:border-[#2D3148]/60 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10
                    ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-white/[0.01]"}`}>

                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar src={rec.user_photo || ""} name={rec.user_name} size={28} />
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{rec.user_name}</div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500">{rec.department_name ?? "—"}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3.5 py-2.5 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(rec.date)}
                  </td>

                  <td className="px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap text-teal-700 dark:text-teal-400">
                    {rec.check_in ? formatTime(rec.check_in) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>

                  <td className="px-3.5 py-2.5 text-[13px] whitespace-nowrap">
                    {rec.check_out
                      ? <span className="text-gray-700 dark:text-gray-300">{formatTime(rec.check_out)}</span>
                      : rec.check_in
                        ? <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">● {t('insideOffice')}</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>

                  <td className="px-3.5 py-2.5 text-[13px] text-gray-700 dark:text-gray-300">
                    {rec.net_seconds ? formatDuration(rec.net_seconds) : "—"}
                  </td>

                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CONFIG[rec.status]?.cls ?? ""}`}>
                      {statusLabel[rec.status] ?? rec.status}
                    </span>
                  </td>

                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {METHOD_ICON[rec.check_in_method] ?? <Scan size={13} className="text-indigo-400" />}
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">
                        {METHOD_LABEL[rec.check_in_method] ?? rec.check_in_method}
                      </span>
                    </div>
                  </td>

                  <td className="px-3.5 py-2.5 relative">
                    <button onClick={e => { e.stopPropagation(); setActionOpen(actionOpen === rec.id ? null : rec.id); }}
                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-transparent flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <MoreVertical size={13} className="text-gray-400" />
                    </button>
                    {actionOpen === rec.id && (
                      <div className="absolute right-2 top-full z-50 min-w-[130px] bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-[#2D3148] rounded-xl shadow-lg overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <button
                          disabled={deleting === rec.id}
                          onClick={() => { setActionOpen(null); handleDelete(rec.id); }}
                          className="w-full px-4 py-2.5 text-left text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors border-0 bg-transparent cursor-pointer">
                          {deleting === rec.id ? t('loading') : t('delete')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#2D3148]">
            <span className="text-[12px] text-gray-400 dark:text-gray-500">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}
            </span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-transparent flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg border text-[12px] transition-colors
                      ${p === page
                        ? "bg-indigo-800 dark:bg-indigo-700 border-indigo-800 dark:border-indigo-700 text-white font-bold"
                        : "border-gray-200 dark:border-[#2D3148] bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-transparent flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Record Modal ── */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4"
          onClick={e => { if (e.target === e.currentTarget) setAddModal(false); }}>
          <div className="bg-white dark:bg-[#1A1D2E] w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2D3148]">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">{t('addAttendance')}</h2>
              <button onClick={() => setAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 border-0 bg-transparent cursor-pointer">
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="p-5 flex flex-col gap-4">
              {[
                {
                  label: `${t('employee')} *`,
                  field: <select required value={form.user} onChange={e => setForm({ ...form, user: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-800 dark:text-gray-200 outline-none">
                    <option value="" disabled>{t('selectEmployee')}</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                },
                {
                  label: `${t('date')} *`,
                  field: <input type="date" required value={form.date} max={new Date().toISOString().slice(0, 10)}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-800 dark:text-gray-200 outline-none" />
                },
              ].map(({ label, field }) => (
                <div key={label}>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
                  {field}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: `${t('checkInTime')} *`, key: "check_in", required: true },
                  { label: t('checkOutTime'),        key: "check_out", required: false },
                ].map(({ label, key, required }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
                    <input type="time" required={required} value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-800 dark:text-gray-200 outline-none" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('method')}</label>
                <select value={form.check_in_method} onChange={e => setForm({ ...form, check_in_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-800 dark:text-gray-200 outline-none">
                  <option value="face_id">Face ID</option>
                  <option value="pin">PIN</option>
                  <option value="qr">QR Code</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="flex gap-2.5 mt-1">
                <button type="button" onClick={() => setAddModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-transparent text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold disabled:opacity-60 hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  {submitting ? <><Loader2 size={13} className="animate-spin" />{t('saving')}</> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionOpen && <div className="fixed inset-0 z-40" onClick={() => setActionOpen(null)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-2xl text-[13px] font-medium max-w-sm">
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white border-0 bg-transparent cursor-pointer p-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
