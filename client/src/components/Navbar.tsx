import React from 'react';
import { Logo } from './Logo';

interface NavbarProps {
  onStart?: () => void;
  onHowItWorks?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStart, onHowItWorks }) => {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Logo size="md" />
        <div className="navbar-links">
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onHowItWorks?.();
            }}
          >
            Comment ça marche
          </a>
          <button className="btn btn-primary btn-sm" onClick={onStart}>
            Commencer mon orientation
          </button>
        </div>
      </div>
    </nav>
  );
};
