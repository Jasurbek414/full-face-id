import React, { createContext, useContext, useState } from 'react';

export type Lang = 'uz' | 'ru' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  uz: {
    dashboard: "Dashboard",
    monitoring: "Jonli kuzatuv",
    attendance: "Davomat",
    employees: "Xodimlar",
    leaves: "Ta'tillar",
    payroll: "Maosh",
    devices: "Qurilmalar",
    team: "Jamoa",
    reports: "Hisobotlar",
    settings: "Sozlamalar",
    notifications: "Bildirishnomalar",
    logout: "Chiqish",
    search: "Qidirish...",
    presentToday: "Bugun kelganlar",
    lateArrivals: "Kechikganlar",
    absent: "Kelmaganlar",
    totalHours: "Jami soatlar",
    profile: "Profil",
    language: "Til",
    theme: "Mavzu",
    light: "Yorug'",
    dark: "Tungi",
    save: "Saqlash",
    saving: "Saqlanmoqda...",
    saved: "Saqlandi!",
    company: "Kompaniya",
    schedule: "Ish jadvali",
    security: "Xavfsizlik",
    noData: "Ma'lumot yo'q",
    noNotifications: "Bildirishnoma yo'q",
    viewAll: "Barchasini ko'rish",
  },
  ru: {
    dashboard: "Дашборд",
    monitoring: "Мониторинг",
    attendance: "Посещаемость",
    employees: "Сотрудники",
    leaves: "Отпуска",
    payroll: "Зарплата",
    devices: "Устройства",
    team: "Команда",
    reports: "Отчёты",
    settings: "Настройки",
    notifications: "Уведомления",
    logout: "Выход",
    search: "Поиск...",
    presentToday: "Присутствуют",
    lateArrivals: "Опоздания",
    absent: "Отсутствуют",
    totalHours: "Всего часов",
    profile: "Профиль",
    language: "Язык",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    save: "Сохранить",
    saving: "Сохранение...",
    saved: "Сохранено!",
    company: "Компания",
    schedule: "Расписание",
    security: "Безопасность",
    noData: "Нет данных",
    noNotifications: "Нет уведомлений",
    viewAll: "Смотреть всё",
  },
  en: {
    dashboard: "Dashboard",
    monitoring: "Live Monitoring",
    attendance: "Attendance",
    employees: "Employees",
    leaves: "Leaves",
    payroll: "Payroll",
    devices: "Devices",
    team: "Team",
    reports: "Reports",
    settings: "Settings",
    notifications: "Notifications",
    logout: "Logout",
    search: "Search...",
    presentToday: "Present Today",
    lateArrivals: "Late Arrivals",
    absent: "Absent",
    totalHours: "Total Hours",
    profile: "Profile",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    save: "Save",
    saving: "Saving...",
    saved: "Saved!",
    company: "Company",
    schedule: "Schedule",
    security: "Security",
    noData: "No data available",
    noNotifications: "No notifications",
    viewAll: "View all",
  },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'uz',
  setLang: () => {},
  t: (k) => k,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'uz';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);
  };

  const t = (key: string): string => translations[lang][key] || translations['en'][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
