import React from "react";
import { Navigate } from "react-router-dom";
import tokenService from "../services/tokenService";

const ProtectedRoute = ({ children }) => {
  if (!tokenService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
