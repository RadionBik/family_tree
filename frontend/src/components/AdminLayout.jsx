import React from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import authService from "../services/authService";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>{t("adminLayout.title", "Family Tree Admin")}</h1>
        <nav>
          <Link to="/admin/members">
            {t("adminLayout.navMembers", "Manage Members")}
          </Link>
          <button onClick={handleLogout}>
            {t("adminLayout.logoutButton", "Logout")}
          </button>
        </nav>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
      <footer className="admin-footer">
        <p>
          &copy; {new Date().getFullYear()}{" "}
          {t("adminLayout.footerText", "Family Tree Admin Panel")}
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
