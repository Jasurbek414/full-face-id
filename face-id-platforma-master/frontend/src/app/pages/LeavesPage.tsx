import React, { useState, useCallback } from "react";
import { Plus, X, Calendar as CalendarIcon, FileText, CheckCircle2, Clock, Check } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useLeaveBalance, useLeaveRequests, useLeaveTypes } from "../hooks/useLeaves";
import { leavesAPI } from "../api/leaves";
import { useLanguage } from "../context/LanguageContext";

export function LeavesPage() {
  const { t } = useLanguage();
  const { balance, loading: loadingBalance, refetch: refetchBalance } = useLeaveBalance();
  const { requests, loading: loadingRequests, refetch: refetchRequests } = useLeaveRequests();
  const { types } = useLeaveTypes();
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [formData, setFormData]         = useState({ leave_type: "", start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      showToast(t('fillAllFields'), false);
      return;
    }
    setSubmitting(true);
    try {
      await leavesAPI.createRequest(formData);
      setIsModalOpen(false);
      setFormData({ leave_type: "", start_date: "", end_date: "", reason: "" });
      refetchBalance();
      refetchRequests();
      showToast(t('requestSubmitted'));
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || t('errorSubmitting'), false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 m-0">{t('leaves')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">{t('leavesSubtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors"
        >
          <Plus size={15} />
          {t('newRequest')}
        </button>
      </div>

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loadingBalance ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] animate-pulse" />
          ))
        ) : balance.length === 0 ? (
          <div className="col-span-4 text-center py-8 text-[13px] text-gray-400 dark:text-gray-600">
            {t('noData')}
          </div>
        ) : balance.map((b: any) => {
          const used     = b.used_days ?? 0;
          const max      = b.max_days_per_year ?? 1;
          const remaining = b.remaining_days ?? 0;
          const pct      = Math.min(Math.round((used / max) * 100), 100);
          return (
            <div key={b.id ?? b.name} className="bg-white dark:bg-[#1A1D2E] p-5 rounded-xl border border-gray-200 dark:border-[#2D3148] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">{b.name}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{max} {t('days')}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{remaining}</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase">{t('left')}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full bg-gray-100 dark:bg-[#2D3148] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                  <span>{t('used')}: {used}</span>
                  <span>{t('total')}: {max}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Requests Table ── */}
      <div className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D3148]">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{t('recentRecords')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-[#2D3148]">
                {['leaveType', 'startDate', 'endDate', 'days', 'reason', 'status'].map(key => (
                  <th key={key} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingRequests ? (
                <tr><td colSpan={6} className="py-14 text-center">
                  <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-[13px] text-gray-400">{t('loading')}</span>
                </td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Clock size={36} className="opacity-20 mx-auto mb-3 text-gray-400" />
                  <div className="text-[14px] font-medium text-gray-500 dark:text-gray-500">{t('noData')}</div>
                </td></tr>
              ) : requests.map((req: any, i: number) => (
                <tr key={req.id}
                  className={`border-b border-gray-100 dark:border-[#2D3148]/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors
                    ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-white/[0.01]"}`}>
                  <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{req.leave_type_name}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400 whitespace-nowrap">{req.start_date}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400 whitespace-nowrap">{req.end_date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#2D3148] text-gray-700 dark:text-gray-300 text-[11px] font-bold">
                      {req.days} {t('days')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-500 dark:text-gray-500 max-w-[180px] truncate" title={req.reason}>
                    {req.reason || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New Leave Request Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4"
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-white dark:bg-[#1A1D2E] w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2D3148]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2D3148] bg-gray-50/50 dark:bg-white/[0.02]">
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{t('newLeaveRequest')}</h3>
              <button onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Leave type */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('leaveType')} *</label>
                <select
                  required
                  value={formData.leave_type}
                  onChange={e => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="" disabled>{t('selectType')}</option>
                  {types.map((tp: any) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                </select>
                {types.length === 0 && (
                  <p className="text-[11px] text-orange-500 mt-1">Ta'til turlari yo'q — admin tomonidan qo'shilishi kerak</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('startDate'), key: "start_date" },
                  { label: t('endDate'),   key: "end_date" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <CalendarIcon size={10} className="text-indigo-500" /> {label} *
                    </label>
                    <input
                      type="date"
                      required
                      value={(formData as any)[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <FileText size={10} className="text-indigo-500" /> {t('reason')}
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t('whyNeedLeave')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-transparent text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-[2] py-2.5 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold disabled:opacity-60 hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('saving')}</>
                    : <><CheckCircle2 size={14} />{t('submitRequest')}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
