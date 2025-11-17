import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface WhatsAppBookkeeperProps {
  onBack: () => void;
  hideHeader?: boolean;
}

type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'qr_ready';

interface Document {
  id: string;
  filename: string;
  type?: string;
  uploadedAt: string;
  status: 'pending' | 'classified' | 'rejected' | 'classifying';
  amount?: number;
  vendor?: string;
  data?: string;
  mimetype?: string;
}

const API_URL = import.meta.env.VITE_BOOKKEEPER_API_URL || 'http://localhost:3002';

const WhatsAppBookkeeper: React.FC<WhatsAppBookkeeperProps> = ({ onBack, hideHeader = false }) => {
  const { t } = useTranslation('bookkeeper');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [qrCode, setQrCode] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [serverError, setServerError] = useState<string>('');

  // Poll server for connection status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);
        const data = await response.json();

        // Update connection state
        if (data.connectionState === 'qr_ready') {
          setConnectionState('qr_ready');
          setQrCode(data.qrCode || '');
        } else if (data.connectionState === 'connected') {
          setConnectionState('connected');
          setQrCode('');
        } else if (data.connectionState === 'connecting') {
          setConnectionState('connecting');
          setQrCode('');
        } else {
          setConnectionState('connecting');
          setQrCode('');
        }
        setServerError('');
      } catch (error) {
        console.error('Error polling status:', error);
        setConnectionState('disconnected');
        setServerError(t('errors.serverNotRunning'));
      }
    };

    // Poll every 2 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [t]);

  // Poll for documents when connected
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const pollDocuments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/documents`);
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
          setDocuments(data.documents);
        }
      } catch (error) {
        console.error('Error polling documents:', error);
      }
    };

    pollDocuments();
    const interval = setInterval(pollDocuments, 3000);

    return () => clearInterval(interval);
  }, [connectionState]);

  const handleClassifyDocument = async (docId: string) => {
    try {
      // Update status to classifying
      setDocuments(docs => docs.map(d =>
        d.id === docId ? { ...d, status: 'classifying' as const } : d
      ));

      const response = await fetch(`${API_URL}/api/classify/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Classification failed');
      }

      // Documents will be updated on next poll
    } catch (error) {
      console.error('Error classifying document:', error);
      // Reset status on error
      setDocuments(docs => docs.map(d =>
        d.id === docId ? { ...d, status: 'rejected' as const } : d
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'classified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const renderContent = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-700">{t('connection.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('connection.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-block w-3 h-3 rounded-full ${getConnectionColor()} animate-pulse`}></span>
            <span className="text-sm font-medium text-gray-700">
              {t(`connection.status.${connectionState}`)}
            </span>
          </div>
        </div>

        {serverError && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{serverError}</p>
                <p className="text-xs text-red-600 mt-1">
                  {t('errors.startServer')}: <code className="bg-red-100 px-1 py-0.5 rounded">cd bookkeeper-server && npm start</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {connectionState === 'qr_ready' && qrCode && (
          <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('connection.scanQR')}</h3>
            <div className="flex flex-col items-center">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 bg-white p-4 rounded-lg shadow-md" />
              <p className="text-sm text-blue-700 mt-4 text-center max-w-md">
                {t('connection.qrInstructions')}
              </p>
            </div>
          </div>
        )}

        {connectionState === 'connecting' && !qrCode && !serverError && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-700">{t('connection.connecting')}</p>
            </div>
          </div>
        )}

        {connectionState === 'connected' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ {t('connection.connectedMessage')}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('stats.totalDocuments')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{documents.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('stats.classified')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {documents.filter(d => d.status === 'classified').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('stats.pending')}</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {documents.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('documents.title')}</h2>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-500">{t('documents.noDocuments')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800">{doc.filename}</p>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                      </div>
                    </div>
                    {doc.vendor && (
                      <div className="mt-2 ml-8">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{t('documents.vendor')}:</span> {doc.vendor}
                        </p>
                        {doc.amount && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{t('documents.amount')}:</span> ${doc.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {t(`documents.status.${doc.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('instructions.title')}</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">1.</span>
            <span>{t('instructions.step1')}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">2.</span>
            <span>{t('instructions.step2')}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">3.</span>
            <span>{t('instructions.step3')}</span>
          </li>
        </ul>
      </div>
    </div>
  );

  if (hideHeader) {
    return (
      <div className="flex flex-col bg-gray-50 h-full">
        <main className="flex-grow w-full px-2 py-4 sm:px-4 md:px-8 md:py-8">
          {renderContent()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">{t('header.title')}</h1>
              <p className="text-xs text-blue-100 opacity-80 -mt-1">{t('header.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button onClick={onBack} className="text-sm hover:underline">
              {t('header.backToHome')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>{t('common.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default WhatsAppBookkeeper;
