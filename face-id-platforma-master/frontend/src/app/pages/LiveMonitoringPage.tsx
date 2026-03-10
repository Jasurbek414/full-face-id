import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, RefreshCw, Users, UserCheck, UserX, MapPin, Clock, Wifi } from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";
import { useAttendanceWebSocket } from "../hooks/useWebSocket";
import { formatTime } from "../utils/time";
import { useLanguage } from "../context/LanguageContext";

type FilterType = "all" | "inside" | "outside";

interface TodayStats {
  total_employees: number;
  present: number;
  on_site: number;
  absent: number;
}

export function LiveMonitoringPage() {
  const navigate   = useNavigate();
  const { t }      = useLanguage();

  const [records, setRecords]       = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<FilterType>("all");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [spinning, setSpinning]     = useState(false);

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const [attRes, statsRes] = await Promise.all([
        apiClient.get(`/api/v1/attendance/?date_from=${today}&date_to=${today}`),
        apiClient.get("/api/v1/attendance/today-stats/"),
      ]);
      setRecords(attRes.data.results ?? attRes.data ?? []);
      setTodayStats(statsRes.data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useAttendanceWebSocket((msg) => {
    if (msg.type === "attendance.check_in" || msg.type === "attendance.check_out") {
      fetchData();
      setLastUpdate(new Date());
    }
  });

  const handleRefresh = async () => {
    setSpinning(true);
    await fetchData();
    setLastUpdate(new Date());
    setTimeout(() => setSpinning(false), 600);
  };

  // Map attendance records to employee cards
  const employees = records
    .filter(r => r.check_in) // only those who checked in
    .map((rec: any) => ({
      id:         rec.id,
      userId:     rec.user,
      name:       rec.user_name,
      department: rec.department_name ?? "—",
      avatar:     rec.user_photo || "",
      status:     (rec.check_in && !rec.check_out ? "inside" : "outside") as FilterType,
      checkIn:    rec.check_in  ? formatTime(rec.check_in)  : "",
      checkOut:   rec.check_out ? formatTime(rec.check_out) : null,
      attStatus:  rec.status,
    }));

  const filtered = employees.filter(emp =>
    (emp.name.toLowerCase().includes(search.toLowerCase()) ||
     emp.department.toLowerCase().includes(search.toLowerCase())) &&
    (filter === "all" || emp.status === filter)
  );

  // Stat counts from server stats (accurate)
  const totalEmployees = todayStats?.total_employees ?? employees.length;
  const insideCount    = todayStats?.on_site ?? employees.filter(e => e.status === "inside").length;
  const outsideCount   = todayStats != null ? (todayStats.present - todayStats.on_site) : employees.filter(e => e.status === "outside").length;
  const absentCount    = todayStats?.absent ?? 0;

  const statCards = [
    { label: t('totalEmployees'), value: totalEmployees, icon: <Users size={18} />,     cls: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" },
    { label: t('insideOffice'),   value: insideCount,    icon: <UserCheck size={18} />, cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
    { label: t('outsideAway'),    value: Math.max(0, outsideCount), icon: <Users size={18} />, cls: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
    { label: t('absentToday'),    value: absentCount,    icon: <UserX size={18} />,     cls: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  ];

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all",     label: t('allFilter') },
    { key: "inside",  label: t('insideFilter') },
    { key: "outside", label: t('outsideFilter') },
  ];

  const attStatusColors: Record<string, string> = {
    on_time:     "text-emerald-600 dark:text-emerald-400",
    late:        "text-orange-500",
    absent:      "text-red-500",
    early_leave: "text-yellow-500",
  };

  return (
    <div className="font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 m-0 flex items-center gap-2">
            {t('liveMonitoring')}
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            {t('realtimeTracking')} · {t('updatedAt')} {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#1A1D2E] text-gray-700 dark:text-gray-300 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
          {t('refresh')}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {statCards.map(({ label, value, icon, cls }) => (
          <div key={label} className="bg-white dark:bg-[#1A1D2E] rounded-xl px-4 py-3.5 border border-gray-200 dark:border-[#2D3148] shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
              <div className="text-[12px] text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-[#2D3148] rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchEmployees')}
            className="border-none outline-none text-[13px] text-gray-800 dark:text-gray-200 bg-transparent w-full placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

        <div className="flex gap-1 bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-[#2D3148] rounded-lg p-1">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer
                ${filter === key
                  ? "bg-indigo-800 dark:bg-indigo-700 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent border-0"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500">
          <Wifi size={13} className="text-green-500" />
          WebSocket
        </div>
      </div>

      {/* ── Employee Grid ── */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border border-gray-200 dark:border-[#2D3148] animate-pulse">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#2D3148]" />
                <div className="w-24 h-3 rounded bg-gray-200 dark:bg-[#2D3148]" />
                <div className="w-16 h-2.5 rounded bg-gray-100 dark:bg-[#2D3148]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          {employees.length === 0
            ? <><Clock size={44} className="opacity-30 mb-3" /><p className="text-[14px]">{t('noOneInOffice')}</p></>
            : <><Search size={44} className="opacity-30 mb-3" /><p className="text-[14px]">{t('noMatchSearch')}</p></>
          }
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {filtered.map(emp => (
            <div
              key={emp.id}
              onClick={() => navigate(`/app/employees/${emp.userId}`)}
              className={`relative bg-white dark:bg-[#1A1D2E] rounded-xl p-5 border shadow-sm cursor-pointer overflow-hidden
                transition-all hover:-translate-y-1 hover:shadow-md
                ${emp.status === "inside"
                  ? "border-emerald-200 dark:border-emerald-800/60"
                  : "border-gray-200 dark:border-[#2D3148]"
                }`}
            >
              {/* Status bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${emp.status === "inside" ? "bg-emerald-500" : "bg-blue-400"}`} />

              <div className="flex flex-col items-center text-center pt-1">
                <UserAvatar src={emp.avatar} name={emp.name} size={52} status={emp.status as any} />

                <div className="mt-2.5">
                  <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{emp.name}</div>
                  <div className={`text-[11px] mt-0.5 font-medium ${attStatusColors[emp.attStatus] ?? "text-gray-400 dark:text-gray-500"}`}>
                    {emp.attStatus === "on_time"     ? t('onTime') :
                     emp.attStatus === "late"        ? t('late') :
                     emp.attStatus === "early_leave" ? t('earlyLeave') : emp.attStatus}
                  </div>
                </div>

                <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                  ${emp.status === "inside"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "inside" ? "bg-emerald-500 animate-pulse" : "bg-blue-400"}`} />
                  {emp.status === "inside" ? t('insideFilter') : t('outsideFilter')}
                </span>

                <div className="mt-3 w-full border-t border-gray-100 dark:border-[#2D3148] pt-2.5 flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    {emp.checkIn || "—"}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={10} />
                    <span className="truncate max-w-[70px]">{emp.department}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
