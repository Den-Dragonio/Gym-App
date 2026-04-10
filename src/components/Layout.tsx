import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { Home, Dumbbell, Users, User, Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Layout.css';

export const Layout: React.FC = () => {
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { t } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const nextLang = language === 'ru' ? 'en' : 'ru';
    setLanguage(nextLang);
  };

  return (
    <div className="layout-container">
      <header className="top-header glass">
        <Link to="/" className="header-logo">
          <Dumbbell className="logo-icon" />
          <span className="logo-text">GymTracker</span>
        </Link>
        <div className="header-actions">
          <button className="icon-btn" onClick={toggleLanguage} title={t("language")}>
            <Globe size={20} />
            <span className="lang-text">{language.toUpperCase()}</span>
          </button>
          <button className="icon-btn" onClick={toggleTheme} title={t("theme")}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar glass">
          <nav className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Home size={24} />
              <span>{t("dashboard")}</span>
            </NavLink>
            <NavLink to="/workouts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Dumbbell size={24} />
              <span>{t("workouts")}</span>
            </NavLink>
            <NavLink to="/social" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={24} />
              <span>{t("social")}</span>
            </NavLink>
            <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <User size={24} />
              <span>{t("profile")}</span>
            </NavLink>
          </nav>
        </aside>

        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav for mobile */}
      <nav className="bottom-nav glass">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Home size={24} />
        </NavLink>
        <NavLink to="/workouts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Dumbbell size={24} />
        </NavLink>
        <NavLink to="/social" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={24} />
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <User size={24} />
        </NavLink>
      </nav>
    </div>
  );
};
