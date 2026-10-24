import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  message,
  onRetry,
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
      </div>
    </div>
  );
};
