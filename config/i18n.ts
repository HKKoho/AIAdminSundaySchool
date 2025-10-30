import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enLessonPlan from '../locales/en/lessonPlan.json';
import enRollCall from '../locales/en/rollCall.json';
import enSecretary from '../locales/en/secretary.json';

import zhCommon from '../locales/zh-TW/common.json';
import zhDashboard from '../locales/zh-TW/dashboard.json';
import zhLessonPlan from '../locales/zh-TW/lessonPlan.json';
import zhRollCall from '../locales/zh-TW/rollCall.json';
import zhSecretary from '../locales/zh-TW/secretary.json';

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    lessonPlan: enLessonPlan,
    rollCall: enRollCall,
    secretary: enSecretary,
  },
  'zh-TW': {
    common: zhCommon,
    dashboard: zhDashboard,
    lessonPlan: zhLessonPlan,
    rollCall: zhRollCall,
    secretary: zhSecretary,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-TW',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
