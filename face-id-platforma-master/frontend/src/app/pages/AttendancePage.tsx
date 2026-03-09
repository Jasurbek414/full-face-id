import React, { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, MoreHorizontal, Download, Scan, Hash, PenLine, ChevronUp, LogOut, Clock } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";
import { useAttendanceList } from "../hooks/useAttendance";
import { formatTime, formatDate, formatDuration } from "../utils/time";
import { useEmployees } from "../hooks/useEmployees";

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
  bg: "#F5F7FA",
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  "Face ID": <Scan size={13} color="#3949AB" />,
  PIN: <Hash size={13} color="#00897B" />,
  Manual: <PenLine size={13} color="#9CA3AF" />,
};

const COLUMNS = ["Employee", "Date", "Check-in", "Check-out", "Duration", "Status", "Method", "Actions"];

export function AttendancePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<string>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [actionOpen, setActionOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [toast, setToast] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const { list: listEmployees } = useEmployees();

  const [userFilter, setUserFilter] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    user: "",
    date: new Date().toISOString().split("T")[0],
    check_in: "",
    check_out: "",
    check_in_method: "manual" // "manual" | "pin" | "qr"
  });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    loadEmployees();
    apiClient.get("/api/v1/companies/departments/")
      .then(res => setDepartmentsList(res.data.results || res.data || []))
      .catch(console.error);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async () => {
    try {
      const resp = await apiClient.get<Blob>("/api/v1/attendance/?export_format=csv", { responseType: "blob" });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast("Export failed!");
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await listEmployees();
      setEmployeesList(res.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/api/v1/attendance/", formData);
      setIsAddModalOpen(false);
      showToast("Record qo'shildi!");
      window.location.reload();
    } catch (err: any) {
      alert("Xato: " + (err.response?.data?.detail || "Kiritishda xatolik"));
    } finally {
      setSubmitting(false);
    }
  };

  const filters = {
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    method: methodFilter === "all" ? undefined : methodFilter,
    user_id: userFilter || undefined,
    department: deptFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page
  };

  const { data: apiData, total, loading } = useAttendanceList(filters);

  const displayData = useMemo(() => {
    if (!apiData || apiData.length === 0) return [];
    return apiData.map((r: any) => ({
      id: r.id,
      employeeName: r.user_name,
      employeeAvatar: r.user_photo || "",
      department: typeof r.department === 'object' ? r.department?.name : r.department || r.department_name || "General",
      date: r.date,
      checkIn: r.check_in ? formatTime(r.check_in) : "",
      checkOut: r.check_out ? formatTime(r.check_out) : null,
      duration: r.net_seconds ? formatDuration(r.net_seconds) : "—",
      status: r.status as any,
      method: r.check_in_method || "Manual"
    }));
  }, [apiData, loading]);

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === displayData.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(displayData.map((r) => r.id)));
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const totalPages = Math.ceil((total || displayData.length) / perPage);
  const paginated = displayData; // Backend logic handles pagination usually, but for mock fallback we might slice.
  // In our hook, data is already paginated results if total is present.

  const SortIcon = ({ col }: { col: string }) =>
    sortCol === col ? (
      sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    ) : (
      <ChevronDown size={12} style={{ opacity: 0.3 }} />
    );

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Attendance Log</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {total || displayData.length} records found
            {selectedRows.size > 0 && ` · ${selectedRows.size} selected`}
            {loading && " · Loading..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              apiClient.post("/api/v1/attendance/check-in/", { method: "manual" })
                .then(() => {
                  showToast("Check-in muvaffaqiyatli!");
                  setTimeout(() => window.location.reload(), 1000);
                })
                .catch((err: any) => {
                  const d = err.response?.data;
                  showToast(d?.detail || d?.message || d?.non_field_errors?.[0] || "Check-in xatoligi");
                });
            }}
            style={{
              padding: "9px 18px",
              backgroundColor: BRAND.teal,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Clock size={15} />
            Check-in
          </button>
          <button
            onClick={() => {
              apiClient.post("/api/v1/attendance/check-out/", { method: "manual" })
                .then(() => {
                  showToast("Check-out muvaffaqiyatli!");
                  setTimeout(() => window.location.reload(), 1000);
                })
                .catch((err: any) => {
                  const d = err.response?.data;
                  showToast(d?.detail || d?.message || d?.non_field_errors?.[0] || "Check-out xatoligi");
                });
            }}
            style={{
              padding: "9px 18px",
              backgroundColor: "#B71C1C",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <LogOut size={15} />
            Check-out
          </button>
          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px solid #E8EAF0",
              backgroundColor: "#fff",
              color: "#374151",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => { loadEmployees(); setIsAddModalOpen(true); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              backgroundColor: BRAND.primary,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Record
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#fff",
            border: "1.5px solid #E8EAF0",
            borderRadius: 8,
            padding: "8px 14px",
            flex: 1,
            minWidth: 200,
            maxWidth: 360,
          }}
        >
          <Search size={15} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, department..."
            style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", width: "100%", backgroundColor: "transparent" }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1.5px solid #E8EAF0",
            backgroundColor: "#fff",
            fontSize: 13,
            color: "#374151",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="on_time">On Time</option>
          <option value="late">Late</option>
          <option value="early_leave">Early Leave</option>
          <option value="absent">Absent</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1.5px solid #E8EAF0",
            backgroundColor: "#fff",
            fontSize: 13,
            color: "#374151",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Methods</option>
          <option value="Face ID">Face ID</option>
          <option value="PIN">PIN</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #E8EAF0", backgroundColor: "#fff", fontSize: 13, color: "#374151", outline: "none", cursor: "pointer", flex: 1, minWidth: 150 }}
        >
          <option value="">Barcha xodimlar</option>
          {employeesList.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #E8EAF0", backgroundColor: "#fff", fontSize: 13, color: "#374151", outline: "none", cursor: "pointer", flex: 1, minWidth: 150 }}
        >
          <option value="">Barcha bo'limlar</option>
          {departmentsList.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#fff", border: "1.5px solid #E8EAF0", borderRadius: 8, padding: "4px 10px" }}>
          <label style={{ fontSize: 12, color: "#9CA3AF" }}>From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", cursor: "pointer" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#fff", border: "1.5px solid #E8EAF0", borderRadius: 8, padding: "4px 10px" }}>
          <label style={{ fontSize: 12, color: "#9CA3AF" }}>To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", cursor: "pointer" }} />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: BRAND.bg, borderBottom: "1px solid #E8EAF0" }}>
                <th style={{ padding: "12px 16px", width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === displayData.length && displayData.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: "pointer", accentColor: BRAND.primary }}
                  />
                </th>
                {[
                  { label: "Employee", col: "employee" },
                  { label: "Date", col: "date" },
                  { label: "Check-in" },
                  { label: "Check-out" },
                  { label: "Duration" },
                  { label: "Status", col: "status" },
                  { label: "Method" },
                  { label: "Actions" },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={col ? () => handleSort(col) : undefined}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6B7280",
                      whiteSpace: "nowrap",
                      cursor: col ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {label}
                      {col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((record, i) => (
                <tr
                  key={record.id}
                  style={{
                    backgroundColor: selectedRows.has(record.id) ? "#EEF0FB" : i % 2 === 0 ? "#fff" : BRAND.bg,
                    borderBottom: "1px solid #F3F4F6",
                    transition: "background 0.1s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedRows.has(record.id)) e.currentTarget.style.backgroundColor = "#F0F4FF";
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedRows.has(record.id)) e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#fff" : BRAND.bg;
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={() => toggleRow(record.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", accentColor: BRAND.primary }}
                    />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <UserAvatar src={record.employeeAvatar} name={record.employeeName} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{record.employeeName}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{record.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
                    {formatDate(record.date)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: record.checkIn ? "#111827" : "#D1D5DB" }}>
                    {record.checkIn || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: record.checkOut ? "#111827" : "#D1D5DB" }}>
                    {record.checkOut || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{record.duration}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={record.status} size="sm" />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {METHOD_ICON[record.method]}
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{record.method}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", position: "relative" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionOpen(actionOpen === record.id ? null : record.id); }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid #E8EAF0",
                        backgroundColor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <MoreHorizontal size={14} color="#6B7280" />
                    </button>
                    {actionOpen === record.id && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          backgroundColor: "#fff",
                          border: "1px solid #E8EAF0",
                          borderRadius: 8,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                          zIndex: 50,
                          minWidth: 160,
                          overflow: "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {["Tahrirlash", "O'chirish", "Batafsil"].map((action) => (
                          <button
                            key={action}
                            onClick={() => {
                              setActionOpen(null);
                              if (action === "Batafsil") {
                                window.location.href = `/app/attendance/${record.id}`;
                              } else if (action === "O'chirish") {
                                if (window.confirm("Rozimisiz?")) {
                                  apiClient.delete(`/api/v1/attendance/${record.id}/`)
                                    .then(() => { showToast("O'chirildi"); window.location.reload(); })
                                    .catch(() => alert("Xato"));
                                }
                              } else {
                                alert("Hali ishga tushirilmadi");
                              }
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "9px 14px",
                              textAlign: "left",
                              border: "none",
                              backgroundColor: "transparent",
                              fontSize: 13,
                              color: action === "O'chirish" ? "#D50000" : "#374151",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.bg)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderTop: "1px solid #E8EAF0",
          }}
        >
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total || displayData.length)} of {total || displayData.length} records
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #E8EAF0",
                backgroundColor: "#fff",
                fontSize: 12,
                color: page === 1 ? "#D1D5DB" : "#374151",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: p === page ? BRAND.primary : "#E8EAF0",
                  backgroundColor: p === page ? BRAND.primary : "#fff",
                  color: p === page ? "#fff" : "#374151",
                  fontSize: 12,
                  fontWeight: p === page ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #E8EAF0",
                backgroundColor: "#fff",
                fontSize: 12,
                color: page === totalPages ? "#D1D5DB" : "#374151",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close action menu */}
      {actionOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setActionOpen(null)} />
      )}

      {/* Toast Notification */}
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
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* Add Record Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: 18, color: "#111827" }}>Add Attendance Record</h2>
            <form onSubmit={submitAddRecord} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#374151" }}>Employee</label>
                <select
                  required
                  value={formData.user}
                  onChange={e => setFormData({ ...formData, user: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                >
                  <option value="" disabled>Select Employee</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#374151" }}>Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#374151" }}>Check-in</label>
                  <input
                    type="time"
                    value={formData.check_in}
                    onChange={e => setFormData({ ...formData, check_in: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#374151" }}>Check-out</label>
                  <input
                    type="time"
                    value={formData.check_out}
                    onChange={e => setFormData({ ...formData, check_out: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#374151" }}>Method</label>
                <select
                  value={formData.check_in_method}
                  onChange={e => setFormData({ ...formData, check_in_method: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                >
                  <option value="manual">Manual</option>
                  <option value="pin">PIN</option>
                  <option value="qr">QR Code</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", backgroundColor: BRAND.primary, color: "#fff", cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
