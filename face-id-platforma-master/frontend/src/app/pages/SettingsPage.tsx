import React, { useState, useEffect } from "react";
import {
  Building2, Clock, Bell, Lock, Save, Loader2, CheckCircle2,
  User, Globe, Shield, ChevronRight, Sun, Moon, Palette,
} from "lucide-react";
import { apiClient } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useLanguage, Lang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const BRAND = { primary: "#1A237E", accent: "#3949AB", teal: "#00897B", bg: "#F5F7FA" };

type Section = "profile" | "company" | "schedule" | "notifications" | "security" | "appearance";

function SectionBtn({
  icon: Icon, label, active, onClick,
}: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 8, border: "none",
        background: active ? "#EEF0FB" : "transparent",
        color: active ? BRAND.primary : "#374151",
        fontWeight: active ? 700 : 400, fontSize: 14,
        cursor: "pointer", width: "100%", textAlign: "left",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={17} color={active ? BRAND.primary : "#9CA3AF"} />
        {label}
      </div>
      {active && <ChevronRight size={15} color={BRAND.primary} />}
    </button>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>{hint}</div>}
      {children}
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
      style={{
        width: "100%", boxSizing: "border-box", border: "1.5px solid #E5E7EB",
        borderRadius: 8, padding: "9px 12px", fontSize: 13,
        color: disabled ? "#6B7280" : "#111827",
        outline: "none", backgroundColor: disabled ? "#F5F7FA" : "#fff",
      }}
      onFocus={(e) => !disabled && (e.target.style.borderColor = "#3949AB")}
      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
    />
  );
}

function Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}
    >
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 42, height: 24, borderRadius: 12, cursor: "pointer",
          backgroundColor: checked ? BRAND.teal : "#D1D5DB",
          position: "relative", transition: "background-color 0.2s",
          flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
    </div>
  );
}

