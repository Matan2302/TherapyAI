import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("therapist_id");
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="header">
      <nav className="navbar">
        <Link to="/home" className="nav-link">Home</Link>
        <Link to="/recording" className="nav-link">Recording</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/PatientForm-form" className="nav-link">Add Patient</Link>
        <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
      </nav>
    </div>
  );
};

export default Header;
