import React from 'react';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  step: number;
  totalSteps: number;
  labels: string[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ step, totalSteps, labels }) => {
  return (
    <div className="progress-container">
      <div className="progress-steps">
        {labels.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;

          return (
            <React.Fragment key={index}>
              <div className="progress-step">
                <div
                  className={`step-circle ${
                    isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : stepNum}
                </div>
                <span
                  className={`step-label ${
                    isCompleted ? 'label-completed' : isCurrent ? 'label-current' : 'label-pending'
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`step-connector ${isCompleted ? 'connector-done' : 'connector-pending'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
