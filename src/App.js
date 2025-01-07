import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RegistrationPage from "./components/RegistrationPage";
import LoginPage from "./components/LoginPage";
import RecordingPage from "./components/RecordingPage";

const App = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="navbar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/register" className="nav-link">Register</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/recording" className="nav-link">Recording</Link>
        </nav>

        {/* Page Content */}
        <div className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recording" element={<RecordingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

// Home Page Component
const HomePage = () => (
  <div>
    <h2>Welcome to TherapyAI</h2>
    <p>Manage your sessions with ease and help patients efficiently.</p>
  </div>
);

export default App;
