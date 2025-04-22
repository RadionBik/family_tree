import React from 'react';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="header">
      <h1>{t('header.title')}</h1>
      {/* Navigation can be added here later */}
    </header>
  );
};

export default Header;