import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../services/authService";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isLoggedIn();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
