import React, { useState } from 'react';
import { t, Language } from '../translations';

interface LandingPageProps {
  onEnter: (lang: Language) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <div className="relative flex items-center justify-center h-screen bg-blue-900 text-white">
      <div className="absolute top-6 right-6 flex space-x-2">
          <button 
            onClick={() => setLanguage('en')} 
            className={`px-3 py-1 text-sm rounded transition-colors ${language === 'en' ? 'bg-white text-blue-900' : 'text-white bg-white/20 hover:bg-white/30'}`}
          >
            {t('english', language)}
          </button>
          <button 
            onClick={() => setLanguage('zh-TW')} 
            className={`px-3 py-1 text-sm rounded transition-colors ${language === 'zh-TW' ? 'bg-white text-blue-900' : 'text-white bg-white/20 hover:bg-white/30'}`}
          >
            {t('traditionalChinese', language)}
          </button>
      </div>
      <div className="text-center p-12 bg-blue-800 rounded-lg shadow-2xl max-w-3xl mx-4">
        <h1 className="text-5xl font-bold mb-4">{t('welcome', language)}</h1>
        <p className="text-xl mb-8 text-blue-200">{t('tagline', language)}</p>
        <button
          onClick={() => onEnter(language)}
          className="bg-white text-blue-900 font-bold py-3 px-8 rounded-full hover:bg-blue-100 transition-transform transform hover:scale-105"
        >
          {t('enterDashboard', language)}
        </button>
      </div>
    </div>
  );
};