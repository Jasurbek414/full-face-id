import React, { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Banknote, Calculator, Users, Clock, TrendingUp, Plus, Save,
  Loader2, CheckCircle2, ChevronDown, ChevronRight, AlertTriangle,
  Download, FileSpreadsheet, Printer, Trash2, Info, Search,
  Check, X, Filter, RefreshCw, DollarSign, BadgeDollarSign,
  BadgePercent, Building2, ChevronUp, FileDown, Eye, Edit3,
  CircleDollarSign, Minus, CheckCheck,
} from "lucide-react";
import { apiClient } from "../api/client";
import { payrollAPI } from "../api/payroll";
import { companyUsersAPI } from "../api/devices";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";

type Tab = "records" | "salary_config" | "calculate" | "analytics";

interface SalaryConfig {
  id: number;
  user: string;
  user_full_name: string;
  user_phone: string;
  department_name: string | null;
  salary_type: "hourly" | "daily" | "monthly";
  amount: string;
  overtime_rate: string;
  night_rate: string;
  tax_percent: string;
  inps_percent: string;
}

interface PayrollRecord {
  id: number;
  user: string;
  user_full_name: string;
  user_phone: string;
  department_name: string | null;
  month: string;
  month_str: string;
  work_days: number;
  work_hours: string;
  overtime_hours: string;
  night_hours: string;
  base_salary: string;
  overtime_pay: string;
  night_pay: string;
  gross_salary: number;
  tax_amount: string;
  inps_amount: string;
  deductions: string;
  net_salary: string;
  status: string;
  notes: string;
  deduction_items: DeductionItem[];
}

interface DeductionItem {
  id: number;
  name: string;
  deduction_type: string;
  amount: string;
  percent: string | null;
  note: string;
}

