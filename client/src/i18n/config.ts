// Temporarily disabled i18n to fix compilation errors
// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import nlTranslations from './locales/nl.json';
import enTranslations from './locales/en.json';
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';

const resources = {
  nl: {
    translation: nlTranslations
  },
  en: {
    translation: enTranslations
  },
  de: {
    translation: deTranslations
  },
  fr: {
    translation: frTranslations
  }
};

// Temporarily export mock i18n object
const mockI18n = {
  t: (key: string) => key,
  changeLanguage: (lng: string) => Promise.resolve(),
  language: 'nl'
};

export default mockI18n;
