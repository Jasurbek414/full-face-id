import React, { useState, useEffect } from "react";
import {
  Building2, Clock, Bell, Lock, Save, Loader2, CheckCircle2,
  User, Globe, Shield, ChevronRight, Sun, Moon, Palette,
} from "lucide-react";
import { apiClient } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useLanguage, Lang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

type Section = "profile" | "appearance" | "company" | "schedule" | "notifications" | "security";

function SectionBtn({
  icon: Icon, label, active, onClick,
}: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon 
          size={18} 
          className={active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} 
        />
        <span className="text-sm tracking-tight">{label}</span>
      </div>
      {active && <ChevronRight size={16} className="text-indigo-600 dark:text-indigo-400" />}
    </button>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">
        {label}
      </label>
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", disabled,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all duration-200 outline-none
        ${disabled 
          ? "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
        }`}
    />
  );
}

function Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none
          ${checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm
            ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

function SaveButton({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 
        ${saved 
          ? "bg-emerald-500 text-white" 
          : loading 
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95"}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> :
        saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
      {saved ? t("saved") : loading ? t("saving") : t("save")}
    </button>
  );
}

export function SettingsPage() {
  const { user, setUser } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>("profile");

  // Profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Company settings
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Tashkent");
  const [savingCompany, setSavingCompany] = useState(false);
  const [savedCompany, setSavedCompany] = useState(false);

  // Work schedule
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [lunchMinutes, setLunchMinutes] = useState("60");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [lateGraceMinutes, setLateGraceMinutes] = useState("10");
  const [overtimeAfterMinutes, setOvertimeAfterMinutes] = useState("30");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState(false);

  // Notifications
  const [notifLate, setNotifLate] = useState(true);
  const [notifAbsent, setNotifAbsent] = useState(true);
  const [notifOvertime, setNotifOvertime] = useState(false);
  const [notifLeave, setNotifLeave] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  // Security
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [savedPw, setSavedPw] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setPhone(user.phone || "");
    }
    if (user?.company) {
      setCompanyName(user.company.name || "");
      setTimezone(user.company.timezone || "Asia/Tashkent");
    }
    
    // Load local settings
    const storedSchedule = localStorage.getItem("work_schedule");
    if (storedSchedule) {
      try {
        const s = JSON.parse(storedSchedule);
        setWorkStart(s.start || "09:00");
        setWorkEnd(s.end || "18:00");
        setLunchMinutes(String(s.lunch_minutes || "60"));
        setWorkDays(s.work_days || [1, 2, 3, 4, 5]);
        setLateGraceMinutes(String(s.late_grace_minutes || "10"));
        setOvertimeAfterMinutes(String(s.overtime_after_minutes || "30"));
      } catch (e) { console.error("Error loading schedule", e); }
    }

    const storedNotif = localStorage.getItem("notif_settings");
    if (storedNotif) {
      try {
        const n = JSON.parse(storedNotif);
        setNotifLate(n.late ?? true);
        setNotifAbsent(n.absent ?? true);
        setNotifOvertime(n.overtime ?? false);
        setNotifLeave(n.leave ?? true);
      } catch (e) { console.error("Error loading notifications", e); }
    }
  }, [user]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await apiClient.patch("/api/v1/auth/me/", {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      setUser(res.data);
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
    } catch {
      alert(t("saveError"));
    } finally {
      setSavingProfile(false);
    }
  };

  const weekDays = [
    { id: 1, label: t("mon") || "Du" },
    { id: 2, label: t("tue") || "Se" },
    { id: 3, label: t("wed") || "Ch" },
    { id: 4, label: t("thu") || "Pa" },
    { id: 5, label: t("fri") || "Ju" },
    { id: 6, label: t("sat") || "Sha" },
    { id: 0, label: t("sun") || "Ya" },
  ];

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const saveCompany = async () => {
    if (!companyName.trim()) return;
    setSavingCompany(true);
    try {
      await apiClient.patch(`/api/v1/companies/list/${user?.company?.id}/`, {
        name: companyName,
        timezone,
      });
      setSavedCompany(true);
      setTimeout(() => setSavedCompany(false), 3000);
    } catch {
      alert(t("saveError"));
    } finally {
      setSavingCompany(false);
    }
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      localStorage.setItem("work_schedule", JSON.stringify({
        start: workStart,
        end: workEnd,
        lunch_minutes: Number(lunchMinutes),
        work_days: workDays,
        late_grace_minutes: Number(lateGraceMinutes),
        overtime_after_minutes: Number(overtimeAfterMinutes),
      }));
      setSavedSchedule(true);
      setTimeout(() => setSavedSchedule(false), 3000);
    } catch {
      alert(t("saveError"));
    } finally {
      setSavingSchedule(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotif(true);
    try {
      localStorage.setItem("notif_settings", JSON.stringify({
        late: notifLate,
        absent: notifAbsent,
        overtime: notifOvertime,
        leave: notifLeave,
      }));
      setSavedNotif(true);
      setTimeout(() => setSavedNotif(false), 3000);
    } finally {
      setSavingNotif(false);
    }
  };

  const changePassword = async () => {
    setPwError("");
    if (!oldPassword || !newPassword) { setPwError(t("passwordRequired")); return; }
    if (newPassword.length < 8) { setPwError(t("passwordLengthError")); return; }
    if (newPassword !== confirmPassword) { setPwError(t("passwordMatchError")); return; }
    setSavingPw(true);
    try {
      await apiClient.post("/api/v1/auth/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setSavedPw(true);
      setTimeout(() => setSavedPw(false), 3000);
    } catch (e: any) {
      setPwError(e.response?.data?.detail || t("passwordChangeError"));
    } finally {
      setSavingPw(false);
    }
  };

  const sections = [
    { id: "profile" as Section, icon: User, label: t("profile") },
    { id: "appearance" as Section, icon: Palette, label: t("theme") },
    { id: "company" as Section, icon: Building2, label: t("company") },
    { id: "schedule" as Section, icon: Clock, label: t("schedule") },
    { id: "notifications" as Section, icon: Bell, label: t("notifications") },
    { id: "security" as Section, icon: Shield, label: t("security") },
  ];

  return (
    <div className="max-w-6xl mx-auto py-2 md:py-6 animate-in fade-in duration-500 transition-colors">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">
          {t("settings")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t("settingsSubtitle")}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors overflow-hidden">
          <div className="space-y-1">
            {sections.map((s) => (
              <SectionBtn
                key={s.id}
                icon={s.icon}
                label={s.label}
                active={section === s.id}
                onClick={() => setSection(s.id)}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 transition-colors">
          {/* Section: Profile */}
          {section === "profile" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8 items-center flex justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{t("profileData")}</h2>
                  <p className="text-sm text-slate-400 mt-1">{t("profileDataSubtitle")}</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl transition-colors">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/30">
                  {(firstName || user?.first_name || "A")[0].toUpperCase()}
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {firstName || user?.first_name} {lastName || user?.last_name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
                  <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors">
                    {user?.role?.name || user?.system_role || "ADMIN"}
                  </div>
                </div>
              </div>

              <FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldRow label={t("firstName")}>
                    <Input value={firstName} onChange={setFirstName} placeholder={t("firstName")} />
                  </FieldRow>
                  <FieldRow label={t("lastName")}>
                    <Input value={lastName} onChange={setLastName} placeholder={t("lastName")} />
                  </FieldRow>
                </div>
                <FieldRow label={t("phone")}>
                  <Input value={phone} onChange={setPhone} placeholder="+998901234567" />
                </FieldRow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                  <FieldRow label={t("email")} hint={t("notModifiable") || "O'zgartirib bo'lmaydi"}>
                    <Input value={user?.email || ""} disabled />
                  </FieldRow>
                  <FieldRow label="Kompaniya ID" hint={t("notModifiable") || "O'zgartirib bo'lmaydi"}>
                    <Input value={user?.company?.id || ""} disabled />
                  </FieldRow>
                </div>
              </FieldGroup>
              
              <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <SaveButton loading={savingProfile} saved={savedProfile} onClick={saveProfile} />
              </div>
            </div>
          )}

          {/* Section: Appearance */}
          {section === "appearance" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{t("theme")}</h2>
                <p className="text-sm text-slate-400 mt-1">{t("appearanceSubtitle")}</p>
              </div>

              <FieldGroup>
                <FieldRow label={t("interfaceLanguage")}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {([['uz', '🇺🇿', "O'zbek"], ['ru', '🇷🇺', 'Русский'], ['en', '🇬🇧', 'English']] as [Lang, string, string][]).map(([code, flag, name]) => (
                      <button
                        key={code}
                        onClick={() => setLang(code)}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 
                          ${lang === code 
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10" 
                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500">{flag}</span>
                          <span className={`text-sm font-bold ${lang === code ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}>
                            {name}
                          </span>
                        </div>
                        {lang === code && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label={t("theme")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {([['light', <Sun />, t("light")], ['dark', <Moon />, t("dark")]] as [string, React.ReactNode, string][]).map(([mode, icon, name]) => (
                      <button
                        key={mode}
                        onClick={() => { if ((isDark ? 'dark' : 'light') !== mode) toggleTheme(); }}
                        className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 
                          ${(isDark ? 'dark' : 'light') === mode 
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 shadow-lg shadow-indigo-500/10" 
                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"}`}
                      >
                        <div className={`p-2.5 rounded-xl transition-colors ${
                          (isDark ? 'dark' : 'light') === mode 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                          {icon}
                        </div>
                        <span className={`text-sm font-black tracking-wide ${
                          (isDark ? 'dark' : 'light') === mode ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {name}
                        </span>
                      </button>
                    ))}
                  </div>
                </FieldRow>
              </FieldGroup>
            </div>
          )}

          {/* Section: Company */}
          {section === "company" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{t("companyData")}</h2>
                <p className="text-sm text-slate-400 mt-1">{t("companySubtitle")}</p>
              </div>

              <FieldGroup>
                <FieldRow label={t("company")}>
                  <Input value={companyName} onChange={setCompanyName} placeholder="WorkTrack Pro" />
                </FieldRow>
                <FieldRow label={t("timezone")}>
                  <div className="relative group">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                      <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                      <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
                  </div>
                </FieldRow>
                <div className="opacity-80">
                   <FieldRow label="Kompaniya ID" hint={t("notModifiable")}>
                     <Input value={user?.company?.id || ""} disabled />
                   </FieldRow>
                </div>
              </FieldGroup>
              
              <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <SaveButton loading={savingCompany} saved={savedCompany} onClick={saveCompany} />
              </div>
            </div>
          )}

          {/* Section: Schedule */}
          {section === "schedule" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{t("workSchedule")}</h2>
                <p className="text-sm text-slate-400 mt-1">{t("workScheduleSubtitle")}</p>
              </div>

              <FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldRow label={t("workStart")}>
                    <Input type="time" value={workStart} onChange={setWorkStart} />
                  </FieldRow>
                  <FieldRow label={t("workEnd")}>
                    <Input type="time" value={workEnd} onChange={setWorkEnd} />
                  </FieldRow>
                  <FieldRow label={t("lunchTime")}>
                    <Input type="number" value={lunchMinutes} onChange={setLunchMinutes} />
                  </FieldRow>
                  <FieldRow label={t("lateGrace")} hint={t("lateGraceHint")}>
                    <Input type="number" value={lateGraceMinutes} onChange={setLateGraceMinutes} />
                  </FieldRow>
                </div>
                <FieldRow label={t("overtimeStart")} hint={t("overtimeStartHint")}>
                  <Input type="number" value={overtimeAfterMinutes} onChange={setOvertimeAfterMinutes} />
                </FieldRow>
                <FieldRow label={t("workDays")}>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {weekDays.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => toggleWorkDay(d.id)}
                        className={`w-12 h-12 rounded-2xl font-bold text-sm transition-all duration-300 border-2
                          ${workDays.includes(d.id) 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:border-indigo-300"}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>
              </FieldGroup>
              
              <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <SaveButton loading={savingSchedule} saved={savedSchedule} onClick={saveSchedule} />
              </div>
            </div>
          )}

          {/* Section: Notifications */}
          {section === "notifications" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{t("notifications")}</h2>
                <p className="text-sm text-slate-400 mt-1">{t("notificationsSubtitle")}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-4 md:p-6 transition-colors">
                <Toggle checked={notifLate} onChange={setNotifLate} label={t("notifLate")} />
                <Toggle checked={notifAbsent} onChange={setNotifAbsent} label={t("notifAbsent")} />
                <Toggle checked={notifOvertime} onChange={setNotifOvertime} label={t("notifOvertime")} />
                <Toggle checked={notifLeave} onChange={setNotifLeave} label={t("notifLeave")} />
              </div>
              <div className="mt-10 py-4 flex justify-end">
                <SaveButton loading={savingNotif} saved={savedNotif} onClick={saveNotifications} />
              </div>
            </div>
          )}

          {/* Section: Security */}
          {section === "security" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8 items-center flex gap-4">
                 <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center">
                    <Shield className="text-rose-500" size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{t("security")}</h2>
                    <p className="text-sm text-slate-400 mt-1">{t("securitySubtitle")}</p>
                 </div>
              </div>

              <FieldGroup>
                <FieldRow label={t("currentPassword")}>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={setOldPassword}
                    placeholder="••••••••"
                  />
                </FieldRow>
                <FieldRow label={t("newPassword")} hint={t("passwordHint")}>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="••••••••"
                  />
                </FieldRow>
                <FieldRow label={t("confirmNewPassword")}>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                  />
                </FieldRow>
              </FieldGroup>

              {pwError && (
                <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-medium flex gap-2 items-center animate-shake">
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">!</div>
                  {pwError}
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <SaveButton loading={savingPw} saved={savedPw} onClick={changePassword} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
