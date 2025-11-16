import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from './common/Card';
import Button from './common/Button';
import LanguageSwitcher from './LanguageSwitcher';

interface SignInPageProps {
  onSignIn: (email: string) => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onSignIn }) => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      // Demo authentication - accept any email with password 'demo123'
      if (password === 'demo123') {
        onSignIn(email);
      } else {
        setError(t('signIn.invalidCredentials'));
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-light to-gray-100 p-4">
      {/* Language Switcher in top-right corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <div className="p-8">
          {/* App Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-brand-primary mb-1">
              {t('signIn.appTitle')}
            </h1>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h2
              className="text-4xl font-bold text-brand-dark mb-2"
              style={{ fontFamily: 'Brush Script MT, cursive' }}
            >
              {t('signIn.welcome')}
            </h2>
            <p className="text-gray-600">
              {t('signIn.subtitle')}
            </p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('signIn.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signIn.emailPlaceholder')}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('signIn.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('signIn.passwordPlaceholder')}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                t('signIn.signInButton')
              )}
            </Button>

            {/* Demo Hint */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {t('signIn.demoHint')}
              </p>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                className="text-brand-primary hover:text-brand-dark text-sm font-medium"
                onClick={() => alert('Password reset feature coming soon!')}
              >
                {t('signIn.forgotPassword')}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default SignInPage;
