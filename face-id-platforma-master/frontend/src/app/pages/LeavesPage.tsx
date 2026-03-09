import React, { useState } from "react";
import { Plus, X, Calendar as CalendarIcon, FileText, Info, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useLeaveBalance, useLeaveRequests, useLeaveTypes } from "../hooks/useLeaves";
import { leavesAPI } from "../api/leaves";
import { useLanguage } from "../context/LanguageContext";

export function LeavesPage() {
    const { t } = useLanguage();
    const { balance, loading: loadingBalance, refetch: refetchBalance } = useLeaveBalance();
    const { requests, loading: loadingRequests, refetch: refetchRequests } = useLeaveRequests();
    const { types } = useLeaveTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ leave_type: "", start_date: "", end_date: "", reason: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await leavesAPI.createRequest(formData);
            setIsModalOpen(false);
            setFormData({ leave_type: "", start_date: "", end_date: "", reason: "" });
            refetchBalance();
            refetchRequests();
            alert(t('requestSubmitted'));
        } catch (error) {
            console.error(error);
            alert(t('errorSubmitting'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('leaves')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('leavesSubtitle')}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    {t('newRequest')}
                </button>
            </div>

            {/* Balance Cards Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loadingBalance ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-700/50"></div>
                    ))
                ) : balance.map((b: any) => (
                    <div key={b.name} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{b.name}</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                <Info size={16} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{b.remaining_days}</span>
                            <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">{t('left')}</span>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${Math.min((b.used_days / b.max_days_per_year) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                <span className="text-slate-500 dark:text-slate-400">{t('used')}: {b.used_days}</span>
                                <span className="text-slate-400 dark:text-slate-500">{t('total')}: {b.max_days_per_year}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Requests Table section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('recentRecords')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                                {['leaveType', 'startDate', 'endDate', 'days', 'reason', 'status'].map((key) => (
                                    <th key={key} className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        {t(key)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loadingRequests ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 italic">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                            {t('loading')}...
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock size={32} className="text-slate-200 dark:text-slate-700" />
                                            <span className="text-sm font-medium">{t('noData')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.map((req: any, i) => (
                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{req.leave_type_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{req.start_date}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{req.end_date}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                            {req.days} {t('days')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-500 dark:text-slate-500 max-w-[200px] truncate font-medium" title={req.reason}>
                                            {req.reason}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={req.status} size="sm" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Replacement */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('newLeaveRequest')}</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('leaveType')}</label>
                                <select 
                                    required 
                                    value={formData.leave_type} 
                                    onChange={e => setFormData({ ...formData, leave_type: e.target.value })} 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>{t('selectType')}</option>
                                    {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <CalendarIcon size={12} className="text-indigo-500" /> {t('startDate')}
                                    </label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.start_date} 
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <CalendarIcon size={12} className="text-indigo-500" /> {t('endDate')}
                                    </label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.end_date} 
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                    <FileText size={12} className="text-indigo-500" /> {t('reason')}
                                </label>
                                <textarea 
                                    required 
                                    rows={3} 
                                    value={formData.reason} 
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                                    placeholder={t('whyNeedLeave')} 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="flex-[2] px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    {submitting ? t('saving') : t('submitRequest')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
