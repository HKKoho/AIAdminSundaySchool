import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = 'bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200';
  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : '';
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <div className={combinedClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
