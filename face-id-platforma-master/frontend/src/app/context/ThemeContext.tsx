import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    accent: string;
    teal: string;
    cardBg: string;
  };
}

const lightColors = {
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E8EAF0',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#9CA3AF',
  primary: '#1A237E',
  accent: '#3949AB',
  teal: '#00897B',
  cardBg: '#FFFFFF',
};

const darkColors = {
  bg: '#0F1117',
  surface: '#1A1D2E',
  border: '#2D3148',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  primary: '#5C6BC0',
  accent: '#7986CB',
  teal: '#26A69A',
  cardBg: '#1A1D2E',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
  colors: lightColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Tailwind dark: variant needs .dark class on <html>
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
