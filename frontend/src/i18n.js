import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend'; // Use HttpApi to load translations

i18n
  .use(HttpApi) // Load translations via http (from /public/locales)
  // LanguageDetector removed to force Russian
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    supportedLngs: ['ru', 'en'], // Define supported languages
    fallbackLng: 'ru', // Default language if detection fails
    lng: 'ru', // Explicitly set language to Russian
    // Detection configuration removed
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Path to translation files
    },
    react: {
      useSuspense: false, // Optional: set to true if using React Suspense
    },
  });

export default i18n;