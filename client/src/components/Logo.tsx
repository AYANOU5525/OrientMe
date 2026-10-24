import React from 'react';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { icon: 20, text: 'logo-text-sm' },
    md: { icon: 28, text: 'logo-text-md' },
    lg: { icon: 40, text: 'logo-text-lg' },
  };

  return (
    <div className={`logo ${className}`}>
      <div className="logo-icon">
        <GraduationCap size={sizes[size].icon} />
      </div>
      <div className={`logo-text ${sizes[size].text}`}>
        <span className="logo-oriente">Oriente</span>
        <span className="logo-me">me</span>
      </div>
    </div>
  );
};
