import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isLoggedIn(); // Using "adminToken" as per plan

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // Pass the current location to redirect back after login (optional)
    // const location = useLocation();
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the child routes/component
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
