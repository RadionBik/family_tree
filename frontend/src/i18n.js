import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ruTranslations from "../public/locales/ru/translation.json";

i18n
  .use(initReactI18next)
  .init({
    supportedLngs: ["ru", "en"],
    fallbackLng: "ru",
    lng: "ru",

    resources: {
      ru: {
        translation: ruTranslations,
      },
    },

    react: {
      useSuspense: false,
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
