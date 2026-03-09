import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Users, Building2, AlertCircle, CheckCircle, Server, Activity,
  ShieldAlert, BadgeCheck, Search, RefreshCw, Crown, LogOut,
  TrendingUp, DollarSign, Shield, Plus, X, ChevronRight,
  CreditCard, FileText, Edit3, Eye, Calendar,
  Camera, UserCheck, Settings, ToggleLeft, ToggleRight,
  Home, BarChart2, Globe, ChevronDown, ChevronUp, Layers,
  Bell, Check, Ban, Clock
} from "lucide-react";
import { saAPI } from "../api/saClient";

// ─── Brand ──────────────────────────────────────────────────────────────────
const C = {
  sidebar: "#0F1B5C",
  sidebarHover: "#1A2D7A",
  sidebarActive: "#2A3D9A",
  accent: "#4F6BDB",
  bg: "#F0F4FF",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
};

type NavPage = "dashboard" | "companies" | "employees" | "devices" | "plans" | "payments" | "audit";
type SubTab = "info" | "plan" | "payment" | "history" | "employees" | "devices" | "roles" | "notes";
type PlanFilter = "ALL" | "TRIAL" | "ACTIVE" | "GRACE" | "BLOCKED";

// ─── Utility components ──────────────────────────────────────────────────────

function KPICard({ title, value, sub, icon, color }: { title: string; value: any; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderLeft: `4px solid ${color}`, flex: 1, minWidth: 160 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginTop: 10, letterSpacing: "-0.02em" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: "Faol", color: "#059669", bg: "#D1FAE5" },
    TRIAL: { label: "Sinov", color: "#D97706", bg: "#FEF3C7" },
    GRACE: { label: "Muhlat", color: "#7C3AED", bg: "#EDE9FE" },
    BLOCKED: { label: "Bloklangan", color: "#DC2626", bg: "#FEE2E2" },
    NO_SUB: { label: "Obuna yo'q", color: "#6B7280", bg: "#F3F4F6" },
    online: { label: "Online", color: "#059669", bg: "#D1FAE5" },
    offline: { label: "Offline", color: "#DC2626", bg: "#FEE2E2" },
    active: { label: "Faol", color: "#059669", bg: "#D1FAE5" },
    inactive: { label: "Nofaol", color: "#6B7280", bg: "#F3F4F6" },
  };
  const k = status?.toUpperCase();
  const m = map[k] ?? map[status?.toLowerCase()] ?? { label: status ?? "—", color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: m.bg, color: m.color, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      {k === "BLOCKED" ? <Ban size={10} /> : (k === "ACTIVE" || status?.toLowerCase() === "online") ? <Check size={10} /> : k === "TRIAL" ? <Clock size={10} /> : null}
      {m.label}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", small, disabled, style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "danger" | "ghost" | "success";
  small?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  const colorMap = {
    primary: { bg: C.accent, color: "#fff" },
    danger: { bg: "#EF4444", color: "#fff" },
    success: { bg: "#10B981", color: "#fff" },
    ghost: { bg: "transparent", color: C.muted },
  };
  const { bg, color } = colorMap[variant];
  return (
    <button disabled={disabled} onClick={onClick} style={{ background: bg, color, border: "none", borderRadius: 10, padding: small ? "6px 14px" : "9px 18px", fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6, ...extraStyle }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, style: s }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, outline: "none", background: C.card, color: C.text, ...s }} />
  );
}

function Card({ children, style: s }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.card, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: 24, ...s }}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 20px" }}>{children}</h2>;
}

function Table({ headers, rows, emptyMsg = "Ma'lumot topilmadi" }: { headers: string[]; rows: React.ReactNode[][]; emptyMsg?: string }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {headers.map((h, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 14 }}>{emptyMsg}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "12px 14px", verticalAlign: "middle" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: wide ? 900 : 540, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}><X size={20} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Boshqaruv paneli", icon: <Home size={18} /> },
  { id: "companies", label: "Kompaniyalar", icon: <Building2 size={18} /> },
  { id: "employees", label: "Xodimlar", icon: <Users size={18} /> },
  { id: "devices", label: "Qurilmalar", icon: <Camera size={18} /> },
  { id: "plans", label: "Tariflar", icon: <Layers size={18} /> },
  { id: "payments", label: "To'lovlar", icon: <CreditCard size={18} /> },
  { id: "audit", label: "Audit", icon: <FileText size={18} /> },
];

