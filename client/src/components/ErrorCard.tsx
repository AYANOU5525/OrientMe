import React from 'react';
import { AlertCircle, RefreshCw, Play } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
  onDemo?: () => void;
  showDemo?: boolean;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  message,
  onRetry,
  onDemo,
  showDemo = true,
}) => {
  return (
    <div className="error-card">
      <div className="error-icon">
        <AlertCircle size={32} />
      </div>
      <h3 className="error-title">Une erreur est survenue</h3>
      <p className="error-message">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            <RefreshCw size={16} />
            Réessayer
          </button>
        )}
        {showDemo && onDemo && (
          <button className="btn btn-outline" onClick={onDemo}>
            <Play size={16} />
            Voir un exemple de démonstration
          </button>
        )}
      </div>
      {showDemo && (
        <p className="error-demo-note">
          La démonstration utilise un profil fictif et ne représente pas une analyse Gemini en temps réel.
        </p>
      )}
    </div>
  );
};
