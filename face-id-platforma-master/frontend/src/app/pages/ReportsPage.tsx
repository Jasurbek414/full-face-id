import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Download, FileText, Table2, FileSpreadsheet, Calendar, ChevronDown, Play, LayoutDashboard, AlertCircle, FileBarChart } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { reportsAPI } from "../api/reports";
import { formatDuration } from "../utils/time";
import { useLanguage } from "../context/LanguageContext";

export function ReportsPage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState("attendance_summary");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-03");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const REPORT_TYPES = [
    { value: "attendance_summary", label: t("attendanceSummary") },
    { value: "late_arrivals", label: t("lateArrivalsReport") },
    { value: "absence_report", label: t("absenceReport") },
    { value: "hours_worked", label: t("hoursWorkedReport") },
    { value: "department_summary", label: t("departmentSummary") },
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [reportData, setReportData] = useState<any[]>([]);

  const handleGenerate = async () => {
    setGenerating(true);
    setToast(null);
    try {
      let res;
      if (reportType === "attendance_summary" || reportType === "daily") {
        res = await reportsAPI.daily({ date: dateFrom });
      } else if (reportType === "monthly" || reportType === "department_summary") {
        const month = dateFrom.substring(0, 7);
        res = await reportsAPI.monthly({ month });
      } else {
        res = await reportsAPI.daily({ date: dateFrom });
      }
      setReportData(res.data);
      setGenerated(true);
      showToast(t("reportGenerated"));
    } catch (err: any) {
      showToast(err?.response?.data?.error || t("errorOccurred"));
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const type = (reportType === "monthly" || reportType === "department_summary") ? "monthly" : "daily";
      let url = "/api/v1/reports/export/?type=" + type + "&export_format=" + format.toLowerCase();
      if (type === "monthly") {
        url += "&month=" + dateFrom.substring(0, 7);
      } else {
        url += "&date=" + dateFrom;
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      window.open(baseUrl + url, '_blank');
      showToast(t("reportExported"));
    } catch (err) {
      showToast(t("exportFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-6 transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-xs">✓</div>
          {toast}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
            {t("reports")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("reportsSubtitle")}
          </p>
        </div>

        {generated && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "PDF", icon: <FileText size={16} />, color: "text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30" },
              { label: "Excel", icon: <FileSpreadsheet size={16} />, color: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30" },
              { label: "CSV", icon: <Table2 size={16} />, color: "text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-900/30" },
            ].map(({ label, icon, color }) => (
              <button
                key={label}
                onClick={() => handleExport(label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${color}`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="text-indigo-500 dark:text-indigo-400" size={18} />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t("reportConfig")}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Report Type Selection */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
              {t("reportType")}
            </label>
            <div className="relative group">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {REPORT_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
              {t("dateFrom")}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
              {t("dateTo")}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] disabled:cursor-not-allowed group"
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="fill-current group-hover:scale-110 transition-transform" size={16} />
            )}
            {generating ? t("generating") : t("generate")}
          </button>
        </div>
      </div>

      {generated ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Analytics Header Section Placeholder */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-8">
              <FileBarChart className="text-indigo-500" size={18} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t("dataAnalytics")}
              </h3>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4 transition-colors">
                <LayoutDashboard className="text-slate-400" size={28} />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {t("noAnalytics")}
              </p>
              <p className="text-xs text-slate-400">
                Dashboard modules provide interactive visualizations and trends.
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {(() => {
              const isMonthly = reportType === "monthly" || reportType === "department_summary";
              const totalEmployees = reportData.length;
              const totalHours = isMonthly
                ? reportData.reduce((s: number, r: any) => s + (r.total_hours || 0), 0).toFixed(1)
                : reportData.reduce((s: number, r: any) => s + (r.net_hours || 0), 0).toFixed(1);
              const lateCount = isMonthly
                ? reportData.reduce((s: number, r: any) => s + (r.late_days || 0), 0)
                : reportData.filter((r: any) => r.status === 'late').length;
              const absentCount = isMonthly
                ? reportData.reduce((s: number, r: any) => s + (r.absent_days || 0), 0)
                : reportData.filter((r: any) => r.status === 'absent').length;
              const avgRate = isMonthly && totalEmployees > 0
                ? (reportData.reduce((s: number, r: any) => s + (r.attendance_rate || 0), 0) / totalEmployees).toFixed(1) + '%'
                : totalEmployees > 0
                ? (((totalEmployees - absentCount) / totalEmployees) * 100).toFixed(1) + '%'
                : '0%';

              const stats = [
                { label: t("totalEmployeesCount"), value: String(totalEmployees), icon: "👥", color: "text-blue-500 px-3 py-1 bg-blue-50 dark:bg-blue-900/10" },
                { label: t("avgAttendance"), value: avgRate, icon: "📊", color: "text-emerald-500 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/10" },
                { label: t("totalHours"), value: totalHours + "h", icon: "⏱", color: "text-amber-500 px-3 py-1 bg-amber-50 dark:bg-amber-900/10" },
                { label: t("lateArrivals"), value: String(lateCount), icon: "⚠️", color: "text-rose-500 px-3 py-1 bg-rose-50 dark:bg-rose-900/10" },
                { label: t("absences"), value: String(absentCount), icon: "🚫", color: "text-slate-500 px-3 py-1 bg-slate-100 dark:bg-slate-900/30" },
              ];

              return stats.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                    {stat.label}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Results Table Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30 dark:bg-slate-900/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("reportPreview")}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 uppercase tracking-wide font-medium">
                  {REPORT_TYPES.find(r => r.value === reportType)?.label} <span className="text-slate-200">|</span> {dateFrom} ➔ {dateTo}
                </p>
              </div>
              <div className="flex gap-2">
                {["PDF", "Excel", "CSV"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold transition-all shadow-sm active:scale-95"
                  >
                    <Download size={12} />
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto lg:overflow-visible">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  {(reportType === "monthly" || reportType === "department_summary") ? (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      {[t("employee"), t("department"), "Month", t("presentDays"), t("lateDays"), t("absentDays"), t("totalHours"), t("overtime"), t("rate")].map((h) => (
                        <th key={h} className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  ) : (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      {[t("employee"), t("department"), t("date"), t("checkIn"), t("checkOut"), t("duration"), t("status")].map((h) => (
                        <th key={h} className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{r.user_name}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {typeof r.department === 'object' ? r.department?.name : r.department || "—"}
                      </td>

                      {(reportType === "monthly" || reportType === "department_summary") ? (
                        <>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{r.month}</td>
                          <td className="px-6 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">{r.present_days}</td>
                          <td className="px-6 py-4 text-xs font-bold text-amber-500">{r.late_days}</td>
                          <td className="px-6 py-4 text-xs font-bold text-rose-500">{r.absent_days}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">{r.total_hours}h</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">{r.overtime_hours}h</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{r.attendance_rate}%</span>
                                <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                  <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${r.attendance_rate}%` }} 
                                  />
                                </div>
                             </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">{r.date}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                          <td className="px-6 py-4 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-2 rounded-lg text-center">{r.net_hours}h</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={r.status} size="sm" />
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 dark:bg-slate-900/10">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <AlertCircle className="text-slate-300" size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                    {t("noRecords")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-20 shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-all duration-300">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
             <LayoutDashboard className="text-indigo-500 dark:text-indigo-400 animate-pulse" size={48} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 transition-colors">
            No report generated yet
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Configure your report settings above and click "Generate" to preview results and export data.
          </p>
        </div>
      )}
    </div>
  );
}
