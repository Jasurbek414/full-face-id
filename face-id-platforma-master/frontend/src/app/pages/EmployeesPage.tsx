import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, Search, Filter, UserPlus, ArrowRight, Clock, X, Loader2, Upload } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export function EmployeesPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();
    const { list } = useEmployees();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        first_name: '', last_name: '',
        phone: '', password: '',
        department: '', system_role: 'employee',
        photo: ''
    });

    const handleAddEmployee = async () => {
        if (!newEmployee.first_name || !newEmployee.last_name || !newEmployee.phone || !newEmployee.password) {
            alert(t('fillAllFields') || "Barcha maydonlarni to'ldiring");
            return;
        }
        setSaving(true);
        try {
            await apiClient.post('/api/v1/employees/', newEmployee);
            setShowAddModal(false);
            setNewEmployee({
                first_name: '', last_name: '',
                phone: '', password: '', department: '',
                system_role: 'employee', photo: ''
            });
            alert(t('employeeAdded'));
            fetchEmployees();
        } catch (err: any) {
            alert(err.response?.data?.detail || t('errorOccurred'));
        } finally {
            setSaving(false);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await list({ search: searchTerm });
            setEmployees(data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEmployees();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('employees')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor your team members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <UserPlus size={18} />
                    {t('addEmployee')}
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative flex-1 group">
                    <Search
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"
                    />
                    <input
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                    />
                </div>
                <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <Filter size={16} />
                    {t('filters')}
                </button>
            </div>

            {/* Employee Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                                {[t('employee'), t('role') + " & " + t('department'), t('todayStatus'), t('checkIn'), t('actions')].map((h) => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{t('loading')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500 dark:text-slate-400 italic">
                                        {t('noData')}
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => {
                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar src={emp.photo} name={`${emp.first_name} ${emp.last_name}`} size={42} />
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {emp.first_name} {emp.last_name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-500 truncate">{emp.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {typeof emp.system_role === 'object' ? emp.system_role?.name : emp.system_role || 'User'}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-500">
                                                    {typeof emp.department === 'object' ? emp.department?.name : emp.department || 'General'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={emp.today_status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {emp.today_status !== "absent" && emp.today_status !== "off" ? (
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        <Clock size={14} className="opacity-60" />
                                                        {emp.last_check_in || "—"}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/app/employees/${emp.id}`)}
                                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                                >
                                                    {t('profile')}
                                                    <ArrowRight size={14} />
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

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddModal(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-bottom border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{t('addNewEmployee')}</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-8 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase ml-1">{t('firstName')}</label>
                                    <input placeholder="Ali"
                                        value={newEmployee.first_name}
                                        onChange={e => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase ml-1">{t('lastName')}</label>
                                    <input placeholder="Valiyev"
                                        value={newEmployee.last_name}
                                        onChange={e => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase ml-1">{t('phone')}</label>
                                <input placeholder="998901234567"
                                    value={newEmployee.phone}
                                    onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase ml-1">{t('photoOptional')}</label>
                                <div className="relative group/photo cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:border-indigo-500 transition-colors text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setNewEmployee({ ...newEmployee, photo: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    {newEmployee.photo ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={newEmployee.photo} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" />
                                            <span className="text-xs text-indigo-500 font-bold">{t('refresh')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="text-slate-400 group-hover/photo:text-indigo-500 transition-colors" size={24} />
                                            <span className="text-xs text-slate-500 dark:text-slate-500">{t('photoOptional')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase ml-1">{t('password')}</label>
                                <input type="password" placeholder="••••••••"
                                    value={newEmployee.password}
                                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-top border-slate-100 dark:border-slate-700 flex gap-4">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleAddEmployee}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                {t('add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
