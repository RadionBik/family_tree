import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminLogin from "./components/AdminLogin"; // Keep for admin section
import UserLogin from "./components/UserLogin"; // Import UserLogin
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMemberListPage from "./pages/AdminMemberListPage";
import AdminMemberFormPage from "./pages/AdminMemberFormPage";
import "./App.css";

// Helper component to handle redirection after login
const LoginRedirector = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const handleLogin = (loginData) => {
    // Store token (e.g., in localStorage)
    localStorage.setItem("adminToken", loginData.access_token); // Assuming token is in access_token
    // Call the original success handler if needed (e.g., to update App state)
    if (onLoginSuccess) onLoginSuccess(loginData);
    // Redirect to admin dashboard
    navigate("/admin");
  };

  return <AdminLogin onLoginSuccess={handleLogin} />;
};

function App() {
  // Optional: Add state here if you need global auth state beyond localStorage check
  // const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  // const handleAdminLoginSuccess = (loginData) => {
  //   localStorage.setItem('adminToken', loginData.access_token);
  //   setIsAdminAuthenticated(true);
  //   // No need to navigate here, LoginRedirector handles it
  // };

  // const handleAdminLogout = () => {
  //   authService.logout(); // Ensure authService clears the token
  //   setIsAdminAuthenticated(false);
  //   // Navigation handled by AdminLayout or redirect component
  // };

  return (
    <Router>
      <Routes>
        {/* User Login Route - Public */}
        <Route path="/login" element={<UserLogin />} />
        {/* Protected Routes for general users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          {/* Add other user-protected routes here if needed */}
        </Route>
        {/* Admin Login Route - Public (if keeping admin section separate) */}
        <Route
          path="/admin/login"
          element={
            <LoginRedirector /* onLoginSuccess={handleAdminLoginSuccess} */ />
          }
        />
        {/* Admin Routes (Protected by AdminLayout - assuming AdminLayout also checks token or is wrapped by its own ProtectedRoute variant) */}
        {/* If AdminLayout doesn't handle its own protection, it should also be wrapped by a ProtectedRoute, potentially one that checks for an admin role in the token if we differentiate tokens/roles later */}
        <Route
          path="/admin"
          element={<AdminLayout /* onLogout={handleAdminLogout} */ />}
        >
          {/* Index route for /admin */}
          {/* <Route index element={<AdminDashboard />} /> */}
          {/* Member Management Routes */}
          {/* <Route path="members" element={<AdminMemberListPage />} /> */}
          {/* <Route path="members/add" element={<AdminMemberFormPage />} /> */}
          {/* <Route path="members/edit/:id" element={<AdminMemberFormPage />} /> */}
          {/* Add other admin routes here (e.g., relationships, settings) */}
        </Route>{" "}
        {/* This was the missing closing tag for the /admin route group */}
        {/* Optional: Add a 404 Not Found route */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
