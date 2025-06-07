import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminLogin from "./components/AdminLogin";
import UserLogin from "./components/UserLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMemberListPage from "./pages/AdminMemberListPage";
import AdminMemberFormPage from "./pages/AdminMemberFormPage";
import "./App.css";

const LoginRedirector = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const handleLogin = (loginData) => {
    localStorage.setItem("adminToken", loginData.access_token);
    if (onLoginSuccess) onLoginSuccess(loginData);
    navigate("/admin");
  };

  return <AdminLogin onLoginSuccess={handleLogin} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<UserLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route
          path="/admin/login"
          element={
            <LoginRedirector />
          }
        />
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
        </Route>{" "}
      </Routes>
    </Router>
  );
}

export default App;
