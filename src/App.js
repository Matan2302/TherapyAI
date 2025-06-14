import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import RegistrationPage from "./components/RegistrationPage";
import LoginPage from "./components/LoginPage";
import RecordingPage from "./components/RecordingPage";
import PatientDashboard from "./components/PatientDashboard";
import PatientForm from "./components/PatientForm";
import AdminDashboard from "./components/AdminDashboard";
import { TherapistProvider } from "./TherapistContext";
import Header, { LanguageSwitcher } from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import logo from "./assets/background_spanishHouseLogo.png"; // ✅ לוגו
import "./i18n";

const App = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <TherapistProvider>
      <Router>
        <div
          className="app-container"
          style={{
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            minHeight: "100vh",
            position: "relative", // חשוב ללוגו
          }}
        >
          <Header />

          {/* ✅ לוגו בפינה שמאלית עליונה */}
          <img
            src={logo}
            alt="Logo"
            className="top-left-logo"
          />

          {/* Show LanguageSwitcher only if Header is NOT displayed (not authenticated) */}
          {!isAuthenticated && (
            <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
              <LanguageSwitcher />
            </div>
          )}

          <div className="content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <LoginPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recording"
                element={
                  <ProtectedRoute>
                    <RecordingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/PatientForm-form"
                element={
                  <ProtectedRoute>
                    <PatientForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </TherapistProvider>
  );
};

// ✅ דף הבית
const HomePage = () => (
  <div className="home-page">
    <div className="glass-card center-card">
      <h1 className="hero-title">Welcome to TherapyAI</h1>
      <p className="hero-subtitle">Manage your sessions with ease and help patients efficiently.</p>
    </div>
  </div>
);

export default App;
