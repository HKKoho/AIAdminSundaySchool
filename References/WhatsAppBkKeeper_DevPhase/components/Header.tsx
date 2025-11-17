import React from 'react';
import { BotMessageSquareIcon, MicrophoneIcon } from './icons';

interface HeaderProps {
  isListening: boolean;
  onToggleListening: () => void;
  hasRecognitionSupport: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isListening, onToggleListening, hasRecognitionSupport }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <BotMessageSquareIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            WhatsApp Bookkeeper AI
          </h1>
        </div>
        {hasRecognitionSupport && (
          <button
            onClick={onToggleListening}
            className={`relative p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 ${
              isListening
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start voice command'}
          >
            <MicrophoneIcon className="h-5 w-5" />
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
