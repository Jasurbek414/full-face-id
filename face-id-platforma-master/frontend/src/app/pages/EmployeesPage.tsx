import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Users, Search, UserPlus, ArrowRight, Clock, X,
  Loader2, Upload, Plus, Building2, ChevronDown, Check,
} from "lucide-react";
import { UserAvatar } from "../components/UserAvatar";
import { StatusBadge } from "../components/StatusBadge";
import { apiClient } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

interface Employee {
  id: string; first_name: string; last_name: string;
  phone: string; photo: string | null; photo_url: string | null;
  department: { id: string; name: string } | null;
  system_role: { id: string; name: string } | null;
  today_status: string; is_active: boolean;
}
interface Department { id: string; name: string; }

const STATUS_CLS: Record<string, string> = {
  on_time:     "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  late:        "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  early_leave: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  absent:      "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

export function EmployeesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [deptFilter, setDeptFilter]   = useState("");

  // Add employee modal
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "",
    password: "", department_id: "", photo: "",
  });

  // Inline create-department state
  const [showNewDept, setShowNewDept]     = useState(false);
  const [newDeptName, setNewDeptName]     = useState("");
  const [creatingDept, setCreatingDept]   = useState(false);

  // Toast
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchDepts = useCallback(async () => {
    try {
      const r = await apiClient.get("/api/v1/companies/departments/");
      setDepartments(r.data.results ?? r.data ?? []);
    } catch { /* silently */ }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      const r = await apiClient.get("/api/v1/employees/", { params });
      let list: Employee[] = r.data.results ?? r.data ?? [];
      if (deptFilter) {
        list = list.filter(e => e.department?.id === deptFilter);
      }
      setEmployees(list);
    } catch {
      showToast(t('errorOccurred'), false);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, showToast, t]);

  useEffect(() => {
    fetchDepts();
  }, [fetchDepts]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(), 350);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.phone || !form.password) {
      showToast(t('fillAllFields'), false);
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        password: form.password,
      };
      if (form.department_id) payload.department_id = form.department_id;
      if (form.photo) payload.photo = form.photo;
      await apiClient.post("/api/v1/employees/", payload);
      showToast(t('employeeAdded'));
      setShowModal(false);
      setForm({ first_name: "", last_name: "", phone: "", password: "", department_id: "", photo: "" });
      fetchEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.response?.data?.phone?.[0] || t('errorOccurred'), false);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setCreatingDept(true);
    try {
      const r = await apiClient.post("/api/v1/companies/departments/", { name: newDeptName.trim() });
      const created: Department = r.data;
      setDepartments(prev => [...prev, created]);
      setForm(prev => ({ ...prev, department_id: created.id }));
      setNewDeptName("");
      setShowNewDept(false);
      showToast(t('departmentCreated'));
    } catch {
      showToast(t('errorOccurred'), false);
    } finally {
      setCreatingDept(false);
    }
  };

  const statusLabel: Record<string, string> = {
    on_time: t('onTime'), late: t('late'), early_leave: t('earlyLeave'), absent: t('didntCome'),
  };

  return (
    <div className="font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 m-0">{t('employees')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            {loading ? t('loading') : `${employees.length} ${t('totalCount')}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors"
        >
          <UserPlus size={15} />
          {t('addEmployee')}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-[#2D3148] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="border-none outline-none text-[13px] text-gray-800 dark:text-gray-200 bg-transparent w-full placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#1A1D2E] text-[13px] text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
        >
          <option value="">{t('allDepartments')}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-[#1A1D2E] rounded-xl border border-gray-200 dark:border-[#2D3148] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-[#2D3148]">
                {[t('employee'), `${t('role')} & ${t('department')}`, t('todayStatus'), t('checkIn'), ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-400" />
                  <span className="text-[13px] text-gray-400">{t('loading')}</span>
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <Users size={36} className="opacity-20 mx-auto mb-3 text-gray-400" />
                  <div className="text-[14px] font-medium text-gray-500 dark:text-gray-500">{t('noData')}</div>
                </td></tr>
              ) : employees.map((emp, i) => (
                <tr key={emp.id}
                  className={`border-b border-gray-100 dark:border-[#2D3148]/60 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10
                    ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-white/[0.01]"}`}>

                  {/* Employee */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={emp.photo_url || emp.photo || ""} name={`${emp.first_name} ${emp.last_name}`} size={36} />
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500">{emp.phone}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Dept */}
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      {typeof emp.system_role === "object" ? emp.system_role?.name : emp.system_role || "—"}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {emp.department ? (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          <Building2 size={10} />
                          {emp.department.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">{t('noDepartment')}</span>
                      )}
                    </div>
                  </td>

                  {/* Today status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CLS[emp.today_status] ?? STATUS_CLS.absent}`}>
                      {statusLabel[emp.today_status] ?? emp.today_status}
                    </span>
                  </td>

                  {/* Check-in time */}
                  <td className="px-4 py-3">
                    {emp.today_status !== "absent" ? (
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                        <Clock size={12} className="opacity-60" />
                        {t('today')}
                      </div>
                    ) : (
                      <span className="text-[12px] text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/app/employees/${emp.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2D3148] hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-transparent text-indigo-600 dark:text-indigo-400 text-[12px] font-semibold transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      {t('profile')}
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Employee Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white dark:bg-[#1A1D2E] w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2D3148]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2D3148] bg-gray-50/50 dark:bg-white/[0.02]">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
                {t('addNewEmployee')}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: `${t('firstName')} *`, key: "first_name", ph: "Ali" },
                  { label: `${t('lastName')} *`,  key: "last_name",  ph: "Valiyev" },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
                    <input
                      required
                      value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={ph}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('phone')} *</label>
                <input
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998901234567"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('password')} *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Department */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('department')}</label>
                  <button
                    type="button"
                    onClick={() => setShowNewDept(v => !v)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 border-0 bg-transparent cursor-pointer p-0"
                  >
                    <Plus size={11} />
                    {t('addDepartment')}
                  </button>
                </div>

                {/* Inline create dept */}
                {showNewDept && (
                  <div className="flex gap-2 mb-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                    <input
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateDept(); } }}
                      placeholder={t('departmentName')}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={!newDeptName.trim() || creatingDept}
                      onClick={handleCreateDept}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[12px] font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      {creatingDept ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      {t('createDepartment')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewDept(false); setNewDeptName(""); }}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#2D3148] text-gray-500 text-[12px] hover:bg-gray-50 dark:hover:bg-white/5 border-0 bg-transparent cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <select
                  value={form.department_id}
                  onChange={e => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-white dark:bg-[#0F1117] text-[13px] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">{t('noDepartment')}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('photoOptional')}</label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-[#2D3148] rounded-xl p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setForm({ ...form, photo: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {form.photo ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={form.photo} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500" />
                      <span className="text-[11px] text-indigo-500 font-semibold">{t('refresh')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={22} className="text-gray-300 dark:text-gray-600" />
                      <span className="text-[12px] text-gray-400 dark:text-gray-600">{t('photoOptional')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[#2D3148] bg-transparent text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-800 dark:bg-indigo-700 text-white text-[13px] font-semibold disabled:opacity-60 hover:bg-indigo-900 dark:hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {saving ? t('saving') : t('add')}
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
          {toast.ok ? <Check size={15} /> : <X size={15} />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white border-0 bg-transparent cursor-pointer p-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
