import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  UserCheck, UserX, Mail, Phone, Shield, ChevronDown, Search,
} from "lucide-react";
import { companyUsersAPI, rolesAPI } from "../api/devices";
import { UserAvatar } from "../components/UserAvatar";
import { useLanguage } from "../context/LanguageContext";

interface CompanyUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  photo: string | null;
  role: { id: string; name: string } | null;
  is_active: boolean;
  date_joined: string;
}

interface Role {
  id: string;
  name: string;
  is_system: boolean;
}

const ROLE_STYLES: Record<string, string> = {
  OWNER: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50",
  ADMIN: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50",
  MANAGER: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50",
  HR: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50",
  ACCOUNTANT: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800/50",
  EMPLOYEE: "bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800/50",
  GUARD: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50",
};

export function UsersPage() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<CompanyUser | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Create form
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    password: "", role_id: "",
  });

  // Edit role
  const [editRoleId, setEditRoleId] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [savedRole, setSavedRole] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        companyUsersAPI.list(),
        rolesAPI.list(),
      ]);
      setUsers(usersRes.data.results || []);
      setRoles(rolesRes.data.results || rolesRes.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").includes(q)
    );
  });

  const openCreate = () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "", password: "", role_id: "" });
    setFormError("");
    setShowModal(true);
    setEditUser(null);
  };

  const openEdit = (user: CompanyUser) => {
    setEditUser(user);
    setEditRoleId(user.role?.id || "");
    setSavedRole(false);
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!form.phone.trim()) { setFormError(t('enterPhone')); return; }
    if (!form.password || form.password.length < 8) { setFormError(t('passwordMinLength')); return; }
    setSubmitting(true);
    setFormError("");
    try {
      await companyUsersAPI.create({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone,
        password: form.password,
        role_id: form.role_id || undefined,
      });
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      const d = e.response?.data;
      setFormError(
        typeof d === "object"
          ? Object.values(d).flat().join(" ")
          : t('errorOccurred')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSavingRole(true);
    try {
      await companyUsersAPI.update(editUser.id, {
        role_id: editRoleId || null,
      });
      setSavedRole(true);
      fetchData();
      setTimeout(() => setSavedRole(false), 3000);
    } catch {
      alert(t('errorSavingRole'));
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeactivate = async (user: CompanyUser) => {
    if (!window.confirm(`${user.full_name} ${t('teamConfirmDeactivate')}`)) return;
    try {
      await companyUsersAPI.deactivate(user.id);
      fetchData();
    } catch {
      alert(t('errorOccurred'));
    }
  };

  const getRoleDesc = (name: string) => {
    const map: Record<string, string> = {
      OWNER: t('roleOwner'),
      ADMIN: t('roleAdmin'),
      MANAGER: t('roleManager'),
      HR: t('roleHr'),
      ACCOUNTANT: t('roleAccountant'),
      EMPLOYEE: t('roleEmployee'),
      GUARD: t('roleGuard'),
    };
    return map[name] || t('notAssigned');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('teamManagement')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('teamSubtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          {t('addEmployee')}
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('teamSearchPlaceholder')}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
          <Users size={14} className="text-indigo-500" />
          {t('totalCount')}: <span className="text-slate-900 dark:text-white ml-1">{users.length}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-500">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <span className="text-sm font-medium">{t('loading')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700">
              <Users size={40} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{search ? t('noData') : t('noData')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{search ? t('tryFilters') : t('teamSubtitle')}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                  {[t('employee'), t('contact'), t('role'), t('dateJoined'), t('actions')].map((h) => (
                    <th key={h} className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={u.photo || ""} name={u.full_name} size={40} />
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{u.full_name || "—"}</div>
                          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider">#{u.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-medium italic">
                           <Mail size={12} className="text-slate-400" /> {u.email || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                           <Phone size={12} className="text-slate-400" /> {u.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.role ? (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${ROLE_STYLES[u.role.name] || ROLE_STYLES.EMPLOYEE}`}>
                          {u.role.name}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 italic uppercase">
                          {t('notAssigned')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                      {new Date(u.date_joined).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-tighter border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all active:scale-90"
                        >
                          <Shield size={12} /> {t('role')}
                        </button>
                        <button
                          onClick={() => handleDeactivate(u)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Container */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-6 border-bottom border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20 flex-shrink-0">
               <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${editUser ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-emerald-600 text-white shadow-emerald-500/20'}`}>
                    {editUser ? <Shield size={22} /> : <Plus size={22} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {editUser ? t('assignRole') : t('addEmployee')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-3">
                        {editUser ? t('changeRole') : t('enterUserDetails')}
                    </p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                  <X size={20} />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {editUser ? (
                /* Role Edit Mode */
                <div className="space-y-6">
                  <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
                    <UserAvatar src={editUser.photo || ""} name={editUser.full_name} size={56} />
                    <div className="space-y-0.5">
                      <div className="text-base font-black text-slate-900 dark:text-white uppercase">{editUser.full_name}</div>
                      <div className="text-xs font-bold text-slate-500 tracking-wider uppercase italic">{editUser.phone}</div>
                      {editUser.role && (
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border shrink-0 ${ROLE_STYLES[editUser.role.name] || ROLE_STYLES.EMPLOYEE}`}>
                           {editUser.role.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('selectNewRole')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roles.map((role) => {
                        const style = ROLE_STYLES[role.name] || ROLE_STYLES.EMPLOYEE;
                        const isSelected = editRoleId === role.id;
                        return (
                          <button
                            key={role.id}
                            onClick={() => setEditRoleId(role.id)}
                            className={`
                              flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left group
                              ${isSelected 
                                ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-500" 
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"}
                            `}
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 text-slate-400 group-hover:text-indigo-500'} transition-colors`}>
                               <Shield size={16} />
                            </div>
                            <div className="space-y-1">
                              <div className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                 {role.name}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase leading-3 italic">
                                 {getRoleDesc(role.name)}
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-500 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {savedRole && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                      <CheckCircle2 size={20} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t('roleSaved')}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Create User Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('firstName')}</label>
                      <input 
                         type="text" 
                         value={form.first_name} 
                         onChange={(e) => setForm(f => ({...f, first_name: e.target.value}))} 
                         placeholder="Jasur" 
                         className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase placeholder:normal-case italic" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('lastName')}</label>
                      <input 
                         type="text" 
                         value={form.last_name} 
                         onChange={(e) => setForm(f => ({...f, last_name: e.target.value}))} 
                         placeholder="Karimov" 
                         className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase placeholder:normal-case italic" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('phone')} *</label>
                    <input 
                       type="tel" 
                       value={form.phone} 
                       onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} 
                       placeholder="998901234567" 
                       className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all italic tracking-widest" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('email')}</label>
                    <input 
                       type="email" 
                       value={form.email} 
                       onChange={(e) => setForm(f => ({...f, email: e.target.value}))} 
                       placeholder="jasur@gmail.com" 
                       className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all italic" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('password')} *</label>
                    <input 
                       type="password" 
                       value={form.password} 
                       onChange={(e) => setForm(f => ({...f, password: e.target.value}))} 
                       placeholder="••••••••" 
                       className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all tracking-widest" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('role')}</label>
                    <div className="relative">
                      <select
                        value={form.role_id}
                        onChange={(e) => setForm(f => ({...f, role_id: e.target.value}))}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer placeholder:italic"
                      >
                        <option value="">{t('notAssigned')}</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {formError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/50 flex items-center gap-3 animate-in shake duration-300">
                      <AlertTriangle size={18} className="text-red-500" />
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">{formError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-700/50 flex flex-shrink-0 items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={editUser ? handleSaveRole : handleCreate}
                disabled={submitting || savingRole}
                className={`
                  flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50
                  ${editUser ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'}
                `}
              >
                {(submitting || savingRole) && <Loader2 size={14} className="animate-spin" />}
                {editUser ? t('saveChanges') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
