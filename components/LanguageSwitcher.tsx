import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh-TW' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
      aria-label="Switch Language"
    >
      {i18n.language === 'en' ? '中文' : 'Eng'}
    </button>
  );
};

export default LanguageSwitcher;
