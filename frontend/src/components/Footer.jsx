import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>{t('footer.copyright', { year: currentYear })}</p>
    </footer>
  );
};

export default Footer;