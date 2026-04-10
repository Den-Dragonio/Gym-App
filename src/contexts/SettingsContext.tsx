import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/config';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark' | 'system';
export type MeasurementSystem = 'metric' | 'imperial';
export type Language = 'en' | 'ru';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  system: MeasurementSystem;
  setSystem: (system: MeasurementSystem) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });
  
  const [system, setSystem] = useState<MeasurementSystem>(() => {
    return (localStorage.getItem('system') as MeasurementSystem) || 'metric';
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ru';
  });

  // Sync settings from current user profile when it loads
  useEffect(() => {
    if (currentUser) {
      if (currentUser.theme) setTheme(currentUser.theme as Theme);
      if (currentUser.measurementSystem) setSystem(currentUser.measurementSystem as MeasurementSystem);
      if (currentUser.language) setLanguage(currentUser.language as Language);
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

    // If system theme is selected, listen for OS changes
    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('system', system);
  }, [system]);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, system, setSystem, language, setLanguage }}>
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