interface Summary {
  total_gross: number;
  total_net: number;
  total_tax: number;
  total_inps: number;
  total_deductions: number;
  total_employees: number;
  paid_count: number;
  approved_count: number;
  draft_count: number;
  department_breakdown: { department: string; total_net: number; count: number }[];
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:    { label: "Qoralama",      cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  approved: { label: "Tasdiqlangan",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  paid:     { label: "To'langan",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

const DEDUCTION_TYPES: Record<string, string> = {
  tax: "Daromad solig'i", inps: "INPS", pension: "Pensiya", loan: "Kredit", advance: "Avans", other: "Boshqa",
};

export function PayrollPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("records");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Access check
  const isAccountant = (() => {
    if (!user) return false;
    if (user.is_staff) return true;
    const r = (user.role?.name || "").toUpperCase();
    return ["OWNER", "ADMIN", "ACCOUNTANT", "HR"].includes(r);
  })();

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Format helpers ───────────────────────────────────────────────────────
  const curr = (v: number | string) => {
    const n = Number(v);
    if (isNaN(n)) return "0";
    return n.toLocaleString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US", {
      maximumFractionDigits: 0,
    }) + " " + (lang === "uz" ? "so'm" : lang === "ru" ? "сум" : "UZS");
  };

  // ── Filters ─────────────────────────────────────────────────────────────
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // ── Records ─────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const params: any = {};
      if (filterMonth) params.month = filterMonth;
      if (filterStatus) params.status = filterStatus;

      const url = isAccountant ? "/api/v1/payroll/records/" : "/api/v1/payroll/records/my/";
      const { data } = await apiClient.get(url, { params });
      setRecords(data.results || data || []);

      if (isAccountant && filterMonth) {
        const { data: sumData } = await payrollAPI.summary({ month: filterMonth });
        setSummary(sumData);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [isAccountant, filterMonth, filterStatus]);

  useEffect(() => {
    if (tab === "records") {
      fetchRecords();
      if (isAccountant && configs.length === 0) fetchConfigs();
    } else if (tab === "salary_config") {
      fetchConfigs();
    }
  }, [tab, filterMonth, filterStatus]);

  // Filtered records (client-side search by name)
  const filteredRecords = records.filter(r => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      r.user_full_name?.toLowerCase().includes(q) ||
      r.user_phone?.includes(q) ||
      r.department_name?.toLowerCase().includes(q)
    );
  });

  // ── Status actions ───────────────────────────────────────────────────────
  const handleApprove = async (id: number) => {
    try {
      await payrollAPI.approve(id);
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      showToast("Tasdiqlandi ✓");
    } catch { showToast("Xatolik", false); }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await payrollAPI.markPaid(id);
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'paid' } : r));
      showToast("To'langan deb belgilandi ✓");
    } catch { showToast("Xatolik", false); }
  };

  const handleApproveBulk = async () => {
    if (!window.confirm(`${filterMonth} oyidagi barcha qoralama yozuvlarni tasdiqlaysizmi?`)) return;
    try {
      const { data } = await payrollAPI.approveBulk({ month: filterMonth });
      showToast(`${data.approved} ta yozuv tasdiqlandi`);
      fetchRecords();
    } catch { showToast("Xatolik", false); }
  };

  // ── Deductions ───────────────────────────────────────────────────────────
  const [dedModal, setDedModal] = useState<{ recordId: number; gross: number; items: DeductionItem[] } | null>(null);
  const [dedUsePercent, setDedUsePercent] = useState(false);
  const [dedForm, setDedForm] = useState({ name: "", deduction_type: "other", amount: "", percent: "", note: "" });
  const [savingDed, setSavingDed] = useState(false);

  const openDeductions = (rec: PayrollRecord) => {
    setDedModal({ recordId: rec.id, gross: rec.gross_salary, items: rec.deduction_items || [] });
    setDedUsePercent(false);
    setDedForm({ name: "", deduction_type: "other", amount: "", percent: "", note: "" });
  };

  // Auto-calculate amount from percent of gross
  const dedCalcAmount = dedModal && dedUsePercent && dedForm.percent
    ? Math.round(dedModal.gross * Number(dedForm.percent) / 100)
    : null;

  const handleAddDeduction = async () => {
    if (!dedModal || !dedForm.name) return;
    const finalAmount = dedUsePercent ? dedCalcAmount : Number(dedForm.amount);
    if (!finalAmount || finalAmount <= 0) { showToast("Miqdor yoki foizni kiriting", false); return; }
    setSavingDed(true);
    try {
      const { data } = await payrollAPI.addDeduction(dedModal.recordId, {
        name: dedForm.name,
        deduction_type: dedForm.deduction_type,
        amount: finalAmount,
        percent: dedUsePercent && dedForm.percent ? Number(dedForm.percent) : null,
        note: dedForm.note,
      });
      setDedModal(prev => prev ? { ...prev, items: [...prev.items, data] } : null);
      setDedForm({ name: "", deduction_type: "other", amount: "", percent: "", note: "" });
      fetchRecords();
    } catch { showToast("Chegirma qo'shishda xatolik", false); }
    setSavingDed(false);
  };

  const handleDeleteDeduction = async (itemId: number) => {
    if (!dedModal) return;
    try {
      await payrollAPI.deleteDeduction(dedModal.recordId, itemId);
      setDedModal(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : null);
      fetchRecords();
    } catch { showToast("Xatolik", false); }
  };

  // ── Notes edit ───────────────────────────────────────────────────────────
  const [editNotes, setEditNotes] = useState<{ id: number; val: string } | null>(null);
  const saveNotes = async () => {
    if (!editNotes) return;
    try {
      await payrollAPI.update(editNotes.id, { notes: editNotes.val });
      setRecords(prev => prev.map(r => r.id === editNotes.id ? { ...r, notes: editNotes.val } : r));
      setEditNotes(null);
      showToast("Eslatma saqlandi");
    } catch { showToast("Xatolik", false); }
  };

  // ── Salary Config ────────────────────────────────────────────────────────
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SalaryConfig | null>(null);
  const [cfgForm, setCfgForm] = useState({
    user: "", salary_type: "monthly" as "hourly" | "daily" | "monthly",
    amount: "", overtime_rate: "1.5", night_rate: "2.0",
    tax_percent: "12.0", inps_percent: "1.0",
  });
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgError, setCfgError] = useState("");

  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    try {
      const [cfgRes, usersRes] = await Promise.all([
        payrollAPI.configs(),
        companyUsersAPI.list(),
      ]);
      setConfigs(cfgRes.data.results || cfgRes.data || []);
      setCompanyUsers(usersRes.data.results || usersRes.data || []);
    } catch { setConfigs([]); }
    setLoadingConfigs(false);
  }, []);

  const openConfigForm = (cfg?: SalaryConfig) => {
    if (cfg) {
      setEditingConfig(cfg);
      setCfgForm({
        user: cfg.user,
        salary_type: cfg.salary_type,
        amount: cfg.amount,
        overtime_rate: cfg.overtime_rate,
        night_rate: cfg.night_rate,
        tax_percent: cfg.tax_percent,
        inps_percent: cfg.inps_percent,
      });
    } else {
      setEditingConfig(null);
      setCfgForm({ user: "", salary_type: "monthly", amount: "", overtime_rate: "1.5", night_rate: "2.0", tax_percent: "12.0", inps_percent: "1.0" });
    }
    setShowConfigForm(true);
    setCfgError("");
  };

  const handleSaveConfig = async () => {
    if (!cfgForm.user && !editingConfig) { setCfgError(t('selectEmployee')); return; }
    if (!cfgForm.amount || isNaN(Number(cfgForm.amount)) || Number(cfgForm.amount) <= 0) {
      setCfgError(t('enterAmount')); return;
    }
    setSavingCfg(true); setCfgError("");
    try {
      const payload = {
        user: cfgForm.user || editingConfig?.user,
        salary_type: cfgForm.salary_type,
        amount: Number(cfgForm.amount),
        overtime_rate: Number(cfgForm.overtime_rate),
        night_rate: Number(cfgForm.night_rate),
        tax_percent: Number(cfgForm.tax_percent),
        inps_percent: Number(cfgForm.inps_percent),
      };
      if (editingConfig) {
        await payrollAPI.updateConfig(editingConfig.id, payload);
        showToast("Sozlama yangilandi");
      } else {
        await payrollAPI.createConfig(payload);
        showToast("Sozlama saqlandi");
      }
      setShowConfigForm(false);
      fetchConfigs();
    } catch (e: any) {
      const d = e.response?.data;
      setCfgError(typeof d === "object" ? Object.values(d).flat().join(" ") : t('errorOccurred'));
    }
    setSavingCfg(false);
  };

  const handleDeleteConfig = async (id: number) => {
    if (!window.confirm(t('deleteConfigConfirm'))) return;
    try {
      await payrollAPI.deleteConfig(id);
      fetchConfigs();
      showToast("O'chirildi");
    } catch { showToast("Xatolik", false); }
  };

  // ── Calculate ────────────────────────────────────────────────────────────
  const [calcMonth, setCalcMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<{ message: string; ok: boolean; calculated?: number; skipped?: number } | null>(null);

  const handleCalculate = async () => {
    setCalculating(true); setCalcResult(null);
    try {
      const { data } = await payrollAPI.calculate(calcMonth);
      setCalcResult({ message: data.message, ok: true, calculated: data.calculated, skipped: data.skipped });
      setTimeout(() => { setTab("records"); fetchRecords(); }, 2000);
    } catch (e: any) {
      setCalcResult({ message: e.response?.data?.error || t('errorCalculating'), ok: false });
    }
    setCalculating(false);
  };

  // ── Robust file downloader ───────────────────────────────────────────────
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  };

  // ── Exports ─────────────────────────────────────────────────────────────
  const handleExportExcelFrontend = () => {
    const data = records.length ? records : filteredRecords;
    if (!data.length) { showToast("Yuklab olish uchun ma'lumot yo'q", false); return; }
    const rows = data.map(r => ({
      "Xodim": r.user_full_name,
      "Telefon": r.user_phone,
      "Bo'lim": r.department_name || "",
      "Oy": r.month_str,
      "Ish kunlari": r.work_days,
      "Ish soatlari": Number(r.work_hours).toFixed(1),
      "Q.ish soatlari": Number(r.overtime_hours).toFixed(1),
      "Asosiy maosh": Number(r.base_salary),
      "Q.ish to'lovi": Number(r.overtime_pay),
      "Tunda ishlash": Number(r.night_pay),
      "Brutto": r.gross_salary,
      "Daromad solig'i": Number(r.tax_amount),
      "INPS": Number(r.inps_amount),
      "Jami chegirma": Number(r.deductions),
      "Netto maosh": Number(r.net_salary),
      "Holat": STATUS_BADGE[r.status]?.label || r.status,
      "Eslatma": r.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws['!cols'] = [24,14,18,10,10,10,10,16,14,14,14,16,12,14,16,14,20].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Maosh");
    XLSX.writeFile(wb, `maosh_${filterMonth || "all"}.xlsx`);
    showToast("Excel yuklab olindi ✓");
  };

  const handleExportCsv = () => {
    const data = records.length ? records : filteredRecords;
    if (!data.length) { showToast("Yuklab olish uchun ma'lumot yo'q", false); return; }
    const headers = [
      "Xodim","Telefon","Bo'lim","Oy","Ish kunlari","Ish soatlari","Q.soatlar",
      "Asosiy maosh","Q.ish to'lovi","Tunda","Brutto",
      "Daromad solig'i","INPS","Jami chegirma","Netto maosh","Holat","Eslatma",
    ];
    const rows = data.map(r => [
      `"${(r.user_full_name || "").replace(/"/g, '""')}"`,
      r.user_phone || "",
      (r.department_name || "").replace(/,/g, " "),
      r.month_str || "",
      r.work_days,
      Number(r.work_hours).toFixed(1),
      Number(r.overtime_hours).toFixed(1),
      Number(r.base_salary).toFixed(2),
      Number(r.overtime_pay).toFixed(2),
      Number(r.night_pay).toFixed(2),
      Number(r.gross_salary).toFixed(2),
      Number(r.tax_amount).toFixed(2),
      Number(r.inps_amount).toFixed(2),
      Number(r.deductions).toFixed(2),
      Number(r.net_salary).toFixed(2),
      STATUS_BADGE[r.status]?.label || r.status,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ].join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `maosh_${filterMonth || "all"}.csv`);
    showToast("CSV yuklab olindi ✓");
  };

  const [exportingBackend, setExportingBackend] = useState(false);
  const handleExportExcelBackend = async () => {
    setExportingBackend(true);
    try {
      const token = localStorage.getItem('access_token') || "";
      const companyId = localStorage.getItem('company_id') || "";
      const params = new URLSearchParams();
      if (filterMonth) params.set("month", filterMonth);
      if (filterStatus) params.set("status", filterStatus);
      const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const url = `${baseUrl}/api/v1/payroll/records/export-excel/?${params}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "X-Company-ID": companyId },
      });
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      triggerDownload(blob, `maosh_${filterMonth || "all"}.xlsx`);
      showToast("Excel (server) yuklab olindi ✓");
    } catch (e: any) {
      showToast("Eksport xatosi: " + (e.message || "serverda xatolik"), false);
    }
    setExportingBackend(false);
  };

  const handleExportCsvBackend = async () => {
    setExportingBackend(true);
    try {
      const token = localStorage.getItem('access_token') || "";
      const companyId = localStorage.getItem('company_id') || "";
      const params = new URLSearchParams();
      if (filterMonth) params.set("month", filterMonth);
      if (filterStatus) params.set("status", filterStatus);
      const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const url = `${baseUrl}/api/v1/payroll/records/export-csv/?${params}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "X-Company-ID": companyId },
      });
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      triggerDownload(blob, `maosh_${filterMonth || "all"}.csv`);
      showToast("CSV (server) yuklab olindi ✓");
    } catch (e: any) {
      showToast("Eksport xatosi: " + (e.message || "serverda xatolik"), false);
    }
    setExportingBackend(false);
  };

  const handlePrint = () => window.print();

  // ── Unique departments from records ──────────────────────────────────────
  const departments = Array.from(new Set(records.map(r => r.department_name).filter(Boolean)));

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "records", label: t('payrollRecords'), icon: Banknote },
    ...(isAccountant ? [
      { id: "salary_config" as Tab, label: t('salaryConfig'), icon: Users },
      { id: "calculate" as Tab, label: t('calculateSalary'), icon: Calculator },
      { id: "analytics" as Tab, label: "Tahlil", icon: TrendingUp },
    ] : []),
  ];

  // ── Salary type label ─────────────────────────────────────────────────────
  const salaryLabel: Record<string, string> = { hourly: t('hourly'), daily: t('daily'), monthly: t('monthly') };

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100">{t('payrollManagement')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{t('payrollSubtitle')}</p>
        </div>
        {tab === "records" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button onClick={handleExportExcelFrontend} title="Excel (brauzer)"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1A1D2E] text-emerald-700 dark:text-emerald-400 rounded-md text-[12px] font-bold shadow-sm hover:shadow transition-all active:scale-95">
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button onClick={handleExportCsv} title="CSV (brauzer)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 dark:text-blue-400 rounded-md text-[12px] font-bold hover:bg-white dark:hover:bg-[#1A1D2E] transition-all active:scale-95">
                <FileDown size={13} /> CSV
              </button>
              <button onClick={handleExportExcelBackend} disabled={exportingBackend} title="Excel to'liq (server)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-teal-700 dark:text-teal-400 rounded-md text-[12px] font-bold hover:bg-white dark:hover:bg-[#1A1D2E] transition-all active:scale-95 disabled:opacity-50">
                {exportingBackend ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Server Excel
              </button>
              <button onClick={handlePrint} title="Chop etish"
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-300 rounded-md text-[12px] font-bold hover:bg-white dark:hover:bg-[#1A1D2E] transition-all active:scale-95">
                <Printer size={13} />
              </button>
            </div>
            {isAccountant && records.some(r => r.status === "draft") && (
              <button onClick={handleApproveBulk}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 transition-all active:scale-95">
                <CheckCheck size={14} /> Barchasini tasdiqlash
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      {tab === "records" && isAccountant && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Jami brutto", value: curr(summary.total_gross), icon: <BadgeDollarSign size={16} />, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { label: "Jami netto", value: curr(summary.total_net), icon: <DollarSign size={16} />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Daromad solig'i", value: curr(summary.total_tax), icon: <BadgePercent size={16} />, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
            { label: "INPS", value: curr(summary.total_inps), icon: <BadgePercent size={16} />, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
            { label: "Xodimlar soni", value: summary.total_employees.toString(), icon: <Users size={16} />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "To'langan", value: summary.paid_count.toString(), icon: <CheckCircle2 size={16} />, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] p-3 shadow-sm">
              <div className={`w-7 h-7 rounded-lg ${bg} ${color} flex items-center justify-center mb-2`}>{icon}</div>
              <div className={`text-[13px] font-black ${color}`}>{value}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all
              ${tab === id
                ? "bg-white dark:bg-[#1A1D2E] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── RECORDS TAB ─────────────────────────────────────────────────── */}
      {tab === "records" && (
        <div className="space-y-4">
          {/* Tax rates quick reference */}
          {isAccountant && configs.length > 0 && (
            <div className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] p-3 flex flex-wrap items-center gap-4">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><BadgePercent size={12} />Joriy soliq stavkalari:</span>
              {configs.slice(0, 5).map(cfg => (
                <div key={cfg.id} className="flex items-center gap-2 text-[12px]">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">{cfg.user_full_name.split(' ')[0]}:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{cfg.tax_percent}% soliq</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{cfg.inps_percent}% INPS</span>
                </div>
              ))}
              <button onClick={() => setTab("salary_config")} className="ml-auto text-[11px] text-indigo-500 hover:text-indigo-700 font-bold transition-colors">
                Barchasini ko'rish →
              </button>
            </div>
          )}

          {/* Filter bar */}
          <div className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 uppercase"><Filter size={13} />Filtr</div>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-lg text-[13px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-lg text-[13px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="">Barcha holat</option>
              <option value="draft">Qoralama</option>
              <option value="approved">Tasdiqlangan</option>
              <option value="paid">To'langan</option>
            </select>
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Xodim qidirish..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-lg text-[13px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <button onClick={fetchRecords} className="p-2 rounded-lg border border-gray-200 dark:border-[#2D3148] text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-[#2D3148]">
                    {(isAccountant
                      ? ["Xodim", "Oy", "Ish k.", "Soatlar", "Asosiy", "Brutto", "Chegirmalar", "Netto", "Holat", ""]
                      : ["Oy", "Ish k.", "Soatlar", "Asosiy", "Brutto", "Chegirmalar", "Netto", "Holat"]
                    ).map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingRecords ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-[#2D3148]/60 animate-pulse">
                        <td colSpan={10} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredRecords.length === 0 ? (
                    <tr><td colSpan={10} className="py-20 text-center">
                      <Banknote size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                      <div className="text-[13px] font-medium text-gray-400">{t('noData')}</div>
                    </td></tr>
                  ) : filteredRecords.map((rec, i) => (
                    <React.Fragment key={rec.id}>
                      <tr
                        className={`border-b border-gray-100 dark:border-[#2D3148]/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer
                          ${i % 2 !== 0 ? "bg-gray-50/50 dark:bg-white/[0.01]" : ""}`}
                        onClick={() => setExpandedRow(expandedRow === rec.id ? null : rec.id)}
                      >
                        {isAccountant && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                                {(rec.user_full_name || "?").slice(0, 2)}
                              </div>
                              <div>
                                <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200 leading-none">{rec.user_full_name || "—"}</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">{rec.department_name || "Bo'limsiz"}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[12px] font-bold text-gray-600 dark:text-gray-400">{rec.month_str}</span>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-bold text-gray-700 dark:text-gray-300">{rec.work_days}</td>
                        <td className="px-4 py-3 text-[12px] font-mono text-gray-600 dark:text-gray-400">
                          {Number(rec.work_hours).toFixed(1)}h
                          {Number(rec.overtime_hours) > 0 && (
                            <span className="text-amber-500 dark:text-amber-400 ml-1">+{Number(rec.overtime_hours).toFixed(1)}h</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 dark:text-gray-400">{curr(rec.base_salary)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-[13px] font-bold text-gray-700 dark:text-gray-200">{curr(rec.gross_salary)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-[12px] text-red-600 dark:text-red-400">-{curr(rec.deductions)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[14px] font-black text-indigo-600 dark:text-indigo-400">{curr(rec.net_salary)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${STATUS_BADGE[rec.status]?.cls}`}>
                            {STATUS_BADGE[rec.status]?.label}
                          </span>
                        </td>
                        {isAccountant && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {expandedRow === rec.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expanded row */}
                      {expandedRow === rec.id && (
                        <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                          <td colSpan={isAccountant ? 10 : 8} className="px-6 py-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                              {/* Breakdown */}
                              <div className="lg:col-span-1">
                                <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Maosh tafsiloti</div>
                                <div className="space-y-2">
                                  {[
                                    { label: "Asosiy maosh", val: curr(rec.base_salary), cls: "" },
                                    { label: "Q.ish to'lovi", val: `+${curr(rec.overtime_pay)}`, cls: "text-amber-600 dark:text-amber-400" },
                                    { label: "Tunda ishlash", val: `+${curr(rec.night_pay)}`, cls: "text-blue-600 dark:text-blue-400" },
                                    null,
                                    { label: "Brutto", val: curr(rec.gross_salary), cls: "font-black text-gray-800 dark:text-gray-100" },
                                    { label: "Daromad solig'i", val: `-${curr(rec.tax_amount)}`, cls: "text-red-500" },
                                    { label: "INPS", val: `-${curr(rec.inps_amount)}`, cls: "text-red-500" },
                                    null,
                                    { label: "Netto maosh", val: curr(rec.net_salary), cls: "font-black text-indigo-600 dark:text-indigo-400 text-[14px]" },
                                  ].map((item, idx) =>
                                    item === null ? (
                                      <div key={idx} className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                    ) : (
                                      <div key={item.label} className="flex justify-between text-[12px]">
                                        <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                                        <span className={item.cls}>{item.val}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Deductions */}
                              {isAccountant && (
                                <div className="lg:col-span-1">
                                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">
                                    Qo'shimcha chegirmalar
                                  </div>
                                  {rec.deduction_items?.length > 0 ? (
                                    <div className="space-y-2 mb-3">
                                      {rec.deduction_items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between bg-white dark:bg-[#1A1D2E] rounded-lg px-3 py-2 border border-gray-200 dark:border-[#2D3148]">
                                          <div>
                                            <div className="text-[12px] font-bold text-gray-700 dark:text-gray-200">{item.name}</div>
                                            <div className="text-[10px] text-gray-400">{DEDUCTION_TYPES[item.deduction_type] || item.deduction_type}</div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-red-600 dark:text-red-400">-{curr(item.amount)}</span>
                                            <button onClick={() => handleDeleteDeduction(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={13} /></button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[12px] text-gray-400 mb-3">Chegirma yo'q</div>
                                  )}
                                  <button onClick={() => openDeductions(rec)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[12px] font-bold border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 transition-colors">
                                    <Plus size={13} /> Chegirma qo'shish
                                  </button>
                                </div>
                              )}

                              {/* Status + Notes + Actions */}
                              <div className="lg:col-span-1">
                                <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Amallar</div>
                                {isAccountant && (
                                  <div className="space-y-2 mb-4">
                                    {rec.status === "draft" && (
                                      <button onClick={() => handleApprove(rec.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition-colors">
                                        <Check size={13} /> Tasdiqlash
                                      </button>
                                    )}
                                    {rec.status === "approved" && (
                                      <button onClick={() => handleMarkPaid(rec.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[12px] font-bold hover:bg-emerald-700 transition-colors">
                                        <CircleDollarSign size={13} /> To'langan deb belgilash
                                      </button>
                                    )}
                                  </div>
                                )}
                                <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Eslatma</div>
                                {editNotes?.id === rec.id ? (
                                  <div className="space-y-2">
                                    <textarea rows={3} value={editNotes.val} onChange={e => setEditNotes({ ...editNotes, val: e.target.value })}
                                      className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-[#0F1117] text-[12px] text-gray-800 dark:text-gray-200 focus:outline-none resize-none" />
                                    <div className="flex gap-2">
                                      <button onClick={saveNotes} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold">Saqlash</button>
                                      <button onClick={() => setEditNotes(null)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-[11px] font-bold">Bekor</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <div className="text-[12px] text-gray-500 dark:text-gray-400 flex-1">{rec.notes || "Eslatma yo'q"}</div>
                                    {isAccountant && (
                                      <button onClick={() => setEditNotes({ id: rec.id, val: rec.notes || "" })} className="text-gray-300 hover:text-indigo-500"><Edit3 size={13} /></button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer summary */}
            {filteredRecords.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-[#2D3148] flex flex-wrap gap-6 text-[12px] font-bold text-gray-500">
                <span>Jami: <span className="text-gray-800 dark:text-gray-200">{filteredRecords.length} xodim</span></span>
                <span>Brutto: <span className="text-gray-800 dark:text-gray-200">{curr(filteredRecords.reduce((s, r) => s + r.gross_salary, 0))}</span></span>
                <span>Chegirmalar: <span className="text-red-600 dark:text-red-400">-{curr(filteredRecords.reduce((s, r) => s + Number(r.deductions), 0))}</span></span>
                <span>Netto: <span className="text-indigo-600 dark:text-indigo-400">{curr(filteredRecords.reduce((s, r) => s + Number(r.net_salary), 0))}</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SALARY CONFIG TAB ──────────────────────────────────────────── */}
      {tab === "salary_config" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openConfigForm()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              <Plus size={16} className={showConfigForm ? "rotate-45 transition-transform" : ""} />
              {showConfigForm ? t('cancel') : t('configureSalary')}
            </button>
          </div>

          {/* Config form */}
          {showConfigForm && (
            <div className="bg-white dark:bg-[#1A1D2E] rounded-2xl border border-gray-200 dark:border-[#2D3148] shadow-xl p-6">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" />
                {editingConfig ? "Sozlamani tahrirlash" : t('configureSalary')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                {[
                  { label: `${t('employee')} *`, content: !editingConfig ? (
                    <select value={cfgForm.user} onChange={e => setCfgForm({ ...cfgForm, user: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-xl text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      <option value="">{t('selectEmployee')}</option>
                      {companyUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.phone}</option>)}
                    </select>
                  ) : (
                    <div className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-xl text-[13px] font-bold text-gray-700 dark:text-gray-300">
                      {editingConfig.user_full_name}
                    </div>
                  )},
                  { label: t('salaryType'), content: (
                    <select value={cfgForm.salary_type} onChange={e => setCfgForm({ ...cfgForm, salary_type: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-xl text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      <option value="hourly">{t('hourly')}</option>
                      <option value="daily">{t('daily')}</option>
                      <option value="monthly">{t('monthly')}</option>
                    </select>
                  )},
                  { label: `${t('amount')} (so'm) *`, content: (
                    <input type="number" value={cfgForm.amount} onChange={e => setCfgForm({ ...cfgForm, amount: e.target.value })}
                      placeholder={cfgForm.salary_type === "hourly" ? "15000" : cfgForm.salary_type === "daily" ? "200000" : "5000000"}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-xl text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500" />
                  )},
                  { label: "Q.ish koeffitsiyenti (×)", content: (
                    <input type="number" step="0.1" value={cfgForm.overtime_rate} onChange={e => setCfgForm({ ...cfgForm, overtime_rate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-xl text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500" />
                  )},
                  { label: "Daromad solig'i (%)", content: (
                    <input type="number" step="0.5" value={cfgForm.tax_percent} onChange={e => setCfgForm({ ...cfgForm, tax_percent: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-xl text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500" />
                  )},
                  { label: "INPS (%)", content: (
                    <input type="number" step="0.5" value={cfgForm.inps_percent} onChange={e => setCfgForm({ ...cfgForm, inps_percent: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-xl text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500" />
                  )},
                ].map(({ label, content }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
                    {content}
                  </div>
                ))}
              </div>

              {/* Preview */}
              {cfgForm.amount && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/40 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                  {(() => {
                    const a = Number(cfgForm.amount);
                    const tax = a * Number(cfgForm.tax_percent) / 100;
                    const inps = a * Number(cfgForm.inps_percent) / 100;
                    const net = a - tax - inps;
                    const items = cfgForm.salary_type === "hourly"
                      ? [
                          { label: "Kunlik (8h)", val: curr(a * 8) },
                          { label: "Oylik (22k)", val: curr(a * 8 * 22) },
                          { label: "Solig'i", val: curr(tax * 8 * 22) },
                          { label: "Netto (oylik)", val: curr(net * 8 * 22) },
                        ]
                      : cfgForm.salary_type === "daily"
                      ? [
                          { label: "Oylik (22k)", val: curr(a * 22) },
                          { label: "Solig'i", val: curr(tax * 22) },
                          { label: "INPS", val: curr(inps * 22) },
                          { label: "Netto (oylik)", val: curr(net * 22) },
                        ]
                      : [
                          { label: "Brutto", val: curr(a) },
                          { label: "Solig'i", val: curr(tax) },
                          { label: "INPS", val: curr(inps) },
                          { label: "Netto", val: curr(net) },
                        ];
                    return items.map(({ label, val }) => (
                      <div key={label}>
                        <div className="text-[10px] font-bold text-indigo-400 uppercase">{label}</div>
                        <div className="text-[13px] font-black text-indigo-700 dark:text-indigo-300">{val}</div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {cfgError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-[12px] text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
                  <AlertTriangle size={15} />{cfgError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfigForm(false)}
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-[#2D3148] rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                  {t('cancel')}
                </button>
                <button onClick={handleSaveConfig} disabled={savingCfg}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 active:scale-95">
                  {savingCfg && <Loader2 size={15} className="animate-spin" />}
                  <Save size={15} />{t('save')}
                </button>
              </div>
            </div>
          )}

          {/* Configs table */}
          <div className="bg-white dark:bg-[#1A1D2E] rounded-2xl border border-gray-200 dark:border-[#2D3148] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-[#2D3148]">
                    {["Xodim", "Bo'lim", "Turi", "Miqdor", "Q.ish×", "Soliq%", "INPS%", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2D3148]/60">
                  {loadingConfigs ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" /></td></tr>
                    ))
                  ) : configs.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-[13px] font-medium text-gray-400">{t('noData')}</td></tr>
                  ) : configs.map(cfg => (
                    <tr key={cfg.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{cfg.user_full_name}</div>
                        <div className="text-[11px] text-gray-400">{cfg.user_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500 dark:text-gray-400">{cfg.department_name || "Bo'limsiz"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                          ${cfg.salary_type === "hourly" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : cfg.salary_type === "daily" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
                          {salaryLabel[cfg.salary_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-black text-gray-800 dark:text-gray-100">{curr(cfg.amount)}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-amber-600 dark:text-amber-400">×{cfg.overtime_rate}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-orange-600 dark:text-orange-400">{cfg.tax_percent}%</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-rose-600 dark:text-rose-400">{cfg.inps_percent}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openConfigForm(cfg)} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDeleteConfig(cfg.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CALCULATE TAB ──────────────────────────────────────────────── */}
      {tab === "calculate" && (
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white dark:bg-[#1A1D2E] rounded-3xl border border-gray-200 dark:border-[#2D3148] shadow-xl overflow-hidden">
            <div className="p-8 space-y-7">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
                  <Calculator size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('calculateSalary')}</h2>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">{t('calculateSubtitle')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('calculationMonth')}</label>
                <input type="month" value={calcMonth} onChange={e => setCalcMonth(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-[#2D3148] rounded-2xl text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-center" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Maosh turlari", icon: BadgeDollarSign, info: "Soatlik, kunlik, oylik sozlamalar asosida" },
                  { label: "Davomat ma'lumoti", icon: Clock, info: "Ish soatlari va kechikishlar hisobga olinadi" },
                  { label: "Solig'lar avtomatik", icon: BadgePercent, info: "Daromad solig'i va INPS avtomatik chiqariladi" },
                  { label: "Q.ish hisoblash", icon: TrendingUp, info: "Qo'shimcha ish soatlari koeffitsiyent bilan" },
                ].map(({ label, icon: Icon, info }) => (
                  <div key={label} className="p-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-[#2D3148]">
                    <Icon size={18} className="text-indigo-500 mb-2" />
                    <div className="text-[12px] font-black text-gray-800 dark:text-gray-200">{label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{info}</div>
                  </div>
                ))}
              </div>

              {calcResult && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 ${calcResult.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30"}`}>
                  {calcResult.ok ? <CheckCircle2 size={20} className="mt-0.5" /> : <AlertTriangle size={20} className="mt-0.5" />}
                  <div>
                    <div className="text-[13px] font-bold">{calcResult.message}</div>
                    {calcResult.ok && calcResult.skipped! > 0 && (
                      <div className="text-[12px] mt-1 opacity-70">{calcResult.skipped} ta xodimda maosh sozlamasi yo'q — ular uchun avval sozlama kiriting.</div>
                    )}
                  </div>
                </div>
              )}

              <button onClick={handleCalculate} disabled={calculating}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[15px] font-black shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3">
                {calculating ? <Loader2 size={22} className="animate-spin" /> : <Calculator size={22} />}
                {calculating ? t('calculating') : `${calcMonth} uchun maosh hisoblash`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ──────────────────────────────────────────────── */}
      {tab === "analytics" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-[#2D3148] rounded-lg text-[13px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500" />
            <button onClick={fetchRecords} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[12px] font-bold">Ko'rish</button>
          </div>

          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Summary totals */}
              <div className="bg-white dark:bg-[#1A1D2E] rounded-2xl border border-gray-200 dark:border-[#2D3148] p-6 shadow-sm">
                <h3 className="text-[13px] font-black text-gray-500 uppercase tracking-wider mb-5">Oy umumiy ({filterMonth})</h3>
                <div className="space-y-4">
                  {[
                    { label: "Jami brutto maosh", val: curr(summary.total_gross), pct: null, color: "bg-indigo-500" },
                    { label: "Daromad solig'i", val: curr(summary.total_tax), pct: summary.total_gross ? Math.round(summary.total_tax / summary.total_gross * 100) : 0, color: "bg-orange-400" },
                    { label: "INPS", val: curr(summary.total_inps), pct: summary.total_gross ? Math.round(summary.total_inps / summary.total_gross * 100) : 0, color: "bg-rose-400" },
                    { label: "Jami chegirmalar", val: curr(summary.total_deductions), pct: summary.total_gross ? Math.round(summary.total_deductions / summary.total_gross * 100) : 0, color: "bg-red-500" },
                    { label: "Jami netto maosh", val: curr(summary.total_net), pct: summary.total_gross ? Math.round(summary.total_net / summary.total_gross * 100) : 0, color: "bg-emerald-500" },
                  ].map(({ label, val, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{val}{pct !== null ? <span className="text-gray-400 font-normal ml-1">({pct}%)</span> : null}</span>
                      </div>
                      {pct !== null && (
                        <div className="h-1.5 bg-gray-100 dark:bg-[#2D3148] rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-white dark:bg-[#1A1D2E] rounded-2xl border border-gray-200 dark:border-[#2D3148] p-6 shadow-sm">
                <h3 className="text-[13px] font-black text-gray-500 uppercase tracking-wider mb-5">Holat bo'yicha</h3>
                <div className="space-y-4">
                  {[
                    { label: "Qoralama", count: summary.draft_count, total: summary.total_employees, color: "bg-gray-400" },
                    { label: "Tasdiqlangan", count: summary.approved_count, total: summary.total_employees, color: "bg-blue-500" },
                    { label: "To'langan", count: summary.paid_count, total: summary.total_employees, color: "bg-emerald-500" },
                  ].map(({ label, count, total, color }) => {
                    const pct = total > 0 ? Math.round(count / total * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-gray-500 dark:text-gray-400">{label}</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{count} ta <span className="text-gray-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-[#2D3148] rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Department breakdown */}
                {summary.department_breakdown.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-[13px] font-black text-gray-500 uppercase tracking-wider mb-4">Bo'lim bo'yicha netto</h3>
                    <div className="space-y-3">
                      {summary.department_breakdown.map(d => {
                        const maxNet = Math.max(...summary.department_breakdown.map(x => x.total_net), 1);
                        const pct = Math.round(d.total_net / maxNet * 100);
                        return (
                          <div key={d.department}>
                            <div className="flex justify-between text-[12px] mb-1">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Building2 size={12} className="text-indigo-400" />{d.department}
                                <span className="text-gray-400">({d.count} x.)</span>
                              </span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{curr(d.total_net)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-[#2D3148] rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Export block */}
              <div className="lg:col-span-2 bg-white dark:bg-[#1A1D2E] rounded-2xl border border-gray-200 dark:border-[#2D3148] p-6 shadow-sm">
                <h3 className="text-[13px] font-black text-gray-500 uppercase tracking-wider mb-5">Hisobotni yuklab olish</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Excel (brauzer)", icon: <FileSpreadsheet size={16} />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40", fn: handleExportExcelFrontend },
                    { label: "Excel (server)", icon: <FileSpreadsheet size={16} />, cls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/40", fn: handleExportExcelBackend },
                    { label: "CSV (brauzer)", icon: <FileDown size={16} />, cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40", fn: handleExportCsv },
                    { label: "CSV (server)", icon: <FileDown size={16} />, cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/40", fn: handleExportCsvBackend },
                    { label: "Chop etish", icon: <Printer size={16} />, cls: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700", fn: handlePrint },
                  ].map(({ label, icon, cls, fn }) => (
                    <button key={label} onClick={fn}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-all hover:opacity-80 active:scale-95 ${cls}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Deductions Modal ──────────────────────────────────────────────── */}
      {dedModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4"
          onClick={e => { if (e.target === e.currentTarget) setDedModal(null); }}>
          <div className="bg-white dark:bg-[#1A1D2E] w-full max-w-[480px] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2D3148] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2D3148] bg-gray-50/50 dark:bg-white/[0.02]">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Chegirmalar</h3>
              <button onClick={() => setDedModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Gross salary reference */}
              {dedModal && (
                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-[12px]">
                  <span className="text-indigo-500 font-bold">Brutto maosh:</span>
                  <span className="font-black text-indigo-700 dark:text-indigo-300">{curr(dedModal.gross)}</span>
                </div>
              )}

              {/* Existing deductions */}
              {dedModal && dedModal.items.length === 0 ? (
                <div className="text-[12px] text-gray-400 text-center py-3 italic">Chegirma yo'q</div>
              ) : (
                <div className="space-y-2">
                  {dedModal?.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#0F1117] rounded-xl border border-gray-100 dark:border-[#2D3148]">
                      <div>
                        <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{item.name}</div>
                        <div className="text-[11px] text-gray-400">
                          {DEDUCTION_TYPES[item.deduction_type] || item.deduction_type}
                          {item.percent && <span className="ml-1.5 text-orange-500">({item.percent}%)</span>}
                        </div>
                        {item.note && <div className="text-[11px] text-gray-400 italic">{item.note}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-black text-red-600 dark:text-red-400">-{curr(item.amount)}</span>
                        <button onClick={() => handleDeleteDeduction(item.id)} className="text-gray-300 hover:text-red-500 transition-colors border-0 bg-transparent cursor-pointer p-0"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new deduction form */}
              <div className="border-t border-gray-100 dark:border-[#2D3148] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wide">Yangi chegirma</span>
                  {/* Toggle: fixed amount vs percent */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button onClick={() => setDedUsePercent(false)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!dedUsePercent ? "bg-white dark:bg-[#1A1D2E] text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      So'm
                    </button>
                    <button onClick={() => setDedUsePercent(true)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${dedUsePercent ? "bg-white dark:bg-[#1A1D2E] text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      Foiz %
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nomi *</label>
                    <input value={dedForm.name} onChange={e => setDedForm({ ...dedForm, name: e.target.value })}
                      placeholder="Kredit to'lovi, ustav fondi, jarima..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[12px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Turi</label>
                    <select value={dedForm.deduction_type} onChange={e => setDedForm({ ...dedForm, deduction_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[12px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                      {Object.entries(DEDUCTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    {dedUsePercent ? (
                      <>
                        <label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block flex items-center gap-1">
                          <BadgePercent size={10} /> Foiz (bruttoning %) *
                        </label>
                        <input type="number" step="0.5" min="0" max="100"
                          value={dedForm.percent} onChange={e => setDedForm({ ...dedForm, percent: e.target.value })}
                          placeholder="12"
                          className="w-full px-3 py-2 rounded-lg border border-orange-300 dark:border-orange-700/50 bg-orange-50 dark:bg-orange-900/10 text-[12px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-orange-500" />
                        {dedCalcAmount !== null && dedCalcAmount > 0 && (
                          <div className="text-[11px] text-orange-600 dark:text-orange-400 font-bold mt-1">
                            = {curr(dedCalcAmount)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Miqdor (so'm) *</label>
                        <input type="number" min="0"
                          value={dedForm.amount} onChange={e => setDedForm({ ...dedForm, amount: e.target.value })}
                          placeholder="500000"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[12px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500" />
                      </>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Eslatma (ixtiyoriy)</label>
                    <input value={dedForm.note} onChange={e => setDedForm({ ...dedForm, note: e.target.value })}
                      placeholder="Noyabr oyi kredi to'lovi..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[12px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                {/* Preview */}
                {((!dedUsePercent && dedForm.amount) || (dedUsePercent && dedCalcAmount)) && dedModal && (
                  <div className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 text-[12px]">
                    <span className="text-gray-500">Netto (keyin):</span>
                    <span className="font-black text-red-600 dark:text-red-400">
                      {curr(Math.max(0, Number(dedModal.gross) - (dedUsePercent ? (dedCalcAmount || 0) : Number(dedForm.amount))))}
                    </span>
                  </div>
                )}

                <button onClick={handleAddDeduction} disabled={savingDed || !dedForm.name || (!dedUsePercent && !dedForm.amount) || (dedUsePercent && !dedForm.percent)}
                  className="w-full py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                  {savingDed ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                  Chegirma qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-medium max-w-sm
          ${toast.ok ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white border-0 bg-transparent cursor-pointer p-0"><X size={13} /></button>
        </div>
      )}
    </div>
  );
}
