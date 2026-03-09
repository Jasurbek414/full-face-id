import React, { useState, useEffect, useCallback } from "react";
import {
  Banknote, Calculator, Users, Clock, TrendingUp, Plus, Save,
  Loader2, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle,
  Download, FileSpreadsheet, FileText, Printer, Trash2, Info, Search
} from "lucide-react";
import { apiClient } from "../api/client";
import { companyUsersAPI } from "../api/devices";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";

type Tab = "records" | "salary_config" | "calculate";

interface SalaryConfig {
  id?: number;
  user: string;
  salary_type: "hourly" | "daily" | "monthly";
  amount: string;
  overtime_rate: string;
}

interface PayrollRecord {
  id: number;
  user: string;
  user_full_name: string;
  month: string;
  work_days: number;
  work_hours: string;
  overtime_hours: string;
  base_salary: string;
  overtime_pay: string;
  net_salary: string;
  status: string;
}

interface CompanyUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role?: { name: string } | null;
}

export function PayrollPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("records");

  // Payroll records
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Salary configs
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // New config form
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [cfgUserId, setCfgUserId] = useState("");
  const [cfgType, setCfgType] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [cfgAmount, setCfgAmount] = useState("");
  const [cfgOvertime, setCfgOvertime] = useState("1.5");
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgError, setCfgError] = useState("");

  // Calculate
  const [calcMonth, setCalcMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<{ message: string; isError: boolean } | null>(null);

  const isOwnerOrAccountant =
    user?.role?.name === "OWNER" ||
    user?.role?.name === "ACCOUNTANT" ||
    user?.role?.name === "ADMIN" ||
    user?.is_staff;

  const fmt = (v: number | string) =>
    Number(v).toLocaleString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US") + " " + (lang === "uz" ? "so'm" : lang === "ru" ? "сум" : "sum");

  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const url = isOwnerOrAccountant
        ? "/api/v1/payroll/records/"
        : "/api/v1/payroll/records/my/";
      const { data } = await apiClient.get(url);
      setRecords(data.results || data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [isOwnerOrAccountant]);

  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    try {
      const [cfgRes, usersRes] = await Promise.all([
        apiClient.get("/api/v1/payroll/config/"),
        companyUsersAPI.list(),
      ]);
      setConfigs(cfgRes.data.results || cfgRes.data || []);
      setUsers(usersRes.data.results || []);
    } catch {
      setConfigs([]);
    } finally {
      setLoadingConfigs(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "records") fetchRecords();
    else if (tab === "salary_config") fetchConfigs();
  }, [tab, fetchRecords, fetchConfigs]);

  const handleSaveConfig = useCallback(async () => {
    if (!cfgUserId) { setCfgError(t('selectEmployee')); return; }
    if (!cfgAmount || isNaN(Number(cfgAmount)) || Number(cfgAmount) <= 0) {
      setCfgError(t('enterAmount')); return;
    }
    setSavingCfg(true);
    setCfgError("");
    try {
      await apiClient.post("/api/v1/payroll/config/", {
        user: cfgUserId,
        salary_type: cfgType,
        amount: Number(cfgAmount),
        overtime_rate: Number(cfgOvertime),
      });
      setShowConfigForm(false);
      setCfgUserId(""); setCfgAmount(""); setCfgType("hourly"); setCfgOvertime("1.5");
      fetchConfigs();
    } catch (e: any) {
      const d = e.response?.data;
      setCfgError(typeof d === "object" ? Object.values(d).flat().join(" ") : t('errorOccurred'));
    } finally {
      setSavingCfg(false);
    }
  }, [cfgUserId, cfgAmount, cfgType, cfgOvertime, fetchConfigs, t]);

  const handleCalculate = async () => {
    setCalculating(true);
    setCalcResult(null);
    try {
      const { data } = await apiClient.post("/api/v1/payroll/records/calculate/", {
        month: calcMonth,
      });
      setCalcResult({ message: data.message || t('saved'), isError: false });
      fetchRecords();
      setTimeout(() => setTab("records"), 1500);
    } catch (e: any) {
      setCalcResult({ 
        message: e.response?.data?.error || t('errorCalculating'), 
        isError: true 
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    const headers = [
        t('employee'), t('month'), t('workDays'), t('workHours'), 
        t('overtimeHours'), t('baseSalary'), t('overtimePay'), t('netSalary'), t('status')
    ];
    
    const csvRows = [
      headers.join(','),
      ...records.map(rec => [
        `"${rec.user_full_name}"`,
        rec.month,
        rec.work_days,
        rec.work_hours,
        rec.overtime_hours,
        rec.base_salary,
        rec.overtime_pay,
        rec.net_salary,
        rec.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_${calcMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: "records" as Tab, label: t('payrollRecords'), icon: Banknote },
    ...(isOwnerOrAccountant
      ? [
          { id: "salary_config" as Tab, label: t('salaryConfig'), icon: Users },
          { id: "calculate" as Tab, label: t('calculate'), icon: Calculator },
        ]
      : []),
  ];

  const salaryTypeLabel = { 
    hourly: t('hourly'), 
    daily: t('daily'), 
    monthly: t('monthly') 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('payrollManagement')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('payrollSubtitle')}</p>
        </div>
        {tab === "records" && records.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all active:scale-95"
            >
              <FileSpreadsheet size={16} />
              Excel (CSV)
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all active:scale-95"
            >
              <Printer size={16} />
              {t('export')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${active 
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-slate-200/50 dark:shadow-none" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30"}
              `}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Records tab */}
      {tab === "records" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                  {(isOwnerOrAccountant
                    ? [t('employee'), t('month'), t('workDays'), t('workHours'), t('overtimeHours'), t('baseSalary'), t('overtimePay'), t('netSalary'), t('status')]
                    : [t('month'), t('workDays'), t('workHours'), t('baseSalary'), t('overtimePay'), t('netSalary'), t('status')]
                  ).map((h) => (
                    <th key={h} className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loadingRecords ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center text-slate-400 dark:text-slate-500 italic">
                      <div className="flex flex-col items-center gap-3">
                        <Banknote size={40} className="text-slate-200 dark:text-slate-700" />
                        <span className="text-sm font-medium">{t('noData')}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((rec, i) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      {isOwnerOrAccountant && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{rec.user_full_name || "—"}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">{rec.month}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">{rec.work_days}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        {Number(rec.work_hours).toFixed(1)}h
                      </td>
                      {isOwnerOrAccountant && (
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-amber-500 font-bold">
                          +{Number(rec.overtime_hours).toFixed(1)}h
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400">{fmt(rec.base_salary)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-500">
                        +{fmt(rec.overtime_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{fmt(rec.net_salary)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={rec.status || "draft"} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary config tab */}
      {tab === "salary_config" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setShowConfigForm(!showConfigForm); setCfgError(""); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group"
            >
              <Plus size={18} className={`${showConfigForm ? 'rotate-45' : ''} transition-transform duration-300`} />
              {showConfigForm ? t('cancel') : t('configureSalary')}
            </button>
          </div>

          {/* Config form */}
          {showConfigForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Users size={18} className="text-indigo-500" />
                {t('configureSalary')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('employee')} *</label>
                  <select
                    value={cfgUserId}
                    onChange={(e) => setCfgUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{t('selectEmployee')}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name || u.phone}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('salaryType')}</label>
                  <select
                    value={cfgType}
                    onChange={(e) => setCfgType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="hourly">{t('hourly')}</option>
                    <option value="daily">{t('daily')}</option>
                    <option value="monthly">{t('monthly')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                    {t('amount')} ({lang === 'uz' ? "so'm" : lang === 'ru' ? 'сум' : 'sum'}) *
                    <span className="font-normal text-slate-400 dark:text-slate-500 lowercase ml-2">
                       (per {cfgType === "hourly" ? "hour" : cfgType === "daily" ? "day" : "month"})
                    </span>
                  </label>
                  <input
                    type="number"
                    value={cfgAmount}
                    onChange={(e) => setCfgAmount(e.target.value)}
                    placeholder={cfgType === "hourly" ? "15000" : cfgType === "daily" ? "200000" : "5000000"}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                    {t('overtimeRate')} (%)
                    <span className="font-normal text-slate-400 dark:text-slate-500 lowercase ml-2">
                      (multiplier)
                    </span>
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={cfgOvertime} 
                    onChange={(e) => setCfgOvertime(e.target.value)} 
                    placeholder="1.5"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {cfgAmount && cfgType === "hourly" && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mb-6 text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-3">
                  <Info size={18} className="mt-0.5" />
                  <div>
                    <p>💡 <strong>1 day</strong> (8h): {fmt(Number(cfgAmount) * 8)}</p>
                    <p>💡 <strong>1 month</strong> (22d): {fmt(Number(cfgAmount) * 8 * 22)}</p>
                    <p>💡 <strong>Overtime</strong> (1h): {fmt(Number(cfgAmount) * Number(cfgOvertime))}</p>
                  </div>
                </div>
              )}

              {cfgError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50 mb-6 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle size={18} /> {cfgError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfigForm(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingCfg}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {savingCfg && <Loader2 size={16} className="animate-spin" />}
                  <Save size={18} />
                  {t('save')}
                </button>
              </div>
            </div>
          )}

          {/* Configs table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                    {[t('employee'), t('salaryType'), t('amount'), t('overtimeRate'), t('actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {loadingConfigs ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full"></div></td></tr>
                    ))
                  ) : configs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 dark:text-slate-500 italic font-medium">{t('noData')}</td></tr>
                  ) : (
                    configs.map((cfg, i) => {
                      const u = users.find((u) => u.id === cfg.user);
                      return (
                        <tr key={cfg.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900 dark:text-white uppercase">{u?.full_name || u?.phone || cfg.user}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`
                              px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                              ${cfg.salary_type === "hourly" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : 
                                cfg.salary_type === "daily" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : 
                                "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"}
                            `}>
                              {salaryTypeLabel[cfg.salary_type]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-slate-900 dark:text-white italic">
                              {fmt(cfg.amount)}
                              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 not-italic ml-1">
                                /{cfg.salary_type === "hourly" ? "h" : cfg.salary_type === "daily" ? "d" : "m"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-amber-500">
                            ×{cfg.overtime_rate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={async () => {
                                if (!window.confirm(t('deleteConfigConfirm'))) return;
                                try {
                                  await apiClient.delete(`/api/v1/payroll/config/${cfg.id}/`);
                                  fetchConfigs();
                                } catch { alert(t('errorOccurred')); }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Calculate tab */}
      {tab === "calculate" && (
        <div className="max-w-2xl mx-auto py-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-8">
                    <div className="space-y-2 text-center">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
                            <Calculator size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('calculateSalary')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t('calculateSubtitle')}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('calculationMonth')}</label>
                            <input
                            type="month"
                            value={calcMonth}
                            onChange={(e) => setCalcMonth(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-center"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: t('workDays'), icon: Clock, info: t('workDaysDesc') },
                                { label: t('overtimeHours'), icon: TrendingUp, info: t('overtimeDesc') },
                            ].map(({ label, icon: Icon, info }) => (
                                <div key={label} className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <Icon size={20} className="text-emerald-500 mb-3" />
                                    <div className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{label}</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-3 italic">{info}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {calcResult && (
                        <div className={`
                            p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2
                            ${calcResult.isError ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"}
                        `}>
                            {calcResult.isError ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                            <span className="text-sm font-bold tracking-tight">{calcResult.message}</span>
                        </div>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={calculating}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                    >
                        {calculating ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <Calculator size={24} />
                        )}
                        {calculating ? t('calculating') : `${calcMonth} ${t('calculateSalary')}`}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
