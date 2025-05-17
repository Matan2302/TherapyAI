import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import RegistrationPage from "./components/RegistrationPage";
import LoginPage from "./components/LoginPage";
import RecordingPage from "./components/RecordingPage";
import PatientDashboard from "./components/PatientDashboard";
import PatientForm from "./components/PatientForm";
import { TherapistProvider } from "./TherapistContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import backgroundImage from "./assets/background_spanishHouseLogo.png"; // רקע

const App = () => {
  return (
    <TherapistProvider>
      <Router>
        <div
          className="app-container"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            minHeight: "100vh"
          }}
        >
          <Header />

          <div className="content">
            <Switch>
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegistrationPage} />
              <Route
                exact
                path="/"
                render={() => (
                  <ProtectedRoute>
                    <LoginPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/recording"
                render={() => (
                  <ProtectedRoute>
                    <RecordingPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard"
                render={() => (
                  <ProtectedRoute>
                    <PatientDashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/PatientForm-form"
                render={() => (
                  <ProtectedRoute>
                    <PatientForm />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/home"
                render={() => (
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                )}
              />
            </Switch>
          </div>
        </div>
      </Router>
    </TherapistProvider>
  );
};

// ✅ דף הבית עם עיצוב glass-card
const HomePage = () => (
  <div className="home-page">
    <div className="glass-card center-card">
      <h1 className="hero-title">Welcome to TherapyAI</h1>
      <p className="hero-subtitle">Manage your sessions with ease and help patients efficiently.</p>
    </div>
  </div>
);

export default App;
