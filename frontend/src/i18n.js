import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import the translation files directly
import ruTranslations from "../public/locales/ru/translation.json";
// If English translations are needed, uncomment and adjust path:
// import enTranslations from '../public/locales/en/translation.json';

i18n
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    supportedLngs: ["ru", "en"], // Define supported languages
    fallbackLng: "ru", // Default language if detection fails
    lng: "ru", // Explicitly set language to Russian

    // Use the 'resources' option instead of 'backend'
    resources: {
      ru: {
        translation: ruTranslations, // Assign the imported JSON object
      },
      // en: {
      //   translation: enTranslations
      // }
    },

    react: {
      useSuspense: false, // Keep as false, not needed for bundled resources
    },

    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
