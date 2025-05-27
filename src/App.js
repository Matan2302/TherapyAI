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
import { TherapistProvider } from "./TherapistContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import logo from "./assets/background_spanishHouseLogo.png"; // ✅ logo imported here
import "./i18n";
import { useTranslation } from "react-i18next";

// ✅ Homepage content
const HomePage = () => {
  const { t } = useTranslation("home");

  return (
    <div className="home-page">
      <div className="glass-card center-card">
        <h1 className="hero-title">{t("welcome_title")}</h1>
        <p className="hero-subtitle">{t("welcome_subtitle")}</p>
      </div>
    </div>
  );
};

// ✅ Handles all routing and layout
const AppContent = () => {
  const location = useLocation();
  const hideNavbarRoutes = ["/", "/login", "/register"];
  const shouldHideNavbar = hideNavbarRoutes.some(
    (route) =>
      location.pathname === route ||
      location.pathname.startsWith(route + "/")
  );

  return (
    <div
      className="app-container"
      style={{
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        position: "relative", // ✅ required for logo placement
      }}
    >
      {!shouldHideNavbar && <Header />}

      {/* ✅ Logo shown only when navbar is shown */}
      {!shouldHideNavbar && (
        <img src={logo} alt="Logo" className="top-left-logo" />
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
  );
};

// ✅ App wrapper with context and router
const App = () => {
  return (
    <TherapistProvider>
      <Router>
        <AppContent />
      </Router>
    </TherapistProvider>
  );
};

export default App;
