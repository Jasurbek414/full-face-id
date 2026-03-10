import React, { useState, useEffect, useCallback } from "react";
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
  X,
  Trash2,
  Check,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useEmployees } from "../hooks/useEmployees";
import { employeesAPI } from "../api/employees";
import { apiClient } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

import { EditProfileModal } from "../components/EditProfileModal";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday=0 ... Sunday=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  return cells;
}

export function EmployeeProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { get, enrollFace, deleteFace, getAttendance, loading: actionLoading } = useEmployees();
  const { t } = useLanguage();

  const [emp, setEmp] = useState<any>(null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [empRecords, setEmpRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchProfile = useCallback(async () => {
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
  }, [id, get, getAttendance]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFaceEnroll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !id) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
      try {
        await enrollFace(id, base64String);
        setFaceEnrolled(true);
        showToast(t('faceSaved'));
      } catch (err: any) {
        showToast(t('errorOccurred') + ": " + (err.response?.data?.error || err.message), false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaceDelete = async () => {
    if (!id || !window.confirm(t('confirmDeleteFace'))) return;
    try {
      await deleteFace(id);
      setFaceEnrolled(false);
      showToast(t('saved'));
    } catch (err: any) {
      showToast(t('errorOccurred') + ": " + err.message, false);
    }
  };

  const handleUpdateProfile = async (formData: any) => {
    if (!id) return;
    try {
      await apiClient.patch(`/api/v1/employees/${id}/`, formData);
      showToast(t('profileUpdated'));
      fetchProfile();
    } catch (err: any) {
      showToast(t('errorOccurred') + ": " + (err.response?.data?.detail || err.message), false);
      throw err;
    }
  };

  const handleDeactivate = async () => {
    if (!id || !window.confirm(t('confirmDeactivate'))) return;
    try {
      await employeesAPI.deactivate(id);
      showToast(t('saved'));
      fetchProfile();
    } catch (err: any) {
      showToast(t('errorOccurred') + ": " + (err.response?.data?.detail || err.message), false);
    }
  };

  if (loading || !emp) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">{t('loading')}</span>
        </div>
      </div>
    );
  }

  const presentCount = empRecords.filter((r) => r.status === "on_time").length;
  const lateCount = empRecords.filter((r) => r.status === "late").length;
  const absentCount = empRecords.filter((r) => r.status === "absent").length;
  const offCount = empRecords.filter((r) => r.status === "off").length;
  const totalTracked = presentCount + lateCount + absentCount;
  const attendanceRate = totalTracked > 0
    ? Math.round(((presentCount + lateCount) / totalTracked) * 100)
    : 0;

  const deptName = typeof emp.department === 'object' ? emp.department?.name : emp.department ?? 'General';
  const roleName = typeof emp.system_role === 'object' ? emp.system_role?.name : emp.system_role ?? 'User';

  // Build heatmap for current month
  const now = new Date();
  const monthYear = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const monthGrid = getMonthGrid(now.getFullYear(), now.getMonth());

  // Map date → status from records
  const statusByDay: Record<number, string> = {};
  empRecords.forEach((r) => {
    const d = new Date(r.date);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      statusByDay[d.getDate()] = r.status;
    }
  });

  const dayCellColor = (day: number) => {
    const s = statusByDay[day];
    if (!s) return "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 text-slate-400 dark:text-slate-500";
    if (s === "on_time") return "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-400";
    if (s === "late") return "bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800/40 text-orange-700 dark:text-orange-400";
    if (s === "absent") return "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400";
    return "bg-slate-100 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600/40 text-slate-500 dark:text-slate-400";
  };

  return (
    <div className="space-y-6">
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employee={emp}
        onSave={handleUpdateProfile}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('employeeProfile')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('profileSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeactivate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
          >
            <Trash2 size={16} />
            {t('deactivate')}
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Edit2 size={16} />
            {t('editProfile')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile & Face ID */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
            <div className="px-6 pb-6 -mt-12 text-center">
              <div className="relative inline-block group">
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-lg mx-auto bg-slate-100 dark:bg-slate-700">
                  <img
                    src={emp.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.first_name + " " + emp.last_name)}&background=6366f1&color=fff&size=128`}
                    alt={emp.first_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${emp.is_active ? 'bg-green-500' : 'bg-slate-400'}`}></div>
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{emp.first_name} {emp.last_name}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{roleName}</p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <StatusBadge status={emp.today_status} />
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Building2 size={14} className="text-slate-400" />
                  <span>{deptName}</span>
                  <span className="text-slate-300">|</span>
                  <span>ID: {emp.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Face ID Enrollment Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('faceIdEnrollment')}</h3>
              {faceEnrolled ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 font-bold border border-red-100 dark:border-red-900/30 uppercase tracking-tighter">
                  {t('notSet')}
                </span>
              )}
            </div>

            {faceEnrolled ? (
              <div className="mb-4 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400">
                <Scan size={18} />
                <span className="text-xs font-semibold">{t('faceEnrolled')}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {t('noFaceData')}
              </p>
            )}

            <input
              type="file"
              id="face-upload"
              hidden
              accept="image/*"
              onChange={handleFaceEnroll}
            />

            <div className="flex gap-2">
              <button
                onClick={() => document.getElementById('face-upload')?.click()}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                  faceEnrolled
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-600'
                  : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 active:transform active:scale-95'
                }`}
              >
                <Camera size={16} />
                {faceEnrolled ? t('reEnroll') : t('enrollFace')}
              </button>

              {faceEnrolled && (
                <button
                  onClick={handleFaceDelete}
                  disabled={actionLoading}
                  className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm group"
                  title={t('delete')}
                >
                  <Trash2 size={18} className="group-active:scale-90" />
                </button>
              )}
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5">{t('contactDetails')}</h3>
            <div className="space-y-4">
              {[
                { icon: <Mail size={16} />, label: t('email'), value: emp.email || "—" },
                { icon: <Phone size={16} />, label: t('phone'), value: emp.phone },
                { icon: <Calendar size={16} />, label: t('joined'), value: new Date(emp.join_date || emp.date_joined).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) },
                { icon: <Clock size={16} />, label: t('lastCheckIn'), value: emp.last_check_in || t('notCheckedIn') },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats, Heatmap, Records */}
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('present'), value: presentCount, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-100 dark:border-green-900/30" },
              { label: t('late'), value: lateCount, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100 dark:border-orange-900/30" },
              { label: t('absent'), value: absentCount, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-900/30" },
              { label: t('daysOff'), value: offCount, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-700/50", border: "border-slate-100 dark:border-slate-700" },
            ].map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
              >
                <div className={`text-3xl font-black ${color}`}>{value}</div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{label}</div>
                <div className={`mt-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${bg} ${color} ${border} border uppercase tracking-tighter`}>
                  {t('thisMonth')}
                </div>
              </div>
            ))}
          </div>

          {/* Attendance Heatmap */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-none">{monthYear}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{t('attendanceHeatmap')}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {[
                  { label: t('onTime'), color: "bg-green-500" },
                  { label: t('late'), color: "bg-orange-500" },
                  { label: t('absent'), color: "bg-red-500" },
                  { label: t('off'), color: "bg-slate-200 dark:bg-slate-700" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-[3px] ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {monthGrid.map((cell, i) =>
                cell.day === null ? (
                  <div key={`empty-${i}`} />
                ) : (
                  <div
                    key={cell.day}
                    className={`aspect-square rounded-lg sm:rounded-xl border flex items-center justify-center text-[11px] font-bold hover:opacity-80 transition-colors cursor-default ${dayCellColor(cell.day)}`}
                  >
                    {cell.day}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Recent Records Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('recentRecords')}</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/30">
                <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-[11px] font-bold text-green-700 dark:text-green-400">{attendanceRate}% {t('attendanceRate')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('date')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('checkIn')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('checkOut')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('duration')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">{t('method')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {empRecords.length > 0 ? empRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {r.check_in || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {r.check_out || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {r.net_seconds ? `${Math.floor(r.net_seconds / 3600)}h ${Math.floor((r.net_seconds % 3600) / 60)}m` : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400 transition-colors"></div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{r.check_in_method || "—"}</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Clock size={32} className="text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{t('noRecords')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-medium max-w-sm
          ${toast.ok ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white border-0 bg-transparent cursor-pointer p-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
