import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export type ViewType = 'home' | 'classes' | 'support' | 'rollcall' | 'whatsapp' | 'bookkeeper' | 'documenthub';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  userEmail?: string;
  onSignOut: () => void;
}

interface NavItem {
  id: ViewType;
  icon: React.ReactNode;
  labelKey: string;
  color: string;
  available: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, userEmail, onSignOut }) => {
  const { t } = useTranslation('dashboard');

  const navItems: NavItem[] = [
    {
      id: 'classes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      labelKey: 'landing.classes.title',
      color: 'bg-brand-primary hover:bg-brand-dark',
      available: true,
    },
    {
      id: 'support',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      labelKey: 'landing.teacherSupport.title',
      color: 'bg-brand-secondary hover:bg-yellow-600',
      available: true,
    },
    {
      id: 'rollcall',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      labelKey: 'landing.rollCall.title',
      color: 'bg-green-600 hover:bg-green-700',
      available: true,
    },
    {
      id: 'whatsapp',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      labelKey: 'landing.whatsappSecretary.title',
      color: 'bg-purple-600 hover:bg-purple-700',
      available: true,
    },
    {
      id: 'bookkeeper',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      labelKey: 'landing.aiBookkeeper.title',
      color: 'bg-blue-600 hover:bg-blue-700',
      available: false,
    },
    {
      id: 'documenthub',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      labelKey: 'landing.aiEventOrganizer.title',
      color: 'bg-pink-600 hover:bg-pink-700',
      available: true,
    },
  ];

  return (
    <aside className="w-72 bg-brand-dark text-white flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-brand-primary/30">
        <h1 className="text-xl font-bold mb-1">{t('landing.title')}</h1>
        <p className="text-sm text-brand-light opacity-80">{t('landing.subtitle')}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.available ? onSelectView(item.id) : alert(t('landing.aiBookkeeper.title') + ' - Coming Soon!')}
            disabled={!item.available}
            className={`
              w-full px-6 py-4 flex items-center space-x-4 transition-all duration-200
              ${currentView === item.id ? 'bg-brand-primary/20 border-l-4 border-brand-accent' : 'hover:bg-brand-primary/10'}
              ${!item.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`p-2 rounded-lg ${item.color} flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{t(item.labelKey)}</div>
              {!item.available && (
                <div className="text-xs text-brand-light opacity-60">Coming Soon</div>
              )}
            </div>
          </button>
        ))}
      </nav>

      {/* Footer - User Info & Sign Out */}
      <div className="p-6 border-t border-brand-primary/30">
        <div className="mb-4">
          <LanguageSwitcher />
        </div>

        {userEmail && (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-brand-light text-xs mb-1">{t('auth.signedInAs')}</div>
              <div className="font-medium truncate">{userEmail}</div>
            </div>
            <button
              onClick={onSignOut}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{t('auth.signOut')}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
