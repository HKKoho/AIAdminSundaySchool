import React from 'react';
import { FacebookIcon, InstagramIcon, TikTokIcon } from './icons';
import { t, Language } from '../translations';

interface CommunicateProps {
  language: Language;
}

export const Communicate: React.FC<CommunicateProps> = ({ language }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <div className="space-y-3">
        <a 
          href="https://www.facebook.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg transition-colors group"
        >
          <FacebookIcon className="h-6 w-6 text-gray-500 group-hover:text-[#1877F2] transition-colors" />
          <div className="ml-3">
            <p className="font-semibold text-gray-800">{t('facebookGroup', language)}</p>
            <p className="text-sm text-gray-500">{t('facebookDesc', language)}</p>
          </div>
        </a>
        <a 
          href="https://www.instagram.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg transition-colors group"
        >
          <InstagramIcon className="h-6 w-6 text-gray-500 group-hover:text-[#C13584] transition-colors" />
          <div className="ml-3">
            <p className="font-semibold text-gray-800">{t('instagram', language)}</p>
            <p className="text-sm text-gray-500">{t('instagramDesc', language)}</p>
          </div>
        </a>
        <a 
          href="https://www.tiktok.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg transition-colors group"
        >
          <TikTokIcon className="h-6 w-6 text-gray-500 group-hover:text-black transition-colors" />
          <div className="ml-3">
            <p className="font-semibold text-gray-800">{t('tiktok', language)}</p>
            <p className="text-sm text-gray-500">{t('tiktokDesc', language)}</p>
          </div>
        </a>
      </div>
    </div>
  );
};