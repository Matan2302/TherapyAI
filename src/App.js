import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RegistrationPage from "./components/RegistrationPage";
import LoginPage from "./components/LoginPage";
import RecordingPage from "./components/RecordingPage";
import PatientDashboard from "./components/PatientDashboard";
import TherapistForm from "./components/TherapistForm";
import { TherapistProvider } from "./TherapistContext"; // Import the provider
import Header from "./components/Header"; // Import the Header component

const App = () => {
  return (
    <TherapistProvider>
      <Router>
        <div className="app-container">
          {/* Header (Therapist's name) */}
          <Header />

          {/* Navigation Bar */}
          <nav className="navbar">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/register" className="nav-link">Register</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/recording" className="nav-link">Recording</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/therapist-form" className="nav-link">Add Therapist</Link>
          </nav>

          {/* Page Content */}
          <div className="content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/recording" element={<RecordingPage />} />
              <Route path="/dashboard" element={<PatientDashboard />} />
              <Route path="/therapist-form" element={<TherapistForm />} />
            </Routes>
          </div>
        </div>
      </Router>
    </TherapistProvider>
  );
};

// Home Page Component
const HomePage = () => (
  <div className="home-page">
    <div className="hero-content">
      <h1>Welcome to TherapyAI</h1>
      <p>Manage your sessions with ease and help patients efficiently.</p>
    </div>
  </div>
);




export default App;

