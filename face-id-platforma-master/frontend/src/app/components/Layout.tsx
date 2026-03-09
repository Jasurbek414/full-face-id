import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, Activity, ClipboardList, Users, Camera, BarChart3,
  Settings, ChevronLeft, ChevronRight, Bell, Search, LogOut,
  CalendarDays, Banknote, UserCog, Sun, Moon, Languages,
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
  const { isDark, toggleTheme } = useTheme();

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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans overflow-hidden">
      {/* Sidebar Container - with relative positioning to allow the toggle button to overflow */}
      <aside 
        className={`relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50
          ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 h-16 px-4 border-b border-slate-100 dark:border-slate-800 shrink-0
          ${collapsed ? "justify-center" : "justify-start"}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
            <Activity size={22} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">WorkTrack</div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-black tracking-[0.2em] mt-0.5">PRO</div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                ${isActive 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"}
                ${collapsed ? "justify-center" : "justify-start"}
              `}
            >
              <Icon size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && (
                <span className="text-sm truncate animate-in fade-in slide-in-from-left-1 duration-200">
                  {label}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-bold">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile section at the bottom */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50
          ${collapsed ? "flex justify-center" : ""}`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <UserAvatar src={userPhoto} name={userFullName} size={40} online />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{userFullName}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{userRole}</div>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-colors shrink-0 outline-none border-none bg-transparent cursor-pointer"
                title={t('logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-colors outline-none border-none bg-transparent cursor-pointer"
              title={t('logout')}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>

        {/* Sidebar Collapse Toggle - Positioned so it sits ON the border, and NOT clipped by overflow:hidden on nav */}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="absolute -right-3.5 top-20 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 shadow-sm transition-all z-[60] group cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          )}
        </button>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Main Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-40 transition-colors duration-300">
          {/* Logo/Title for Mobile or collapsed state would go here if needed */}
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                placeholder={t('search')}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>

          <div className="hidden md:block px-4">
            <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">{companyName}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme & Language Switchers Wrap */}
            <div className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all outline-none border-none bg-transparent cursor-pointer
                  ${isDark ? "text-amber-400 hover:bg-slate-800" : "text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm"}`}
                title={isDark ? t('light') : t('dark')}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className={`flex items-center gap-2 h-9 px-3 rounded-xl transition-all outline-none border-none bg-transparent cursor-pointer
                    ${langOpen ? "bg-white dark:bg-slate-800 shadow-sm" : "hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-600 dark:text-slate-400 font-bold text-xs"}`}
                >
                  <Languages size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold uppercase">{LANG_LABELS[lang]}</span>
                </button>
                
                {langOpen && (
                  <div className="absolute top-12 right-0 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200">
                    {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl border-none text-left cursor-pointer transition-all
                          ${lang === l 
                            ? "bg-indigo-600 text-white font-bold" 
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Languages size={14} className={lang === l ? "text-white" : "text-indigo-400"} />
                          <span className="text-sm">{LANG_LABELS[l]}</span>
                        </div>
                        {lang === l && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notification & Avatar Center */}
            <div className="flex items-center gap-3 ml-2 pl-2 md:ml-4 md:pl-4 border-l border-slate-200 dark:border-slate-800">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/50 transition-all group outline-none cursor-pointer"
                >
                  <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                  )}
                </button>
                
                {notifOpen && (
                  <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{t('notifications')}</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">
                          {unreadCount} yangi
                        </span>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center opacity-40">
                          <Bell size={40} className="text-slate-300 mb-2" />
                          <p className="text-xs font-semibold">{t('noNotifications')}</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.is_read && markAsRead(n.id)}
                            className={`flex gap-3 p-3 rounded-2xl cursor-pointer transition-all mb-1
                              ${n.is_read ? "opacity-60 grayscale hover:grayscale-0" : "bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none"}
                            `}
                          >
                            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center
                              ${n.type === 'error' ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" : 
                                n.type === 'warning' ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" : 
                                "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"}
                            `}>
                              {n.type === 'error' ? <LogOut size={14} /> : n.type === 'warning' ? <Settings size={14} /> : <Activity size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-medium flex items-center gap-1">
                                <Activity size={10} />
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="cursor-pointer group">
                <UserAvatar src={userPhoto} name={userFullName} size={40} online />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Overlays for dropdowns */}
      {(notifOpen || langOpen) && (
        <div 
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => { setNotifOpen(false); setLangOpen(false); }}
        />
      )}

      {/* Modern styles for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
}
