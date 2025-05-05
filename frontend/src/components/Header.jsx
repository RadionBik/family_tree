import React from 'react';
import { useTranslation } from 'react-i18next';
// import AdminLogin from './AdminLogin'; // Import AdminLogin

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="header">
      <h1>{t('header.title')}</h1>
      {/* <div className="header-admin-login"> {/* Add a container for styling */}
        {/* <AdminLogin /> */}
      {/* </div> */}
      {/* Navigation can be added here later */}
    </header>
  );
};

export default Header;