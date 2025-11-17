
import React from 'react';
import type { ConnectionState } from '../types';
import { CheckCircleIcon, XCircleIcon, LoaderIcon } from './icons';

interface ConnectionStatusProps {
  state: ConnectionState;
}

const statusConfig = {
  connected: {
    text: 'Connected to WhatsApp',
    icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    textColor: 'text-green-800 dark:text-green-300',
  },
  disconnected: {
    text: 'Disconnected from WhatsApp',
    icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    textColor: 'text-red-800 dark:text-red-300',
  },
  connecting: {
    text: 'Connecting...',
    icon: <LoaderIcon className="h-5 w-5 text-yellow-500 animate-spin" />,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    textColor: 'text-yellow-800 dark:text-yellow-300',
  },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ state }) => {
  const config = statusConfig[state];

  return (
    <div className={`p-4 rounded-lg flex items-center space-x-3 ${config.bgColor}`}>
      {config.icon}
      <p className={`font-medium ${config.textColor}`}>{config.text}</p>
    </div>
  );
};
