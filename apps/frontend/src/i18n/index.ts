import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uk from './locales/uk.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGS = ['uk', 'en', 'ru'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uk: { translation: uk },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'uk',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: {
      escapeValue: false, // React уже захищає від XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'campflow-lang',
    },
  });

export default i18n;
