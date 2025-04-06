import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegistrationPage from "./components/RegistrationPage";
import LoginPage from "./components/LoginPage";
import RecordingPage from "./components/RecordingPage";
import PatientDashboard from "./components/PatientDashboard";
import PatientForm from "./components/PatientForm";
import { TherapistProvider } from "./TherapistContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <TherapistProvider>
      <Router>
        <div className="app-container">
          <Header />

          <div className="content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
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
            </Routes>
          </div>
        </div>
      </Router>
    </TherapistProvider>
  );
};

const HomePage = () => (
  <div className="home-page">
    <div className="hero-content">
      <h1>Welcome to TherapyAI</h1>
      <p>Manage your sessions with ease and help patients efficiently.</p>
    </div>
  </div>
);

export default App;