function Sidebar({ page, onPage, onLogout }: { page: NavPage; onPage: (p: NavPage) => void; onLogout: () => void }) {
  return (
    <div style={{ width: 230, background: C.sidebar, display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em" }}>WorkTrack Pro</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>SuperAdmin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => onPage(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active ? C.sidebarActive : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: active ? 700 : 500, fontSize: 13, marginBottom: 2, transition: "all 0.15s", textAlign: "left" }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.sidebarHover; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; } }}>
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500 }}>
          <LogOut size={18} />Chiqish
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────

function DashboardHome({ stats, companies, onViewCompany }: { stats: any; companies: any[]; onViewCompany: (c: any) => void }) {
  const health = [
    { label: "Backend API", ok: true, detail: "Django 4.2 • DRF" },
    { label: "PostgreSQL", ok: true, detail: "worktrack_db" },
    { label: "Redis", ok: !!stats, detail: "redis://127.0.0.1:6379" },
    { label: "Celery", ok: !!stats, detail: "Beat + Worker" },
  ];
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Boshqaruv paneli</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Tizim holati va umumiy ko'rsatkichlar</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard title="Jami kompaniyalar" value={stats?.total_companies ?? companies.length} sub="Ro'yxatdan o'tgan" icon={<Building2 size={18} />} color="#4F6BDB" />
        <KPICard title="Faol kompaniyalar" value={stats?.active_companies ?? companies.filter(c => c.subscription_status === "ACTIVE").length} sub="Hozir faol" icon={<CheckCircle size={18} />} color="#10B981" />
        <KPICard title="Sinov muddatida" value={stats?.trial_companies ?? companies.filter(c => c.subscription_status === "TRIAL").length} sub="Trial davri" icon={<Crown size={18} />} color="#F59E0B" />
        <KPICard title="Bloklangan" value={stats?.blocked_companies ?? companies.filter(c => c.subscription_status === "BLOCKED").length} sub="Muddati o'tgan" icon={<ShieldAlert size={18} />} color="#EF4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Recent Companies */}
        <Card>
          <SectionTitle>So'nggi kompaniyalar</SectionTitle>
          {companies.slice(0, 6).map(c => (
            <div key={c.id} onClick={() => onViewCompany(c)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={16} color={C.accent} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{c.email}</div>
                </div>
              </div>
              <StatusPill status={c.subscription_status || "NO_SUB"} />
            </div>
          ))}
        </Card>

        {/* System Health */}
        <Card>
          <SectionTitle>Tizim holati</SectionTitle>
          {health.map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < health.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: h.ok ? "#10B981" : "#EF4444" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{h.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{h.detail}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: h.ok ? "#10B981" : "#EF4444" }}>{h.ok ? "Ishlaydi" : "Xato"}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 14, background: C.bg, borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>OBUNA HOLATI</div>
            {[{ label: "Muddati o'tgan (GRACE)", count: companies.filter(c => c.subscription_status === "GRACE").length, color: "#7C3AED" },
              { label: "Obuna yo'q", count: companies.filter(c => !c.subscription_status || c.subscription_status === "NO_SUB").length, color: "#6B7280" }
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.muted }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Companies Page ───────────────────────────────────────────────────────────

function CompaniesPage({ companies, loading, onRefresh, onView, onBlock, onUnblock }: {
  companies: any[]; loading: boolean; onRefresh: () => void;
  onView: (c: any) => void; onBlock: (c: any) => void; onUnblock: (c: any) => void;
}) {
  const [filter, setFilter] = useState<PlanFilter>("ALL");
  const [search, setSearch] = useState("");

  const filtered = companies.filter(c => {
    const matchFilter = filter === "ALL" || c.subscription_status === filter;
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filterCounts: Record<PlanFilter, number> = {
    ALL: companies.length,
    TRIAL: companies.filter(c => c.subscription_status === "TRIAL").length,
    ACTIVE: companies.filter(c => c.subscription_status === "ACTIVE").length,
    GRACE: companies.filter(c => c.subscription_status === "GRACE").length,
    BLOCKED: companies.filter(c => c.subscription_status === "BLOCKED").length,
  };

  const FILTERS: { key: PlanFilter; label: string; color: string }[] = [
    { key: "ALL", label: "Barchasi", color: C.accent },
    { key: "TRIAL", label: "Sinov", color: "#F59E0B" },
    { key: "ACTIVE", label: "Faol", color: "#10B981" },
    { key: "GRACE", label: "Muhlat", color: "#7C3AED" },
    { key: "BLOCKED", label: "Bloklangan", color: "#EF4444" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Kompaniyalar</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Barcha ro'yxatdan o'tgan kompaniyalar</p>
        </div>
        <Btn onClick={onRefresh} variant="ghost"><RefreshCw size={15} />Yangilash</Btn>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: "7px 16px", borderRadius: 20, border: filter === f.key ? `2px solid ${f.color}` : `2px solid ${C.border}`, background: filter === f.key ? `${f.color}15` : C.card, color: filter === f.key ? f.color : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {f.label}
            <span style={{ background: filter === f.key ? f.color : C.border, color: filter === f.key ? "#fff" : C.muted, borderRadius: 10, padding: "0 6px", fontSize: 11, fontWeight: 700 }}>{filterCounts[f.key]}</span>
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <Input value={search} onChange={setSearch} placeholder="Qidirish..." style={{ width: 220 }} />
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
            <div>Yuklanmoqda...</div>
          </div>
        ) : (
          <Table
            headers={["Kompaniya", "Holat", "Ish joylari", "Qurilmalar", "Amal qilish muddati", "Amallar"]}
            rows={filtered.map(c => [
              <div>
                <div style={{ fontWeight: 700, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{c.email}</div>
              </div>,
              <StatusPill status={c.subscription_status || "NO_SUB"} />,
              <span style={{ fontWeight: 600 }}>{c.employee_count ?? "—"}</span>,
              <span style={{ fontWeight: 600 }}>{c.device_count ?? "—"}</span>,
              <span style={{ fontSize: 12, color: C.muted }}>{c.subscription_end ? new Date(c.subscription_end).toLocaleDateString("uz-UZ") : "—"}</span>,
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small onClick={() => onView(c)}><Eye size={13} />Ko'rish</Btn>
                {c.subscription_status === "BLOCKED" ? (
                  <Btn small variant="success" onClick={() => onUnblock(c)}><CheckCircle size={13} />Ochish</Btn>
                ) : (
                  <Btn small variant="danger" onClick={() => onBlock(c)}><Ban size={13} />Blok</Btn>
                )}
              </div>
            ])}
          />
        )}
      </Card>
    </div>
  );
}

// ─── Employees Page ───────────────────────────────────────────────────────────

function EmployeesPage({ companies }: { companies: any[] }) {
  const [companyFilter, setCompanyFilter] = useState("");
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Xodimlar (global)</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Barcha kompaniyalardagi xodimlar statistikasi</p>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard title="Jami xodimlar" value={companies.reduce((s, c) => s + (c.employee_count ?? 0), 0)} sub="Barcha kompaniyalarda" icon={<Users size={18} />} color="#4F6BDB" />
        <KPICard title="Faol kompaniyalar" value={companies.filter(c => c.subscription_status === "ACTIVE").length} sub="Xodim qo'sha oladigan" icon={<Building2 size={18} />} color="#10B981" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Input value={companyFilter} onChange={setCompanyFilter} placeholder="Kompaniya bo'yicha qidirish..." style={{ width: 280 }} />
      </div>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["Kompaniya", "Holat", "Xodimlar soni", "Qurilmalar"]}
          rows={companies
            .filter(c => !companyFilter || c.name?.toLowerCase().includes(companyFilter.toLowerCase()))
            .map(c => [
              <div>
                <div style={{ fontWeight: 700, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{c.email}</div>
              </div>,
              <StatusPill status={c.subscription_status || "NO_SUB"} />,
              <span style={{ fontWeight: 700, fontSize: 16, color: C.accent }}>{c.employee_count ?? 0}</span>,
              <span style={{ fontWeight: 600 }}>{c.device_count ?? 0}</span>,
            ])}
        />
      </Card>
    </div>
  );
}

// ─── Devices Page ─────────────────────────────────────────────────────────────

function DevicesPage({ companies }: { companies: any[] }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Qurilmalar (global)</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>IP kameralar va Face ID qurilmalar</p>
      </div>
      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${C.accent}15 0%, ${C.bg} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Camera size={28} color={C.accent} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Face ID — IP Kamera tizimi</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Mobil ilova kamerasi emas — kompaniya serverlaridagi IP kameralar yuzni tahlil qiladi va backend API orqali davomat belgilanadi. Har bir kompaniya o'z qurilmalarini alohida boshqaradi.</div>
          </div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard title="Jami qurilmalar" value={companies.reduce((s, c) => s + (c.device_count ?? 0), 0)} sub="Barcha kompaniyalarda" icon={<Camera size={18} />} color="#4F6BDB" />
        <KPICard title="Kompaniyalar" value={companies.filter(c => (c.device_count ?? 0) > 0).length} sub="Qurilma ulangan" icon={<Building2 size={18} />} color="#10B981" />
      </div>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["Kompaniya", "Holat", "Qurilmalar soni", "Xodimlar"]}
          rows={companies.map(c => [
            <div>
              <div style={{ fontWeight: 700, color: C.text }}>{c.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{c.email}</div>
            </div>,
            <StatusPill status={c.subscription_status || "NO_SUB"} />,
            <span style={{ fontWeight: 700, fontSize: 16, color: (c.device_count ?? 0) > 0 ? "#10B981" : C.muted }}>{c.device_count ?? 0}</span>,
            <span style={{ fontWeight: 600 }}>{c.employee_count ?? 0}</span>,
          ])}
        />
      </Card>
    </div>
  );
}

// ─── Plans Page ───────────────────────────────────────────────────────────────

function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", price_monthly: "", max_employees: "", max_devices: "", trial_days: "14" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await saAPI.getPlans(); setPlans(r.data?.results ?? r.data ?? []); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await saAPI.createPlan({ name: form.name, price_monthly: parseFloat(form.price_monthly), max_employees: parseInt(form.max_employees), max_devices: parseInt(form.max_devices), trial_days: parseInt(form.trial_days) });
      setShowCreate(false); setForm({ name: "", price_monthly: "", max_employees: "", max_devices: "", trial_days: "14" }); load();
    } catch { }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await saAPI.deletePlan(String(id)); load(); } catch { }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Tariflar</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Obuna rejalari va narxlar</p>
        </div>
        <Btn onClick={() => setShowCreate(true)}><Plus size={15} />Yangi tarif</Btn>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {loading ? <div style={{ color: C.muted, padding: 32 }}>Yuklanmoqda...</div> : plans.map(p => (
          <Card key={p.id} style={{ width: 260, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{p.name}</div>
              <button onClick={() => del(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.accent, marginBottom: 4 }}>${p.price_monthly}<span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>/oy</span></div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Trial: {p.trial_days} kun</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["Xodimlar", p.max_employees], ["Qurilmalar", p.max_devices]].map(([k, v]) => (
                <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ fontWeight: 700, color: C.text }}>{v === -1 || v === null ? "Cheksiz" : v}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {showCreate && (
        <Modal title="Yangi tarif yaratish" onClose={() => setShowCreate(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Nomi", key: "name", placeholder: "Masalan: Professional" },
              { label: "Oylik narxi ($)", key: "price_monthly", placeholder: "29.99" },
              { label: "Max xodimlar (-1 = cheksiz)", key: "max_employees", placeholder: "100" },
              { label: "Max qurilmalar (-1 = cheksiz)", key: "max_devices", placeholder: "20" },
              { label: "Trial kunlar", key: "trial_days", placeholder: "14" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>{f.label}</label>
                <Input value={(form as any)[f.key]} onChange={v => setForm(prev => ({ ...prev, [f.key]: v }))} placeholder={f.placeholder} style={{ width: "100%" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={save} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Btn>
              <Btn variant="ghost" onClick={() => setShowCreate(false)}>Bekor qilish</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Payments Page ────────────────────────────────────────────────────────────

function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    saAPI.getPayments().then(r => { setPayments(r.data?.results ?? r.data ?? []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>To'lovlar</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Barcha obuna to'lovlari tarixi</p>
      </div>
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: C.muted }}>Yuklanmoqda...</div>
        ) : (
          <Table
            headers={["Kompaniya", "Tarif", "Summa", "Sana", "Holat"]}
            rows={payments.map(p => [
              <span style={{ fontWeight: 600 }}>{p.company_name ?? p.company}</span>,
              <span>{p.plan_name ?? p.plan}</span>,
              <span style={{ fontWeight: 700, color: "#10B981" }}>${p.amount}</span>,
              <span style={{ fontSize: 12, color: C.muted }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("uz-UZ") : "—"}</span>,
              <StatusPill status={p.status ?? "active"} />,
            ])}
          />
        )}
      </Card>
    </div>
  );
}

// ─── Audit Page ───────────────────────────────────────────────────────────────

function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    saAPI.getAuditLogs().then(r => { setLogs(r.data?.results ?? r.data ?? []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Audit jurnali</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>SuperAdmin barcha amallari tarixi</p>
      </div>
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: C.muted }}>Yuklanmoqda...</div>
        ) : (
          <Table
            headers={["Amal", "Maqsad", "Admin", "Vaqt", "IP"]}
            rows={logs.map(l => [
              <span style={{ fontWeight: 600, color: C.accent }}>{l.action}</span>,
              <span style={{ fontSize: 12 }}>{l.target_type}: {l.target_id}</span>,
              <span style={{ fontSize: 12, color: C.muted }}>{l.admin}</span>,
              <span style={{ fontSize: 12, color: C.muted }}>{l.created_at ? new Date(l.created_at).toLocaleString("uz-UZ") : "—"}</span>,
              <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{l.ip_address ?? "—"}</span>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}

// ─── Company Detail Modal ─────────────────────────────────────────────────────

function CompanyModal({ company, onClose, onRefresh }: { company: any; onClose: () => void; onRefresh: () => void }) {
  const [sub, setSub] = useState<SubTab>("info");
  const [details, setDetails] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [autoRenew, setAutoRenew] = useState(company.auto_renew ?? false);
  const [saving, setSaving] = useState(false);
  const [priceDays, setPriceDays] = useState("30");

  useEffect(() => {
    saAPI.getCompany(company.id).then(r => setDetails(r.data)).catch(() => {});
    saAPI.getPlans().then(r => setPlans(r.data?.results ?? r.data ?? [])).catch(() => {});
    saAPI.getCompanyAttendanceStats(String(company.id)).then(r => setStats(r.data)).catch(() => {});
  }, [company.id]);

  useEffect(() => {
    if (sub === "employees") saAPI.getCompanyEmployees(String(company.id)).then(r => setEmployees(r.data?.results ?? r.data ?? [])).catch(() => {});
    if (sub === "devices") saAPI.getCompanyDevices(String(company.id)).then(r => setDevices(r.data?.results ?? r.data ?? [])).catch(() => {});
    if (sub === "roles") saAPI.getCompanyRoles(String(company.id)).then(r => setRoles(r.data?.results ?? r.data ?? [])).catch(() => {});
  }, [sub, company.id]);

  const doBlock = async () => {
    if (!confirm(`"${company.name}"ni bloklashni tasdiqlaysizmi?`)) return;
    try { await saAPI.blockCompany(company.id); onRefresh(); onClose(); } catch { }
  };
  const doUnblock = async () => {
    try { await saAPI.unblockCompany(company.id); onRefresh(); onClose(); } catch { }
  };
  const doAssignPlan = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    try { await saAPI.assignPlan(company.id, { plan_id: parseInt(selectedPlan), days: parseInt(priceDays) }); onRefresh(); } catch { }
    setSaving(false);
  };
  const doToggleAutoRenew = async () => {
    try { await saAPI.toggleAutoRenew(String(company.id)); setAutoRenew((v: boolean) => !v); } catch { }
  };

  const TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "Ma'lumot", icon: <Building2 size={14} /> },
    { key: "plan", label: "Tarif", icon: <Crown size={14} /> },
    { key: "payment", label: "To'lov", icon: <CreditCard size={14} /> },
    { key: "employees", label: "Xodimlar", icon: <Users size={14} /> },
    { key: "devices", label: "Qurilmalar", icon: <Camera size={14} /> },
    { key: "roles", label: "Rollar", icon: <Shield size={14} /> },
    { key: "history", label: "Tarix", icon: <Activity size={14} /> },
    { key: "notes", label: "Eslatmalar", icon: <FileText size={14} /> },
  ];

  return (
    <Modal title={company.name} onClose={onClose} wide>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setSub(t.key)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: sub === t.key ? C.accent : "transparent", color: sub === t.key ? "#fff" : C.muted, fontWeight: sub === t.key ? 700 : 500, fontSize: 13 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {sub === "info" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              ["Nomi", company.name], ["Email", company.email], ["Telefon", company.phone ?? "—"],
              ["Holat", null], ["Xodimlar", company.employee_count ?? "—"], ["Qurilmalar", company.device_count ?? "—"],
            ].map(([k, v], i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{k}</div>
                {k === "Holat" ? <StatusPill status={company.subscription_status || "NO_SUB"} /> : <div style={{ fontWeight: 600, fontSize: 14 }}>{String(v)}</div>}
              </div>
            ))}
          </div>

          {/* Attendance stats */}
          {stats && (
            <div style={{ background: C.bg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12 }}>Davomat statistikasi</div>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Bugun", value: stats.today_total ?? 0, color: C.accent },
                  { label: "Kech kelganlar", value: stats.today_late ?? 0, color: "#F59E0B" },
                  { label: "Shu oy", value: stats.month_total ?? 0, color: "#10B981" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-renew toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Avtomatik yangilash</div>
              <div style={{ fontSize: 12, color: C.muted }}>Obuna muddati tugaganda avtomatik uzaytirish</div>
            </div>
            <button onClick={doToggleAutoRenew} style={{ background: "none", border: "none", cursor: "pointer", color: autoRenew ? "#10B981" : C.muted }}>
              {autoRenew ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Block/unblock */}
          <div style={{ display: "flex", gap: 10 }}>
            {company.subscription_status === "BLOCKED"
              ? <Btn variant="success" onClick={doUnblock}><CheckCircle size={15} />Blokdan chiqarish</Btn>
              : <Btn variant="danger" onClick={doBlock}><Ban size={15} />Bloklash</Btn>}
          </div>
        </div>
      )}

      {/* Plan tab */}
      {sub === "plan" && (
        <div>
          <div style={{ background: C.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>Joriy tarif</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{company.current_plan ?? "Tarif yo'q"}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Muddat: {company.subscription_end ? new Date(company.subscription_end).toLocaleDateString("uz-UZ") : "—"}
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Yangi tarif belgilash</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Tarif</label>
              <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, minWidth: 180 }}>
                <option value="">Tanlang...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price_monthly}/oy)</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Kunlar</label>
              <Input value={priceDays} onChange={setPriceDays} placeholder="30" style={{ width: 80 }} />
            </div>
            <Btn onClick={doAssignPlan} disabled={saving || !selectedPlan}>{saving ? "..." : "Belgilash"}</Btn>
          </div>
        </div>
      )}

      {/* Payment tab */}
      {sub === "payment" && (
        <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>
          <CreditCard size={32} style={{ marginBottom: 8 }} />
          <div>To'lovlar tarixi bu yerda ko'rinadi (API mavjud bo'lganda)</div>
        </div>
      )}

      {/* Employees tab */}
      {sub === "employees" && (
        <Table
          headers={["Ism", "Lavozim", "Email", "Holat"]}
          rows={employees.map(e => [
            <span style={{ fontWeight: 600 }}>{e.full_name ?? `${e.first_name} ${e.last_name}`}</span>,
            <span style={{ fontSize: 12, color: C.muted }}>{e.position ?? e.role ?? "—"}</span>,
            <span style={{ fontSize: 12 }}>{e.email}</span>,
            <StatusPill status={e.is_active ? "active" : "inactive"} />,
          ])}
        />
      )}

      {/* Devices tab */}
      {sub === "devices" && (
        <Table
          headers={["Qurilma nomi", "IP manzil", "Tur", "Holat"]}
          rows={devices.map(d => [
            <span style={{ fontWeight: 600 }}>{d.name}</span>,
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>{d.ip_address ?? "—"}</span>,
            <span style={{ fontSize: 12, color: C.muted }}>{d.device_type ?? "IP Camera"}</span>,
            <StatusPill status={d.is_active ? "online" : "offline"} />,
          ])}
        />
      )}

      {/* Roles tab */}
      {sub === "roles" && (
        <Table
          headers={["Rol nomi", "Ruxsatlar soni", "Xodimlar"]}
          rows={roles.map(r => [
            <span style={{ fontWeight: 600 }}>{r.name}</span>,
            <span style={{ color: C.accent, fontWeight: 700 }}>{r.permissions?.length ?? 0}</span>,
            <span>{r.employee_count ?? "—"}</span>,
          ])}
        />
      )}

      {/* History tab */}
      {sub === "history" && (
        <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>
          <Activity size={32} style={{ marginBottom: 8 }} />
          <div>Kompaniya amallar tarixi (audit log filtrlanadi)</div>
        </div>
      )}

      {/* Notes tab */}
      {sub === "notes" && (
        <div>
          <textarea placeholder="Bu kompaniya haqida eslatmalar yozing..." rows={8}
            style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
          <Btn style={{ marginTop: 12 }}>Saqlash</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function SADashboardPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState<NavPage>("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Check auth on mount — redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("sa_access_token") || localStorage.getItem("sa_token");
    if (!token) {
      navigate("/sa/login");
    }
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.allSettled([saAPI.getCompanies(), saAPI.getStats()]);
      if (cRes.status === "fulfilled") setCompanies(cRes.value.data?.results ?? cRes.value.data ?? []);
      if (sRes.status === "fulfilled") setStats(sRes.value.data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const doLogout = () => {
    localStorage.removeItem("sa_access_token");
    localStorage.removeItem("sa_token");
    navigate("/sa/login");
  };

  const doBlock = async (c: any) => {
    if (!confirm(`"${c.name}"ni bloklashni tasdiqlaysizmi?`)) return;
    try { await saAPI.blockCompany(c.id); loadData(); } catch { }
  };

  const doUnblock = async (c: any) => {
    try { await saAPI.unblockCompany(c.id); loadData(); } catch { }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar page={page} onPage={setPage} onLogout={doLogout} />

      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Top bar */}
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontSize: 13, color: C.muted }}>{new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>SuperAdmin</div>
              <div style={{ fontSize: 11, color: C.muted }}>worktrack.admin</div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: 28 }}>
          {page === "dashboard" && <DashboardHome stats={stats} companies={companies} onViewCompany={c => setSelectedCompany(c)} />}
          {page === "companies" && <CompaniesPage companies={companies} loading={loading} onRefresh={loadData} onView={c => setSelectedCompany(c)} onBlock={doBlock} onUnblock={doUnblock} />}
          {page === "employees" && <EmployeesPage companies={companies} />}
          {page === "devices" && <DevicesPage companies={companies} />}
          {page === "plans" && <PlansPage />}
          {page === "payments" && <PaymentsPage />}
          {page === "audit" && <AuditPage />}
        </div>
      </div>

      {selectedCompany && (
        <CompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} onRefresh={loadData} />
      )}
    </div>
  );
}
