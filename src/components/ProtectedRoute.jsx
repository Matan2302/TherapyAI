import React from "react";
import { Navigate } from "react-router-dom";

/**
 * This component wraps any route that should only be accessible to authenticated users.
 * If no token exists in localStorage, the user is redirected to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
