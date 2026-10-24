import React from 'react';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-2xl' },
    lg: { icon: 40, text: 'text-4xl' },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="logo-icon">
        <GraduationCap size={sizes[size].icon} />
      </div>
      <div className={`logo-text ${sizes[size].text}`}>
        <span className="logo-orient">Orient</span>
        <span className="logo-a">a</span>
        <span className="logo-togo">Togo</span>
        <span className="logo-ai"> AI</span>
      </div>
    </div>
  );
};