function SaveButton({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 24px", borderRadius: 8, border: "none",
        background: saved ? "#059669" : loading ? "#9CA3AF" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
        color: "#fff", fontSize: 13, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading || saved ? "none" : "0 2px 8px rgba(26,35,126,0.3)",
        transition: "background 0.3s",
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> :
        saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
      {saved ? "Saqlandi!" : loading ? "Saqlanmoqda..." : "Saqlash"}
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
      alert("Saqlashda xatolik.");
    } finally {
      setSavingProfile(false);
    }
  };

  const weekDays = [
    { id: 1, label: "Du" },
    { id: 2, label: "Se" },
    { id: 3, label: "Ch" },
    { id: 4, label: "Pa" },
    { id: 5, label: "Ju" },
    { id: 6, label: "Sha" },
    { id: 0, label: "Ya" },
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
      alert("Saqlashda xatolik yuz berdi.");
    } finally {
      setSavingCompany(false);
    }
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      // Store in localStorage for now (schedule API endpoint optional)
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
      alert("Saqlashda xatolik yuz berdi.");
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
    if (!oldPassword || !newPassword) { setPwError("Barcha maydonlarni to'ldiring."); return; }
    if (newPassword.length < 8) { setPwError("Yangi parol kamida 8 ta belgi bo'lishi kerak."); return; }
    if (newPassword !== confirmPassword) { setPwError("Parollar mos tushmadi."); return; }
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
      setPwError(e.response?.data?.detail || "Parolni o'zgartirishda xatolik.");
    } finally {
      setSavingPw(false);
    }
  };

  const sections = [
    { id: "profile" as Section, icon: User, label: "Profil" },
    { id: "appearance" as Section, icon: Palette, label: "Ko'rinish" },
    { id: "company" as Section, icon: Building2, label: "Kompaniya" },
    { id: "schedule" as Section, icon: Clock, label: "Ish jadvali" },
    { id: "notifications" as Section, icon: Bell, label: "Bildirishnomalar" },
    { id: "security" as Section, icon: Shield, label: "Xavfsizlik" },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Sozlamalar</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
          Kompaniya va tizim sozlamalarini boshqarish
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>
        {/* Sidebar */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0", padding: 12 }}>
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

        {/* Content */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0", padding: 28 }}>
          {/* Profile */}
          {section === "profile" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Shaxsiy ma'lumotlar</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Profil ma'lumotlaringizni tahrirlang</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "20px", background: "#F5F7FA", borderRadius: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                  {(firstName || user?.first_name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{firstName || user?.first_name} {lastName || user?.last_name}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{user?.email}</div>
                  <div style={{ fontSize: 12, color: BRAND.teal, marginTop: 4, fontWeight: 600 }}>{user?.role?.name || user?.system_role || "OWNER"}</div>
                </div>
              </div>
              <FieldGroup>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <FieldRow label="Ism">
                    <Input value={firstName} onChange={setFirstName} placeholder="Ism" />
                  </FieldRow>
                  <FieldRow label="Familiya">
                    <Input value={lastName} onChange={setLastName} placeholder="Familiya" />
                  </FieldRow>
                </div>
                <FieldRow label="Telefon raqam">
                  <Input value={phone} onChange={setPhone} placeholder="+998901234567" />
                </FieldRow>
                <FieldRow label="Email" hint="O'zgartirish mumkin emas">
                  <Input value={user?.email || ""} disabled />
                </FieldRow>
                <FieldRow label="Kompaniya ID" hint="O'zgartirish mumkin emas">
                  <Input value={user?.company?.id || ""} disabled />
                </FieldRow>
              </FieldGroup>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <SaveButton loading={savingProfile} saved={savedProfile} onClick={saveProfile} />
              </div>
            </div>
          )}

          {/* Appearance */}
          {section === "appearance" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Ko'rinish sozlamalari</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Til va mavzu tanlamlari</div>
              </div>
              <FieldGroup>
                <FieldRow label="Interfeys tili">
                  <div style={{ display: "flex", gap: 12 }}>
                    {([['uz', '🇺🇿', "O'zbek"], ['ru', '🇷🇺', 'Русский'], ['en', '🇬🇧', 'English']] as [Lang, string, string][]).map(([code, flag, label]) => (
                      <button
                        key={code}
                        onClick={() => setLang(code)}
                        style={{
                          flex: 1, padding: "12px 16px", borderRadius: 10, border: `2px solid`,
                          borderColor: lang === code ? BRAND.primary : "#E5E7EB",
                          background: lang === code ? "#EEF0FB" : "#fff",
                          color: lang === code ? BRAND.primary : "#374151",
                          fontSize: 14, fontWeight: lang === code ? 700 : 400,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{flag}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </FieldRow>
                <FieldRow label="Mavzu">
                  <div style={{ display: "flex", gap: 12 }}>
                    {([['light', '☀️', "Yorug'"], ['dark', '🌙', 'Tungi']] as [string, string, string][]).map(([mode, icon, label]) => (
                      <button
                        key={mode}
                        onClick={() => { if ((isDark ? 'dark' : 'light') !== mode) toggleTheme(); }}
                        style={{
                          flex: 1, padding: "16px", borderRadius: 10, border: `2px solid`,
                          borderColor: (isDark ? 'dark' : 'light') === mode ? BRAND.primary : "#E5E7EB",
                          background: (isDark ? 'dark' : 'light') === mode ? "#EEF0FB" : "#fff",
                          color: (isDark ? 'dark' : 'light') === mode ? BRAND.primary : "#374151",
                          fontSize: 14, fontWeight: (isDark ? 'dark' : 'light') === mode ? 700 : 400,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </FieldRow>
              </FieldGroup>
            </div>
          )}

          {/* Company */}
          {section === "company" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Kompaniya ma'lumotlari</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  Kompaniyangiz asosiy ma'lumotlarini tahrirlang
                </div>
              </div>
              <FieldGroup>
                <FieldRow label="Kompaniya nomi">
                  <Input value={companyName} onChange={setCompanyName} placeholder="WorkTrack Pro" />
                </FieldRow>
                <FieldRow label="Vaqt mintaqasi">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={{
                      width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8,
                      padding: "9px 12px", fontSize: 13, color: "#111827",
                      outline: "none", backgroundColor: "#fff",
                    }}
                  >
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                    <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                    <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </FieldRow>
                <FieldRow label="Kompaniya ID" hint="O'zgartirish mumkin emas">
                  <Input value={user?.company?.id || ""} disabled />
                </FieldRow>
              </FieldGroup>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <SaveButton loading={savingCompany} saved={savedCompany} onClick={saveCompany} />
              </div>
            </div>
          )}

          {/* Schedule */}
          {section === "schedule" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Ish jadvali</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  Ish vaqti, tanaffus va qo'shimcha ish soatlari sozlamalari
                </div>
              </div>
              <FieldGroup>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <FieldRow label="Ish boshlanish vaqti">
                    <Input type="time" value={workStart} onChange={setWorkStart} />
                  </FieldRow>
                  <FieldRow label="Ish tugash vaqti">
                    <Input type="time" value={workEnd} onChange={setWorkEnd} />
                  </FieldRow>
                  <FieldRow label="Tushlik tanaffusi (daqiqa)">
                    <Input type="number" value={lunchMinutes} onChange={setLunchMinutes} placeholder="60" />
                  </FieldRow>
                  <FieldRow label="Kechikish chegarasi (daqiqa)" hint="Shu daqiqagacha kechikish hisoblanmaydi">
                    <Input type="number" value={lateGraceMinutes} onChange={setLateGraceMinutes} placeholder="10" />
                  </FieldRow>
                </div>
                <FieldRow label="Qo'shimcha ish soati boshlanishi (daqiqa)" hint="Ish tugashidan necha daqiqa keyin qo'shimcha ish hisoblanadi">
                  <Input type="number" value={overtimeAfterMinutes} onChange={setOvertimeAfterMinutes} placeholder="30" />
                </FieldRow>
                <FieldRow label="Ish kunlari">
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {weekDays.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => toggleWorkDay(d.id)}
                        style={{
                          width: 40, height: 40, borderRadius: "50%", border: "1.5px solid",
                          borderColor: workDays.includes(d.id) ? BRAND.primary : "#E5E7EB",
                          background: workDays.includes(d.id) ? BRAND.primary : "#fff",
                          color: workDays.includes(d.id) ? "#fff" : "#374151",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>
              </FieldGroup>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <SaveButton loading={savingSchedule} saved={savedSchedule} onClick={saveSchedule} />
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Bildirishnoma sozlamalari</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  Qaysi hodisalar uchun bildirishnoma olish kerakligini tanlang
                </div>
              </div>
              <div>
                <Toggle checked={notifLate} onChange={setNotifLate} label="Xodim kechikganda xabar berish" />
                <Toggle checked={notifAbsent} onChange={setNotifAbsent} label="Xodim kelmaganda xabar berish" />
                <Toggle checked={notifOvertime} onChange={setNotifOvertime} label="Qo'shimcha ish soatlari haqida xabar berish" />
                <Toggle checked={notifLeave} onChange={setNotifLeave} label="Ta'til so'rovlari haqida xabar berish" />
              </div>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <SaveButton loading={savingNotif} saved={savedNotif} onClick={saveNotifications} />
              </div>
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Xavfsizlik</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Parolni o'zgartirish</div>
              </div>
              <FieldGroup>
                <FieldRow label="Joriy parol">
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={setOldPassword}
                    placeholder="••••••••"
                  />
                </FieldRow>
                <FieldRow label="Yangi parol">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Kamida 8 ta belgi"
                  />
                </FieldRow>
                <FieldRow label="Yangi parolni tasdiqlash">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                  />
                </FieldRow>
              </FieldGroup>

              {pwError && (
                <div style={{
                  marginTop: 14, padding: "10px 14px", borderRadius: 8,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", fontSize: 13,
                }}>
                  {pwError}
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <SaveButton loading={savingPw} saved={savedPw} onClick={changePassword} />
              </div>

            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
