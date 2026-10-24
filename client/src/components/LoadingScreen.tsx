import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

const VARIANTES = {
  orientation: {
    titre: 'Gemma analyse ton profil',
    sousTitre: "Le modèle d'IA Gemma de Google croise tes données pour te proposer les filières les plus adaptées.",
    steps: [
      'Analyse de tes résultats scolaires...',
      'Évaluation de tes compétences...',
      'Identification de tes aspirations...',
      'Consultation de notre base de filières...',
      'Génération de tes recommandations personnalisées...',
    ],
  },
  preparation: {
    titre: 'Gemma prépare ta rentrée',
    sousTitre: "Le modèle d'IA Gemma de Google construit un plan adapté à ton profil et à la filière que tu as choisie.",
    steps: [
      'Étude de la filière choisie...',
      'Repérage de tes points à renforcer...',
      'Sélection des compétences clés de première année...',
      'Construction de ton plan avant la rentrée...',
      'Recherche de ressources gratuites...',
    ],
  },
};

interface LoadingScreenProps {
  variante?: keyof typeof VARIANTES;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ variante = 'orientation' }) => {
  const { titre, sousTitre, steps } = VARIANTES[variante];
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    if (currentStep >= steps.length - 1) return;
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 3000);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-brain">
          <Brain size={56} className="loading-brain-icon" />
          <div className="loading-pulse" />
          <div className="loading-pulse delay-1" />
        </div>

        <div className="loading-sparkles">
          <Sparkles size={20} className="sparkle sparkle-1" />
          <Sparkles size={14} className="sparkle sparkle-2" />
          <Sparkles size={16} className="sparkle sparkle-3" />
        </div>

        <h2 className="loading-title">{titre}</h2>
        <p className="loading-subtitle">{sousTitre}</p>

        <div className="loading-steps">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`loading-step ${
                i < currentStep
                  ? 'step-done'
                  : i === currentStep
                  ? 'step-active'
                  : 'step-waiting'
              }`}
            >
              <div className="step-dot" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="loading-bar">
          <div
            className="loading-bar-fill"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              transition: 'width 2.8s ease-in-out',
            }}
          />
        </div>
        <p className="loading-hint">Cette analyse prend généralement une vingtaine de secondes...</p>
      </div>
    </div>
  );
};
