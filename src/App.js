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
import AdminDashboard from "./components/AdminDashboard"; // ✅ חדש
import { TherapistProvider } from "./TherapistContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import logo from "./assets/background_spanishHouseLogo.png"; // ✅ logo imported here
import "./i18n";
import { useTranslation } from "react-i18next";



// // ✅ Homepage content
// const HomePage = () => {
//   const { t } = useTranslation("home");

//   return (
//     <div className="home-page">
//       <div className="glass-card center-card">
//         <h1 className="hero-title">{t("welcome_title")}</h1>
//         <p className="hero-subtitle">{t("welcome_subtitle")}</p>
//       </div>
//     </div>
//   );
// };

// // ✅ Handles all routing and layout
// const AppContent = () => {
//   const location = useLocation();
//   const hideNavbarRoutes = ["/", "/login", "/register"];
//   const shouldHideNavbar = hideNavbarRoutes.some(
//     (route) =>
//       location.pathname === route ||
//       location.pathname.startsWith(route + "/")
//   );

//   return (
//     <div
//       className="app-container"
//       style={{
//         backgroundSize: "100% 100%",
//         backgroundRepeat: "no-repeat",
//         backgroundPosition: "center",
//         backgroundAttachment: "fixed",
//         minHeight: "100vh",
//         position: "relative", // ✅ required for logo placement
//       }}
//     >
//       {!shouldHideNavbar && <Header />}

//       {/* ✅ Logo shown only when navbar is shown */}
//       {!shouldHideNavbar && (
//         <img src={logo} alt="Logo" className="top-left-logo" />
//       )}

//       <div className="content">
//         <Routes>
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegistrationPage />} />
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <LoginPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/recording"
//             element={
//               <ProtectedRoute>
//                 <RecordingPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <PatientDashboard />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/PatientForm-form"
//             element={
//               <ProtectedRoute>
//                 <PatientForm />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/home"
//             element={
//               <ProtectedRoute>
//                 <HomePage />
//               </ProtectedRoute>
//             }
//           />
//         </Routes>
//       </div>
//     </div>
//   );
// };

// ✅ App wrapper with context and router
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
