import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  UserCheck, UserX, Mail, Phone, Shield, ChevronDown, Search,
} from "lucide-react";
import { companyUsersAPI, rolesAPI } from "../api/devices";
import { UserAvatar } from "../components/UserAvatar";

const BRAND = { primary: "#1A237E", accent: "#3949AB", teal: "#00897B", bg: "#F5F7FA" };

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

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  OWNER: { bg: "#FEF3C7", color: "#D97706" },
  ADMIN: { bg: "#EDE9FE", color: "#7C3AED" },
  MANAGER: { bg: "#DBEAFE", color: "#1D4ED8" },
  HR: { bg: "#D1FAE5", color: "#059669" },
  ACCOUNTANT: { bg: "#FCE7F3", color: "#BE185D" },
  EMPLOYEE: { bg: "#F3F4F6", color: "#374151" },
  GUARD: { bg: "#FEE2E2", color: "#DC2626" },
};

function RoleBadge({ name }: { name: string }) {
  const style = ROLE_COLORS[name] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: style.bg, color: style.color,
    }}>
      {name}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
      {children}
    </label>
  );
}

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
        borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#111827",
        outline: "none", backgroundColor: "#fff",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#3949AB")}
      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
    />
  );
}

export function UsersPage() {
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
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
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
    if (!form.phone.trim()) { setFormError("Telefon raqam kiritilishi shart."); return; }
    if (!form.password || form.password.length < 8) { setFormError("Parol kamida 8 ta belgi bo'lishi kerak."); return; }
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
          : "Xatolik yuz berdi."
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
      alert("Rolni saqlashda xatolik.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeactivate = async (user: CompanyUser) => {
    if (!window.confirm(`${user.full_name} ni tizimdan o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) return;
    try {
      await companyUsersAPI.deactivate(user.id);
      fetchData();
    } catch {
      alert("Xatolik yuz berdi.");
    }
  };

  const setField = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Jamoa boshqaruvi</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Xodimlarni qo'shish, rollarini belgilash va boshqarish
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 8, border: "none",
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(26,35,126,0.25)",
          }}
        >
          <Plus size={15} />
          Xodim qo'shish
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 360,
          background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 12px",
        }}>
          <Search size={15} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, email yoki telefon bo'yicha qidiring..."
            style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", flex: 1, background: "none" }}
          />
        </div>
        <div style={{ fontSize: 13, color: "#6B7280" }}>
          Jami: <strong>{users.length}</strong> xodim
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAF0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: 12, fontSize: 13 }}>Yuklanmoqda...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Users size={40} color="#D1D5DB" />
            <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: "#374151" }}>
              {search ? "Qidiruv natijasi topilmadi" : "Hali xodim qo'shilmagan"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: BRAND.bg, borderBottom: "1px solid #E8EAF0" }}>
                  {["Xodim", "Aloqa", "Rol", "Qo'shilgan sana", "Amallar"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <UserAvatar src={user.photo || ""} name={user.full_name} size={36} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{user.full_name || "—"}</div>
                          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: "#374151" }}>{user.email || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {user.role ? <RoleBadge name={user.role.name} /> : (
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>Belgilanmagan</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>
                      {new Date(user.date_joined).toLocaleDateString("uz-UZ")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openEdit(user)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 6,
                            border: `1.5px solid ${BRAND.accent}`,
                            background: "#fff", color: BRAND.accent,
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          <Shield size={12} /> Rol
                        </button>
                        <button
                          onClick={() => handleDeactivate(user)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 10px", borderRadius: 6,
                            border: "1.5px solid #FECACA",
                            background: "#fff", color: "#DC2626",
                            fontSize: 12, cursor: "pointer",
                          }}
                        >
                          <UserX size={12} />
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

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid #E5E7EB",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "sticky", top: 0, background: "#fff", zIndex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal})`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {editUser ? <Shield size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    {editUser ? `${editUser.full_name} — Rol belgilash` : "Yangi xodim qo'shish"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {editUser ? "Rolni o'zgartiring" : "Xodim ma'lumotlarini kiriting"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {editUser ? (
                /* Role edit mode */
                <div>
                  <div style={{ marginBottom: 20, padding: 16, background: BRAND.bg, borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                    <UserAvatar src={editUser.photo || ""} name={editUser.full_name} size={44} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{editUser.full_name}</div>
                      <div style={{ fontSize: 13, color: "#6B7280" }}>{editUser.email || editUser.phone}</div>
                      {editUser.role && <RoleBadge name={editUser.role.name} />}
                    </div>
                  </div>

                  <FieldLabel>Yangi rol tanlang</FieldLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    {roles.map((role) => {
                      const style = ROLE_COLORS[role.name] || { bg: "#F3F4F6", color: "#374151" };
                      const selected = editRoleId === role.id;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setEditRoleId(role.id)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                            border: selected ? `2px solid ${BRAND.primary}` : "1.5px solid #E5E7EB",
                            background: selected ? "#EEF0FB" : "#fff",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: style.bg, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Shield size={16} color={style.color} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: selected ? BRAND.primary : "#111827" }}>
                                {role.name}
                              </div>
                              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                {getRoleDescription(role.name)}
                              </div>
                            </div>
                          </div>
                          {selected && <CheckCircle2 size={18} color={BRAND.primary} />}
                        </button>
                      );
                    })}
                  </div>

                  {savedRole && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                      background: "#F0FDF4", border: "1px solid #A7F3D0",
                      color: "#059669", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <CheckCircle2 size={14} /> Rol muvaffaqiyatli saqlandi!
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: "10px 20px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                        background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Yopish
                    </button>
                    <button
                      onClick={handleSaveRole}
                      disabled={savingRole}
                      style={{
                        padding: "10px 24px", borderRadius: 8, border: "none",
                        background: savingRole ? "#9CA3AF" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
                        color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: savingRole ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      {savingRole && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                      Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                /* Create user mode */
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <FieldLabel>Ism</FieldLabel>
                      <StyledInput value={form.first_name} onChange={setField("first_name")} placeholder="Jasur" />
                    </div>
                    <div>
                      <FieldLabel>Familiya</FieldLabel>
                      <StyledInput value={form.last_name} onChange={setField("last_name")} placeholder="Karimov" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Telefon raqam *</FieldLabel>
                    <StyledInput value={form.phone} onChange={setField("phone")} placeholder="998901234567" type="tel" />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Email</FieldLabel>
                    <StyledInput value={form.email} onChange={setField("email")} placeholder="jasur@gmail.com" type="email" />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Parol *</FieldLabel>
                    <StyledInput value={form.password} onChange={setField("password")} placeholder="Kamida 8 ta belgi" type="password" />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <FieldLabel>Rol</FieldLabel>
                    <select
                      value={form.role_id}
                      onChange={(e) => setField("role_id")(e.target.value)}
                      style={{
                        width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8,
                        padding: "9px 12px", fontSize: 13, color: "#111827",
                        outline: "none", backgroundColor: "#fff", cursor: "pointer",
                      }}
                    >
                      <option value="">Rol tanlanmagan</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {formError && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                      background: "#FEF2F2", border: "1px solid #FECACA",
                      color: "#DC2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <AlertTriangle size={14} /> {formError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: "10px 20px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                        background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={submitting}
                      style={{
                        padding: "10px 24px", borderRadius: 8, border: "none",
                        background: submitting ? "#9CA3AF" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
                        color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: submitting ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                      Qo'shish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function getRoleDescription(name: string): string {
  const map: Record<string, string> = {
    OWNER: "Barcha huquqlarga ega kompaniya rahbari",
    ADMIN: "Keng boshqaruv huquqlari",
    MANAGER: "Davomat va hisobotlarni ko'rish",
    HR: "Xodimlar boshqaruvi va ta'tillar",
    ACCOUNTANT: "Maosh hisoblash va moliyaviy hisobotlar",
    EMPLOYEE: "Faqat o'z ma'lumotlarini ko'rish",
    GUARD: "Davomat kuzatuv",
  };
  return map[name] || "Maxsus rol";
}
