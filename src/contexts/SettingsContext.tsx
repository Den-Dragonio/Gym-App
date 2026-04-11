import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/config';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark' | 'system';
export type Accent = 'blue' | 'green' | 'purple';
export type MeasurementSystem = 'metric' | 'imperial';
export type Language = 'en' | 'ru';
export type DateFormat = 'dd/mm/yyyy' | 'mm/dd/yyyy';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  system: MeasurementSystem;
  setSystem: (system: MeasurementSystem) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  dateFormat: DateFormat;
  setDateFormat: (df: DateFormat) => void;
  formatDate: (dateStr: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [accent, setAccent] = useState<Accent>(() => {
    return (localStorage.getItem('accent') as Accent) || 'blue';
  });
  
  const [system, setSystem] = useState<MeasurementSystem>(() => {
    return (localStorage.getItem('system') as MeasurementSystem) || 'metric';
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ru';
  });

  const [dateFormat, setDateFormat] = useState<DateFormat>(() => {
    return (localStorage.getItem('dateFormat') as DateFormat) || 'dd/mm/yyyy';
  });

  // Sync settings from current user profile when it loads
  useEffect(() => {
    if (currentUser) {
      if (currentUser.theme) setTheme(currentUser.theme as Theme);
      if (currentUser.accent) setAccent(currentUser.accent as Accent);
      if (currentUser.measurementSystem) setSystem(currentUser.measurementSystem as MeasurementSystem);
      if (currentUser.language) setLanguage(currentUser.language as Language);
      if (currentUser.dateFormat) setDateFormat(currentUser.dateFormat as DateFormat);
    }
  }, [currentUser]);

  useEffect(() => {
    const applyTheme = (t: Theme) => {
        let actualTheme = t;
        if (t === 'system') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', actualTheme);
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('accent', accent);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('system', system);
  }, [system]);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('dateFormat', dateFormat);
  }, [dateFormat]);

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      if (dateFormat === 'mm/dd/yyyy') {
        return `${month}/${day}/${year}`;
      }
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, accent, setAccent, system, setSystem, language, setLanguage, dateFormat, setDateFormat, formatDate }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
