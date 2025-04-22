import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const AdminLogin = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Placeholder for login logic - will connect to API later
    console.log('Admin Login Attempt:', { username, password });
    alert(t('adminLogin.alertNotImplemented'));
  };

  return (
    <section className="admin-login">
      <h2>{t('adminLogin.title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('adminLogin.usernameLabel')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('adminLogin.passwordLabel')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{t('adminLogin.loginButton')}</button>
      </form>
    </section>
  );
};

export default AdminLogin;