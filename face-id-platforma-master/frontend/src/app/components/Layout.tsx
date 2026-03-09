import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, Activity, ClipboardList, Users, Camera, BarChart3,
  Settings, ChevronLeft, ChevronRight, Bell, Search, LogOut,
  CalendarDays, Banknote, UserCog, Sun, Moon,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useLanguage, Lang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { lang, setLang, t } = useLanguage();
  const { isDark, colors, toggleTheme } = useTheme();

  const NAV_ITEMS = [
    { to: "/app/dashboard", icon: LayoutDashboard, label: t('dashboard') },
    { to: "/app/monitoring", icon: Activity, label: t('monitoring') },
    { to: "/app/attendance", icon: ClipboardList, label: t('attendance') },
    { to: "/app/employees", icon: Users, label: t('employees') },
    { to: "/app/leaves", icon: CalendarDays, label: t('leaves') },
    { to: "/app/payroll", icon: Banknote, label: t('payroll') },
    { to: "/app/cameras", icon: Camera, label: t('devices') },
    { to: "/app/team", icon: UserCog, label: t('team') },
    { to: "/app/reports", icon: BarChart3, label: t('reports') },
    { to: "/app/settings", icon: Settings, label: t('settings') },
  ];

  const LANG_FLAGS: Record<Lang, string> = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' };
  const LANG_LABELS: Record<Lang, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userFullName = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.phone || "User";
  const userRole = user?.role?.name || user?.system_role || "Employee";
  const userPhoto = user?.photo || "";
  const companyName = user?.company?.name || "WorkTrack Pro";

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: colors.bg, fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden", position: "relative", zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "20px 16px" : "20px 20px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", gap: 10, minHeight: 64,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.teal} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Activity size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.primary, lineHeight: 1.2 }}>WorkTrack</div>
              <div style={{ fontSize: 10, color: colors.teal, fontWeight: 600, letterSpacing: "0.05em" }}>PRO</div>
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
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, textDecoration: "none",
                color: isActive ? colors.primary : colors.textMuted,
                backgroundColor: isActive ? (isDark ? `${colors.primary}22` : "#EEF0FB") : "transparent",
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden",
                justifyContent: collapsed ? "center" : "flex-start",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? colors.primary : colors.textMuted} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info at bottom */}
        {!collapsed && (
          <div style={{
            padding: "14px 16px", borderTop: `1px solid ${colors.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <UserAvatar src={userPhoto} name={userFullName} size={32} online />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userFullName}</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{userRole}</div>
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: colors.textMuted }} title={t('logout')}>
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: "absolute", right: -12, top: 20, width: 24, height: 24,
          borderRadius: "50%", backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`, display: "flex",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)", zIndex: 20,
        }}>
          {collapsed ? <ChevronRight size={12} color={colors.textMuted} /> : <ChevronLeft size={12} color={colors.textMuted} />}
        </button>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Top Header */}
        <header style={{
          height: 64, backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0,
        }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, maxWidth: 360 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: 8, padding: "8px 12px", flex: 1,
            }}>
              <Search size={15} color={colors.textMuted} />
              <input
                placeholder={t('search')}
                style={{ border: "none", background: "none", outline: "none", fontSize: 13, color: colors.text, width: "100%" }}
              />
            </div>
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>{companyName}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              title={isDark ? t('light') : t('dark')}
            >
              {isDark ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color={colors.textMuted} />}
            </button>

            {/* Language switcher */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  height: 36, padding: "0 10px", borderRadius: 8,
                  backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                  display: "flex", alignItems: "center", gap: 4,
                  cursor: "pointer", fontSize: 12, fontWeight: 600, color: colors.textSecondary,
                }}
              >
                <span>{LANG_FLAGS[lang]}</span>
                <span>{LANG_LABELS[lang]}</span>
              </button>
              {langOpen && (
                <div style={{
                  position: "absolute", top: 44, right: 0, backgroundColor: colors.surface,
                  borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  border: `1px solid ${colors.border}`, zIndex: 100, overflow: "hidden",
                }}>
                  {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 16px", width: "100%", border: "none",
                        backgroundColor: lang === l ? (isDark ? `${colors.primary}33` : "#EEF0FB") : colors.surface,
                        color: lang === l ? colors.primary : colors.textSecondary,
                        fontSize: 13, fontWeight: lang === l ? 600 : 400, cursor: "pointer",
                      }}
                    >
                      <span>{LANG_FLAGS[l]}</span>
                      <span>{LANG_LABELS[l]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", position: "relative",
                }}
              >
                <Bell size={17} color={colors.textMuted} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: 6, right: 6, width: 7, height: 7,
                    borderRadius: "50%", backgroundColor: "#D50000", border: "1.5px solid " + colors.surface,
                  }} />
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: "absolute", top: 44, right: 0, width: 320,
                  backgroundColor: colors.surface, borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)", border: `1px solid ${colors.border}`,
                  zIndex: 100, padding: 8,
                }}>
                  <div style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: colors.text, borderBottom: `1px solid ${colors.border}`, marginBottom: 4 }}>
                    {t('notifications')}
                  </div>
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>
                        {t('noNotifications')}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markAsRead(n.id)}
                          style={{
                            padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                            display: "flex", gap: 10,
                            opacity: n.is_read ? 0.6 : 1,
                            backgroundColor: n.is_read ? "transparent" : (isDark ? `${colors.primary}22` : "#F0F2F9"),
                          }}
                        >
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            backgroundColor: n.type === 'error' ? "#D50000" : n.type === 'warning' ? "#FF6D00" : colors.teal,
                            marginTop: 6, flexShrink: 0,
                          }} />
                          <div>
                            <div style={{ fontSize: 12, color: colors.text, fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{n.message}</div>
                            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
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
        <main style={{ flex: 1, overflow: "auto", padding: 24, backgroundColor: colors.bg }}>
          <Outlet />
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(notifOpen || langOpen) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }}
          onClick={() => { setNotifOpen(false); setLangOpen(false); }}
        />
      )}
    </div>
  );
}
