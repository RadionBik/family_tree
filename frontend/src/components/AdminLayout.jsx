import React from 'react'; // Removed useEffect
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';
import './AdminLayout.css';

const AdminLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Removed the useEffect hook that checked for the token.
  // We rely on the routing setup (LoginRedirector) to ensure the token exists before this component is rendered.

  const handleLogout = () => {
    authService.logout(); // Clear the token
    navigate('/admin/login'); // Redirect after logout
  };

  // Render the layout structure
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>{t('adminLayout.title', 'Family Tree Admin')}</h1>
        <nav>
          <Link to="/admin/members">{t('adminLayout.navMembers', 'Manage Members')}</Link>
          {/* Add other admin links here */}
          <button onClick={handleLogout}>{t('adminLayout.logoutButton', 'Logout')}</button>
        </nav>
      </header>
      <main className="admin-content">
        {/* Removed temporary paragraph */}
        <Outlet /> {/* Child routes (like AdminDashboard) will render here */}
      </main>
      <footer className="admin-footer">
        <p>&copy; {new Date().getFullYear()} {t('adminLayout.footerText', 'Family Tree Admin Panel')}</p>
      </footer>
    </div>
  );
};

export default AdminLayout;