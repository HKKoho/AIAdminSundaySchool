
import React from 'react';

interface QRCodeDisplayProps {
  qrCode: string;
  loading: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrCode, loading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Scan QR Code with WhatsApp
      </h2>
      <div className="flex justify-center items-center my-6 relative">
        {qrCode ? (
          <img
            src={qrCode}
            alt="WhatsApp QR Code"
            className="w-64 h-64 border-8 border-white dark:border-gray-700"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">Generating QR Code...</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 max-w-md mx-auto">
        Open WhatsApp on your phone, go to{' '}
        <strong className="text-gray-700 dark:text-gray-300">Settings &gt; Linked Devices</strong>, then tap{' '}
        <strong className="text-gray-700 dark:text-gray-300">Link a Device</strong> and scan this code.
      </p>
    </div>
  );
};
