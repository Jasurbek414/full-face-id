import React, { useState, useEffect, useCallback } from "react";
import {
  Banknote, Calculator, Users, Clock, TrendingUp, Plus, Save,
  Loader2, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { apiClient } from "../api/client";
import { companyUsersAPI } from "../api/devices";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";

const BRAND = { primary: "#1A237E", accent: "#3949AB", teal: "#00897B", bg: "#F5F7FA" };

type Tab = "records" | "salary_config" | "calculate";

interface SalaryConfig {
  id?: number;
  user: string;
  salary_type: "hourly" | "daily" | "monthly";
  amount: string;
  overtime_rate: string;
}

interface PayrollRecord {
  id: number;
  user: string;
  user_full_name: string;
  month: string;
  work_days: number;
  work_hours: string;
  overtime_hours: string;
  base_salary: string;
  overtime_pay: string;
  net_salary: string;
  status: string;
}

interface CompanyUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role?: { name: string } | null;
}

const fmt = (v: number | string) =>
  Number(v).toLocaleString("uz-UZ") + " so'm";

function StyledInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box", border: "1.5px solid #E5E7EB",
        borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#111827",
        outline: "none", backgroundColor: "#fff",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#3949AB")}
      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
    />
  );
}

export function PayrollPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("records");

  // Payroll records
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Salary configs
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // New config form
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [cfgUserId, setCfgUserId] = useState("");
  const [cfgType, setCfgType] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [cfgAmount, setCfgAmount] = useState("");
  const [cfgOvertime, setCfgOvertime] = useState("1.5");
  const [savingCfg, setSavingCfg] = useState(false);
  const [savedCfg, setSavedCfg] = useState(false);
  const [cfgError, setCfgError] = useState("");

  // Calculate
  const [calcMonth, setCalcMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const isOwnerOrAccountant =
    user?.role?.name === "OWNER" ||
    user?.role?.name === "ACCOUNTANT" ||
    user?.role?.name === "ADMIN" ||
    user?.is_staff;

  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const url = isOwnerOrAccountant
        ? "/api/v1/payroll/records/"
        : "/api/v1/payroll/records/my/";
      const { data } = await apiClient.get(url);
      setRecords(data.results || data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [isOwnerOrAccountant]);

  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    try {
      const [cfgRes, usersRes] = await Promise.all([
        apiClient.get("/api/v1/payroll/config/"),
        companyUsersAPI.list(),
      ]);
      setConfigs(cfgRes.data.results || cfgRes.data || []);
      setUsers(usersRes.data.results || []);
    } catch {
      setConfigs([]);
    } finally {
      setLoadingConfigs(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "records") fetchRecords();
    else if (tab === "salary_config") fetchConfigs();
  }, [tab, fetchRecords, fetchConfigs]);

  const handleSaveConfig = async () => {
    if (!cfgUserId) { setCfgError("Xodimni tanlang."); return; }
    if (!cfgAmount || isNaN(Number(cfgAmount)) || Number(cfgAmount) <= 0) {
      setCfgError("To'g'ri miqdor kiriting."); return;
    }
    setSavingCfg(true);
    setCfgError("");
    try {
      await apiClient.post("/api/v1/payroll/config/", {
        user: cfgUserId,
        salary_type: cfgType,
        amount: Number(cfgAmount),
        overtime_rate: Number(cfgOvertime),
      });
      setSavedCfg(true);
      setShowConfigForm(false);
      setCfgUserId(""); setCfgAmount(""); setCfgType("hourly"); setCfgOvertime("1.5");
      fetchConfigs();
      setTimeout(() => setSavedCfg(false), 3000);
    } catch (e: any) {
      const d = e.response?.data;
      setCfgError(typeof d === "object" ? Object.values(d).flat().join(" ") : "Xatolik yuz berdi.");
    } finally {
      setSavingCfg(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setCalcResult(null);
    try {
      const { data } = await apiClient.post("/api/v1/payroll/records/calculate/", {
        month: calcMonth,
      });
      setCalcResult(data.message || "Hisoblash yakunlandi.");
      fetchRecords();
      setTab("records");
    } catch (e: any) {
      setCalcResult(`Xatolik: ${e.response?.data?.error || "Hisoblash amalga oshmadi."}`);
    } finally {
      setCalculating(false);
    }
  };

  const tabs = [
    { id: "records" as Tab, label: "Maosh yozuvlari", icon: Banknote },
    ...(isOwnerOrAccountant
      ? [
          { id: "salary_config" as Tab, label: "Ish haqi sozlamalari", icon: Users },
          { id: "calculate" as Tab, label: "Hisoblash", icon: Calculator },
        ]
      : []),
  ];

  const salaryTypeLabel = { hourly: "Soatlik", daily: "Kunlik", monthly: "Oylik" };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Maosh boshqaruvi</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Xodimlar ish haqi va hisob-kitoblarini boshqarish
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #E5E7EB" }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", border: "none", cursor: "pointer",
                background: "none", fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? BRAND.primary : "#6B7280",
                borderBottom: active ? `2px solid ${BRAND.primary}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Records tab */}
      {tab === "records" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: BRAND.bg, borderBottom: "1px solid #E8EAF0" }}>
                  {(isOwnerOrAccountant
                    ? ["Xodim", "Oy", "Ish kunlari", "Ish soatlari", "Q.ish soatlari", "Asosiy maosh", "Q.ish to'lovi", "Jami maosh", "Holat"]
                    : ["Oy", "Ish kunlari", "Ish soatlari", "Asosiy maosh", "Q.ish to'lovi", "Jami maosh", "Holat"]
                  ).map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingRecords ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>
                      <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
                      Maosh yozuvlari topilmadi. Hisoblash tabiga o'ting.
                    </td>
                  </tr>
                ) : (
                  records.map((rec, i) => (
                    <tr key={rec.id} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: i % 2 === 0 ? "#fff" : BRAND.bg }}>
                      {isOwnerOrAccountant && (
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                          {rec.user_full_name || "—"}
                        </td>
                      )}
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                        {rec.month}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                        {rec.work_days}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                        {Number(rec.work_hours).toFixed(1)} soat
                      </td>
                      {isOwnerOrAccountant && (
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#F59E0B" }}>
                          {Number(rec.overtime_hours).toFixed(1)} soat
                        </td>
                      )}
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                        {fmt(rec.base_salary)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#10B981", fontWeight: 600 }}>
                        +{fmt(rec.overtime_pay)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: BRAND.primary }}>
                        {fmt(rec.net_salary)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={rec.status || "draft"} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary config tab */}
      {tab === "salary_config" && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowConfigForm(!showConfigForm); setCfgError(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={15} />
              Ish haqi sozlash
            </button>
          </div>

          {/* Config form */}
          {showConfigForm && (
            <div style={{
              background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0",
              padding: 24, marginBottom: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
                Xodim ish haqi sozlamalari
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Xodim *
                  </label>
                  <select
                    value={cfgUserId}
                    onChange={(e) => setCfgUserId(e.target.value)}
                    style={{
                      width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8,
                      padding: "9px 12px", fontSize: 13, outline: "none", background: "#fff",
                    }}
                  >
                    <option value="">Xodimni tanlang</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name || u.phone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Ish haqi turi
                  </label>
                  <select
                    value={cfgType}
                    onChange={(e) => setCfgType(e.target.value as any)}
                    style={{
                      width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8,
                      padding: "9px 12px", fontSize: 13, outline: "none", background: "#fff",
                    }}
                  >
                    <option value="hourly">Soatlik</option>
                    <option value="daily">Kunlik</option>
                    <option value="monthly">Oylik</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Miqdor (so'm) *
                    <span style={{ fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>
                      {cfgType === "hourly" ? "1 soat uchun" : cfgType === "daily" ? "1 kun uchun" : "oylik"}
                    </span>
                  </label>
                  <StyledInput
                    type="number"
                    value={cfgAmount}
                    onChange={setCfgAmount}
                    placeholder={cfgType === "hourly" ? "10000" : cfgType === "daily" ? "200000" : "3000000"}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Qo'shimcha ish koeffitsienti
                    <span style={{ fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>
                      (asosiy × koeff.)
                    </span>
                  </label>
                  <StyledInput type="number" value={cfgOvertime} onChange={setCfgOvertime} placeholder="1.5" />
                </div>
              </div>

              {cfgAmount && cfgType === "hourly" && (
                <div style={{
                  padding: "12px 16px", background: "#F0F9FF", borderRadius: 8,
                  border: "1px solid #BAE6FD", marginBottom: 16, fontSize: 13, color: "#0369A1",
                }}>
                  💡 1 kunlik (8 soat): {fmt(Number(cfgAmount) * 8)} &nbsp;|&nbsp;
                  Oylik (22 ish kuni): {fmt(Number(cfgAmount) * 8 * 22)} &nbsp;|&nbsp;
                  Q.ish 1 soat: {fmt(Number(cfgAmount) * Number(cfgOvertime))}
                </div>
              )}

              {cfgError && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={14} /> {cfgError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowConfigForm(false)}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                    background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingCfg}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: "none",
                    background: savingCfg ? "#9CA3AF" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: savingCfg ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {savingCfg && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  Saqlash
                </button>
              </div>
            </div>
          )}

          {/* Configs table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0", overflow: "hidden" }}>
            {loadingConfigs ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} color="#9CA3AF" />
              </div>
            ) : configs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF", fontSize: 13 }}>
                Hali ish haqi sozlamasi qo'shilmagan. Yuqoridagi tugmani bosing.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: BRAND.bg, borderBottom: "1px solid #E8EAF0" }}>
                      {["Xodim", "Ish haqi turi", "Miqdor", "Q.ish koeff.", "Amallar"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((cfg, i) => {
                      const u = users.find((u) => u.id === cfg.user);
                      return (
                        <tr key={cfg.id || i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {u?.full_name || u?.phone || cfg.user}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13 }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: cfg.salary_type === "hourly" ? "#DBEAFE" : cfg.salary_type === "daily" ? "#D1FAE5" : "#EDE9FE",
                              color: cfg.salary_type === "hourly" ? "#1D4ED8" : cfg.salary_type === "daily" ? "#059669" : "#7C3AED",
                            }}>
                              {salaryTypeLabel[cfg.salary_type]}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: BRAND.primary }}>
                            {fmt(cfg.amount)}
                            <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>
                              /{cfg.salary_type === "hourly" ? "soat" : cfg.salary_type === "daily" ? "kun" : "oy"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#F59E0B", fontWeight: 600 }}>
                            ×{cfg.overtime_rate}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              onClick={async () => {
                                if (!window.confirm("Sozlamani o'chirishni tasdiqlaysizmi?")) return;
                                try {
                                  await apiClient.delete(`/api/v1/payroll/config/${cfg.id}/`);
                                  fetchConfigs();
                                } catch { alert("Xatolik yuz berdi."); }
                              }}
                              style={{
                                padding: "5px 12px", borderRadius: 6, border: "1.5px solid #FECACA",
                                background: "#fff", color: "#DC2626", fontSize: 12, cursor: "pointer",
                              }}
                            >
                              O'chirish
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculate tab */}
      {tab === "calculate" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0", padding: 32, maxWidth: 480 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Maosh hisoblash</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
              Tanlangan oy uchun barcha xodimlarning maoshini davomat ma'lumotlari asosida hisoblaydi.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Hisoblash oyi
            </label>
            <input
              type="month"
              value={calcMonth}
              onChange={(e) => setCalcMonth(e.target.value)}
              style={{
                border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px",
                fontSize: 13, outline: "none", color: "#111827",
              }}
            />
          </div>

          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Ish kunlari hisoblanadi", icon: Clock, info: "Davomat yozuvlari asosida" },
              { label: "Qo'shimcha ish soatlari", icon: TrendingUp, info: "Ish haqi sozlamasidagi koeff. bilan" },
            ].map(({ label, icon: Icon, info }) => (
              <div key={label} style={{ padding: 14, background: BRAND.bg, borderRadius: 8, border: "1px solid #E8EAF0" }}>
                <Icon size={18} color={BRAND.teal} />
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 8 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{info}</div>
              </div>
            ))}
          </div>

          {calcResult && (
            <div style={{
              padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13,
              background: calcResult.startsWith("Xatolik") ? "#FEF2F2" : "#F0FDF4",
              border: `1px solid ${calcResult.startsWith("Xatolik") ? "#FECACA" : "#A7F3D0"}`,
              color: calcResult.startsWith("Xatolik") ? "#DC2626" : "#059669",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {calcResult.startsWith("Xatolik")
                ? <AlertTriangle size={14} />
                : <CheckCircle2 size={14} />
              }
              {calcResult}
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={calculating}
            style={{
              width: "100%", padding: "13px", borderRadius: 8, border: "none",
              background: calculating ? "#9CA3AF" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: calculating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: calculating ? "none" : "0 4px 16px rgba(26,35,126,0.3)",
            }}
          >
            {calculating
              ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Hisoblanmoqda...</>
              : <><Calculator size={16} /> {calcMonth} oyi maoshlarini hisoblash</>
            }
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
