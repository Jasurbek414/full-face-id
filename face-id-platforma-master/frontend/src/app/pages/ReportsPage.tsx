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
import { Download, FileText, Table2, FileSpreadsheet, Calendar, ChevronDown, Play } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { reportsAPI } from "../api/reports";
import { formatDuration } from "../utils/time";

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
  bg: "#F5F7FA",
};

const REPORT_TYPES = [
  { value: "attendance_summary", label: "Attendance Summary" },
  { value: "late_arrivals", label: "Late Arrivals Report" },
  { value: "absence_report", label: "Absence Report" },
  { value: "hours_worked", label: "Hours Worked Report" },
  { value: "department_summary", label: "Department Summary" },
];

const monthlyTrend = [
  { month: "Oct", rate: 94.2 },
  { month: "Nov", rate: 96.1 },
  { month: "Dec", rate: 91.5 },
  { month: "Jan", rate: 95.8 },
  { month: "Feb", rate: 97.2 },
  { month: "Mar", rate: 96.5 },
];

export function ReportsPage() {
  const [reportType, setReportType] = useState("attendance_summary");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-03");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
        // for monthly it expects format YYYY-MM
        const month = dateFrom.substring(0, 7);
        res = await reportsAPI.monthly({ month });
      } else {
        res = await reportsAPI.daily({ date: dateFrom });
      }
      setReportData(res.data);
      setGenerated(true);
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Failed to generate report");
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

      // Native browser download
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      window.open(baseUrl + url, '_blank');
      showToast("Report exported as " + format + " successfully!");
    } catch (err) {
      showToast("Export failed");
    }
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            backgroundColor: "#111827",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 1000,
            animation: "slideUp 0.3s ease",
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Reports</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Generate and export attendance reports</p>
        </div>
        {generated && (
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "PDF", icon: <FileText size={14} />, color: "#D50000" },
              { label: "Excel", icon: <FileSpreadsheet size={14} />, color: "#2E7D32" },
              { label: "CSV", icon: <Table2 size={14} />, color: BRAND.teal },
            ].map(({ label, icon, color }) => (
              <button
                key={label}
                onClick={() => handleExport(label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: `1.5px solid ${color}30`,
                  backgroundColor: `${color}08`,
                  color,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Config Panel */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Report Configuration</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          {/* Report type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Report Type</label>
            <div style={{ position: "relative" }}>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #E5E7EB",
                  backgroundColor: "#fff",
                  fontSize: 13,
                  color: "#374151",
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                {REPORT_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>From</label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #E5E7EB",
                  fontSize: 13,
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Date to */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1.5px solid #E5E7EB",
                fontSize: 13,
                color: "#374151",
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: generating ? "#9CA3AF" : BRAND.primary,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: generating ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Play size={14} />
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {generated && (
        <>
          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: "20px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                gridColumn: "1 / -1"
              }}
            >
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Data Analytics (Not enabled for this specific report)</h4>
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
                Graphs are only available in the dashboard views.
              </div>
            </div>


          </div>

          {/* Summary stats */}
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
            const summaryItems = [
              { label: "Total Employees", value: String(totalEmployees), icon: "👥" },
              { label: "Avg Attendance", value: avgRate, icon: "📊" },
              { label: "Total Hours", value: totalHours + "h", icon: "⏱" },
              { label: "Late Arrivals", value: String(lateCount), icon: "⚠️" },
              { label: "Absences", value: String(absentCount), icon: "🚫" },
            ];
            return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            {summaryItems.map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  padding: "14px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{value}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
            );
          })()}

          {/* Preview Table */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8EAF0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Report Preview</h3>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {REPORT_TYPES.find(r => r.value === reportType)?.label} · {dateFrom} to {dateTo}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["PDF", "Excel", "CSV"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 14px",
                      borderRadius: 7,
                      border: "1.5px solid #E8EAF0",
                      backgroundColor: "#fff",
                      color: "#374151",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Download size={12} />
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  {(reportType === "monthly" || reportType === "department_summary") ? (
                    <tr style={{ backgroundColor: BRAND.bg }}>
                      {["Employee", "Department", "Month", "Present Days", "Late Days", "Absent Days", "Total Hours", "Overtime", "Rate %"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  ) : (
                    <tr style={{ backgroundColor: BRAND.bg }}>
                      {["Employee", "Department", "Date", "Check-in", "Check-out", "Duration (h)", "Status"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: i % 2 === 0 ? "#fff" : BRAND.bg }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#111827" }}>{r.user_name}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280" }}>{typeof r.department === 'object' ? r.department?.name : r.department || "—"}</td>

                      {(reportType === "monthly" || reportType === "department_summary") ? (
                        <>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.month}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.present_days}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.late_days}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.absent_days}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.total_hours}h</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.overtime_hours}h</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151", fontWeight: 600 }}>{r.attendance_rate}%</td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.date}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{r.net_hours}h</td>
                          <td style={{ padding: "10px 16px" }}><StatusBadge status={r.status} size="sm" /></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportData.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13 }}>
                No records found for this period.
              </div>
            )}
          </div>
        </>
      )}

      {!generated && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: "64px 20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>No report generated yet</h3>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Configure your report settings above and click "Generate" to preview results.</p>
        </div>
      )}

      <style>{"@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }"}</style>
    </div>
  );
}
