import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  Users,
  Camera,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  CalendarDays,
  Banknote,
  UserCog,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";

const NAV_ITEMS = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/monitoring", icon: Activity, label: "Jonli kuzatuv" },
  { to: "/app/attendance", icon: ClipboardList, label: "Davomat" },
  { to: "/app/employees", icon: Users, label: "Xodimlar" },
  { to: "/app/leaves", icon: CalendarDays, label: "Ta'tillar" },
  { to: "/app/payroll", icon: Banknote, label: "Maosh" },
  { to: "/app/cameras", icon: Camera, label: "Qurilmalar" },
  { to: "/app/team", icon: UserCog, label: "Jamoa" },
  { to: "/app/reports", icon: BarChart3, label: "Hisobotlar" },
  { to: "/app/settings", icon: Settings, label: "Sozlamalar" },
];

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
  bg: "#F5F7FA",
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userFullName = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.phone || "User";
  const userRole = user?.role?.name || user?.system_role || "Employee";
  const userPhoto = user?.photo || "";
  const companyName = user?.company?.name || "WorkTrack Pro";

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: BRAND.bg, fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
          backgroundColor: "#fff",
          borderRight: "1px solid #E8EAF0",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease, min-width 0.2s ease",
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "20px 16px" : "20px 20px",
            borderBottom: "1px solid #E8EAF0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 64,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.teal} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Activity size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.primary, lineHeight: 1.2 }}>WorkTrack</div>
              <div style={{ fontSize: 10, color: BRAND.teal, fontWeight: 600, letterSpacing: "0.05em" }}>PRO</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 12px" : "10px 12px",
                borderRadius: 8,
                textDecoration: "none",
                color: isActive ? BRAND.primary : "#6B7280",
                backgroundColor: isActive ? "#EEF0FB" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                justifyContent: collapsed ? "center" : "flex-start",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? BRAND.primary : "#9CA3AF"} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}

        </nav>

        {/* User Info at bottom */}
        {!collapsed && (
          <div
            style={{
              padding: "14px 16px",
              borderTop: "1px solid #E8EAF0",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <UserAvatar src={userPhoto} name={userFullName} size={32} online />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userFullName}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{userRole}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#9CA3AF" }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: "absolute",
            right: -12,
            top: 20,
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "#fff",
            border: "1px solid #E8EAF0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            zIndex: 20,
          }}
        >
          {collapsed ? <ChevronRight size={12} color="#6B7280" /> : <ChevronLeft size={12} color="#6B7280" />}
        </button>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Top Header */}
        <header
          style={{
            height: 64,
            backgroundColor: "#fff",
            borderBottom: "1px solid #E8EAF0",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, maxWidth: 360 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: BRAND.bg,
                border: "1px solid #E8EAF0",
                borderRadius: 8,
                padding: "8px 12px",
                flex: 1,
              }}
            >
              <Search size={15} color="#9CA3AF" />
              <input
                placeholder="Search employees, records..."
                style={{
                  border: "none",
                  background: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#374151",
                  width: "100%",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{companyName}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: BRAND.bg,
                  border: "1px solid #E8EAF0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <Bell size={17} color="#6B7280" />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "#D50000",
                      border: "1.5px solid #fff",
                    }}
                  />
                )}
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    width: 320,
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    border: "1px solid #E8EAF0",
                    zIndex: 100,
                    padding: 8,
                  }}
                >
                  <div style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#111827", borderBottom: "1px solid #E8EAF0", marginBottom: 4 }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markAsRead(n.id)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            gap: 10,
                            opacity: n.is_read ? 0.6 : 1,
                            backgroundColor: n.is_read ? "transparent" : "#F0F2F9"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.bg)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = n.is_read ? "transparent" : "#F0F2F9")}
                        >
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: n.type === 'error' ? "#D50000" : n.type === 'warning' ? "#FF6D00" : BRAND.teal,
                            marginTop: 6,
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{ fontSize: 12, color: "#374151", fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{n.message}</div>
                            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                              {new Date(n.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <UserAvatar src={userPhoto} name={userFullName} size={36} online />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <Outlet />
        </main>
      </div>

      {/* Click outside to close notif */}
      {notifOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 90 }}
          onClick={() => setNotifOpen(false)}
        />
      )}
    </div>
  );
}
