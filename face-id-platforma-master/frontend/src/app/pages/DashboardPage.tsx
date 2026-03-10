import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Clock, UserX, Timer, Scan, ArrowUpRight, ArrowDownRight, BarChart3, Activity, Camera, ChevronRight } from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";
import { useWeeklySummary } from "../hooks/useReports";
import { formatTime } from "../utils/time";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const METHOD_LABEL: Record<string, string> = {
  face_id: "Face ID", pin: "PIN", manual: "Manual", qr: "QR",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [liveCheckins, setLiveCheckins] = useState<any[]>([]);
  const { data: weeklyData } = useWeeklySummary();

  useEffect(() => {
    apiClient.get("/api/v1/companies/list/stats/")
      .then(r => setStats(r.data))
      .catch(() => {});
    const today = new Date().toISOString().slice(0, 10);
    apiClient.get(`/api/v1/attendance/?date_from=${today}&date_to=${today}`)
      .then(r => setLiveCheckins((r.data.results || r.data || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  const kpiCards = [
    {
      icon: <Users size={20} />, value: stats?.present_today ?? "—",
      label: t('presentToday'), trend: 3.2, trendLabel: t('vsYesterday'),
      iconClass: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
      valueClass: "text-indigo-700 dark:text-indigo-300",
    },
    {
      icon: <Clock size={20} />, value: stats?.late_today ?? "—",
      label: t('lateArrivals'), trend: -8.5, trendLabel: t('vsYesterday'),
      iconClass: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300",
      valueClass: "text-orange-600 dark:text-orange-300",
    },
    {
      icon: <UserX size={20} />, value: stats?.absent_today ?? "—",
      label: t('absent'), trend: -1, trendLabel: t('vsYesterday'),
      iconClass: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300",
      valueClass: "text-red-600 dark:text-red-300",
    },
    {
      icon: <Timer size={20} />, value: stats?.total_hours != null ? `${stats.total_hours}h` : "—",
      label: t('totalHours'), trend: 2.1, trendLabel: t('thisWeek'),
      iconClass: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
      valueClass: "text-teal-700 dark:text-teal-300",
    },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? "#1A1D2E" : "#fff",
    border: `1px solid ${isDark ? "#2D3148" : "#E8EAF0"}`,
    borderRadius: 8,
    fontSize: 12,
    color: isDark ? "#F1F5F9" : "#111827",
  };

  const quickActions = [
    { label: t('runReport'),       icon: <BarChart3 size={17} />, to: "/app/reports",    iconCls: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",  labelCls: "text-indigo-700 dark:text-indigo-300" },
    { label: t('viewMonitoring'),  icon: <Activity  size={17} />, to: "/app/monitoring", iconCls: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",         labelCls: "text-teal-700 dark:text-teal-300" },
    { label: t('manageCameras'),   icon: <Camera    size={17} />, to: "/app/cameras",    iconCls: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300", labelCls: "text-purple-700 dark:text-purple-300" },
    { label: t('employeeProfiles'),icon: <Users     size={17} />, to: "/app/employees",  iconCls: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300", labelCls: "text-orange-600 dark:text-orange-300" },
  ];

  return (
    <div className="font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 m-0">
            {t('dashboard')}
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            {t('systemOverview')}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/attendance")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors"
        >
          <Clock size={15} />
          {t('viewAttendance')}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map(({ icon, value, label, trend, trendLabel, iconClass, valueClass }) => (
          <div key={label} className="bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border border-gray-200 dark:border-[#2D3148] shadow-sm">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
                {icon}
              </div>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(trend)}%
              </span>
            </div>
            <div className={`text-3xl font-bold mt-3 ${valueClass}`}>{value}</div>
            <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{trendLabel}</div>
          </div>
        ))}
      </div>

      {/* ── Chart + Live Feed ── */}
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1fr 360px" }}>
        {/* Weekly Chart */}
        <div className="bg-white dark:bg-[#1A1D2E] rounded-xl p-6 border border-gray-200 dark:border-[#2D3148] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 m-0">
                {t('weeklyAttendance')}
              </h3>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">{t('last7Days')}</p>
            </div>
            <div className="flex gap-4 text-[12px]">
              {[
                { color: "bg-indigo-600 dark:bg-indigo-500", label: t('present') },
                { color: "bg-orange-500",                    label: t('late') },
                { color: "bg-red-600 dark:bg-red-500",      label: t('absent') },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${color} opacity-80`} />
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barCategoryGap="32%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2D3148" : "#F3F4F6"} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDark ? "#64748B" : "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#64748B" : "#9CA3AF" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? "#ffffff08" : "#F5F7FA" }} />
              <Bar dataKey="present" name={t('present')} fill={isDark ? "rgba(99,102,241,0.75)" : "rgba(26,35,126,0.7)"} radius={[4, 4, 0, 0]} />
              <Bar dataKey="late"    name={t('late')}    fill="rgba(255,109,0,0.75)"                                       radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent"  name={t('absent')}  fill={isDark ? "rgba(239,68,68,0.7)"  : "rgba(213,0,0,0.6)"}     radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live Feed */}
        <div className="bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border border-gray-200 dark:border-[#2D3148] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 m-0">
                {t('liveCheckins')}
              </h3>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">{t('realtimeFeed')}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-green-500 font-bold">LIVE</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 flex-1">
            {liveCheckins.length === 0 ? (
              <div className="text-[13px] text-gray-400 dark:text-gray-500 text-center py-8">
                {t('noCheckins')}
              </div>
            ) : liveCheckins.map((item, i) => (
              <div key={item.id}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors
                  ${i % 2 === 0 ? "bg-transparent" : "bg-gray-50 dark:bg-white/[0.03]"}
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
              >
                <UserAvatar src={item.user_photo || ""} name={item.user_name} size={32} status={item.check_in && !item.check_out ? "inside" : "outside"} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.user_name}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500">
                    {METHOD_LABEL[item.check_in_method] || item.check_in_method}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                    {item.check_in ? formatTime(item.check_in) : "—"}
                  </div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${
                    item.status === "on_time"    ? "text-emerald-600 dark:text-emerald-400" :
                    item.status === "late"       ? "text-orange-500" :
                    item.status === "absent"     ? "text-red-500" :
                    item.status === "early_leave"? "text-yellow-500" : "text-gray-400"
                  }`}>
                    {item.status === "on_time"     ? t('onTime') :
                     item.status === "late"        ? t('late') :
                     item.status === "absent"      ? t('absent') :
                     item.status === "early_leave" ? t('earlyLeave') : item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/app/attendance")}
            className="mt-3 w-full py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-transparent text-indigo-700 dark:text-indigo-400 text-[12px] font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {t('viewAllRecords')}
          </button>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* By Department */}
        <div className="bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border border-gray-200 dark:border-[#2D3148] shadow-sm">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('byDepartment')}
          </h3>
          {(stats?.department_breakdown || []).length === 0 ? (
            <div className="text-[13px] text-gray-400 dark:text-gray-500 text-center py-4">{t('noData')}</div>
          ) : (stats?.department_breakdown || []).map((item: any, idx: number) => {
            const present = item.present || 0;
            const total   = item.total   || 1;
            const dept    = item.department_name || item.dept || "—";
            const pct     = Math.round((present / total) * 100);
            const palette = ["bg-indigo-600", "bg-teal-600", "bg-purple-600", "bg-orange-500", "bg-emerald-600"];
            return (
              <div key={dept} className="mb-3">
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{dept}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{present}/{total}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-[#2D3148] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${palette[idx % palette.length]} opacity-80 transition-all`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Check-in Methods */}
        <div className="bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border border-gray-200 dark:border-[#2D3148] shadow-sm">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('checkinMethods')}
          </h3>
          {(stats?.checkin_methods || []).length === 0 ? (
            <div className="text-[13px] text-gray-400 dark:text-gray-500 text-center py-4">{t('noData')}</div>
          ) : (stats?.checkin_methods || []).map((item: any, idx: number) => {
            const methodName = item.method || item.name || "—";
            const count = item.count || 0;
            const pct   = item.pct || item.percentage || 0;
            const paletteBg   = ["bg-indigo-100 dark:bg-indigo-900/40", "bg-teal-100 dark:bg-teal-900/40", "bg-gray-100 dark:bg-gray-700"];
            const paletteText = ["text-indigo-700 dark:text-indigo-300", "text-teal-700 dark:text-teal-300", "text-gray-600 dark:text-gray-400"];
            const paletteBar  = ["bg-indigo-600", "bg-teal-600", "bg-gray-400"];
            return (
              <div key={methodName} className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${paletteBg[idx % 3]} ${paletteText[idx % 3]}`}>
                  {methodName === "Face ID" ? <Scan size={16} /> : <span>{methodName.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{methodName}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-[#2D3148] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${paletteBar[idx % 3]} opacity-75`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border border-gray-200 dark:border-[#2D3148] shadow-sm">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('quickActions')}
          </h3>
          {quickActions.map(({ label, icon, to, iconCls, labelCls }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-transparent mb-2 cursor-pointer text-left hover:bg-gray-50 dark:hover:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
                {icon}
              </div>
              <span className={`text-[13px] font-medium flex-1 ${labelCls}`}>{label}</span>
              <ChevronRight size={14} className="text-gray-400 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
