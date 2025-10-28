
import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

const Alert: React.FC<AlertProps> = ({ children, className = '', variant = 'info' }) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};

export { Alert, AlertDescription };
export default Alert;
