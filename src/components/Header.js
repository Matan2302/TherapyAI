import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button
        className="language-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        🌐 Language
      </button>
      {isOpen && (
        <div className="language-dropdown-content">
          <button onClick={() => { i18n.changeLanguage("en"); setIsOpen(false); }}>English</button>
          <button onClick={() => { i18n.changeLanguage("he"); setIsOpen(false); }}>עברית</button>
          <button onClick={() => { i18n.changeLanguage("ar"); setIsOpen(false); }}>العربية</button>
          <button onClick={() => { i18n.changeLanguage("ru"); setIsOpen(false); }}>Русский</button>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { t } = useTranslation("header");
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("access_token");
  const therapistName = localStorage.getItem("therapist_name");
  const isAdmin = therapistName === "Admin";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("therapist_id");
    localStorage.removeItem("therapist_name");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="header">
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/home" className="nav-link">{t("home_link")}</Link>
          <Link to="/recording" className="nav-link">{t("recording_link")}</Link>
          <Link to="/dashboard" className="nav-link">{t("dashboard_link")}</Link>
          <Link to="/PatientForm-form" className="nav-link">{t("add_patient_link")}</Link>
          {isAdmin && (
            <Link to="/admin-dashboard" className="nav-link">{t("admin_dashboard_link")}</Link>
          )}
        </div>
        <LanguageSwitcher />
        <div className="profile-container" ref={dropdownRef}>
          <div
            className="profile-icon"
            style={{ backgroundColor: "#ADD8E6" }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {getInitials(therapistName)}
          </div>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <p>{t("greeting")} {therapistName}</p>
              <button onClick={handleLogout}>{t("logout_button")}</button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export { LanguageSwitcher };
export default Header;
