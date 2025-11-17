import React, { useState } from 'react';

interface PairingCodeDisplayProps {
  pairingCode: string | null;
  onRequestPairingCode: (phoneNumber: string) => void;
  loading: boolean;
}

export const PairingCodeDisplay: React.FC<PairingCodeDisplayProps> = ({
  pairingCode,
  onRequestPairingCode,
  loading
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPairingMethod, setShowPairingMethod] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      onRequestPairingCode(phoneNumber.trim());
    }
  };

  if (!showPairingMethod && !pairingCode) {
    return (
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowPairingMethod(true)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Use pairing code instead
        </button>
      </div>
    );
  }

  if (!pairingCode) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">
          Link with Pairing Code
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter your phone number (with country code)
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Example: +1 for US, +44 for UK, +91 for India
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Requesting...' : 'Get Pairing Code'}
          </button>
        </form>
        <button
          onClick={() => {
            setShowPairingMethod(false);
            setPhoneNumber('');
          }}
          className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
        >
          Use QR code instead
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">
        Enter Pairing Code in WhatsApp
      </h2>
      <div className="flex justify-center items-center my-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-2xl shadow-2xl">
          <div className="text-5xl font-mono font-bold tracking-widest text-center">
            {pairingCode.match(/.{1,4}/g)?.join(' ') || pairingCode}
          </div>
        </div>
      </div>
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        <p className="font-semibold text-gray-700 dark:text-gray-300 text-center">
          Follow these steps on your phone:
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open WhatsApp on your phone</li>
          <li>Go to <strong className="text-gray-700 dark:text-gray-300">Settings → Linked Devices</strong></li>
          <li>Tap <strong className="text-gray-700 dark:text-gray-300">Link a Device</strong></li>
          <li>Select <strong className="text-gray-700 dark:text-gray-300">Link with phone number instead</strong></li>
          <li>Enter the <strong className="text-gray-700 dark:text-gray-300">8-digit code</strong> shown above</li>
        </ol>
      </div>
    </div>
  );
};
