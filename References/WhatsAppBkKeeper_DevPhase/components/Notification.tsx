import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XIcon } from './icons';

interface NotificationProps {
  message: string | null;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        // Allow time for fade-out animation before calling onClose
        setTimeout(onClose, 300); 
      }, 2700);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 rounded-lg shadow-lg bg-gray-800 text-white flex items-center justify-between transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center space-x-3">
        <CheckCircleIcon className="h-5 w-5 text-green-400" />
        <p className="font-medium">{message}</p>
      </div>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 rounded-full hover:bg-gray-700"
        aria-label="Close notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
