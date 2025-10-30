import React, { useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { MembersPage } from './pages/MembersPage';
import { LandingPage } from './pages/LandingPage';
import { HomeIcon, CalendarIcon, UsersIcon } from './components/icons';
import { t, Language } from './translations';

type Page = 'dashboard' | 'events' | 'members';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [language, setLanguage] = useState<Language>('en');

  if (!isAuthenticated) {
    return <LandingPage onEnter={(lang) => {
      setIsAuthenticated(true);
      setLanguage(lang);
    }} />;
  }
  
  const renderPage = () => {
    switch (activePage) {
      case 'events':
        return <EventsPage language={language} />;
      case 'members':
        return <MembersPage language={language} />;
      case 'dashboard':
      default:
        return <DashboardPage language={language} />;
    }
  };

  const NavItem: React.FC<{ page: Page; icon: React.ReactNode; label: string }> = ({ page, icon, label }) => (
    <li className="mb-2">
      <button
        onClick={() => setActivePage(page)}
        className={`w-full flex items-center p-3 rounded-lg transition-colors ${
          activePage === page 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-300 hover:bg-blue-800 hover:text-white'
        }`}
      >
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
      </button>
    </li>
  );

  const LanguageSwitcher: React.FC = () => (
    <div className="px-4 py-2 mt-auto border-t border-blue-800">
      <div className="flex justify-around">
        <button 
          onClick={() => setLanguage('en')} 
          className={`px-3 py-1 text-sm rounded ${language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-blue-800'}`}
        >
          {t('english', language)}
        </button>
        <button 
          onClick={() => setLanguage('zh-TW')}
          className={`px-3 py-1 text-sm rounded ${language === 'zh-TW' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-blue-800'}`}
        >
          {t('traditionalChinese', language)}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-blue-800">
          <h1 className="text-2xl font-bold">ChurchFlow</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul>
            <NavItem page="dashboard" icon={<HomeIcon className="h-6 w-6" />} label={t('dashboard', language)} />
            <NavItem page="events" icon={<CalendarIcon className="h-6 w-6" />} label={t('events', language)} />
            <NavItem page="members" icon={<UsersIcon className="h-6 w-6" />} label={t('members', language)} />
          </ul>
        </nav>
        <LanguageSwitcher />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;