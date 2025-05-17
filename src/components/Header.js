import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const therapistName = localStorage.getItem("therapist_name");
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

  const getRandomColor = () => {
    const colors = ["#4CAF50", "#2196F3", "#FF5722", "#9C27B0", "#3F51B5", "#00BCD4", "#FF9800"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
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
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/recording" className="nav-link">Recording</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/PatientForm-form" className="nav-link">Add Patient</Link>
        </div>

        <div className="profile-container" ref={dropdownRef}>
          <div
            className="profile-icon"
            style={{ backgroundColor: getRandomColor() }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {getInitials(therapistName)}
          </div>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <p>Hello, {therapistName}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Header;
