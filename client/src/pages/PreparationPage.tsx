import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Cpu,
  ListChecks,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { PlanRentree } from '../types';
import { Logo } from '../components/Logo';

interface PreparationPageProps {
  prenom: string;
  plan: PlanRentree;
  // Modèle Gemma ayant généré le plan
  modele: string;
  onRetourResultats: () => void;
  onRecommencer: () => void;
}

export const PreparationPage: React.FC<PreparationPageProps> = ({
  prenom,
  plan,
  modele,
  onRetourResultats,
  onRecommencer,
}) => {
  return (
    <div className="resultats-page">
      <div className="resultats-container">
        <div className="resultats-header print-header">
          <Logo size="md" />
          <div className="resultats-header-text">
            <h1 className="resultats-title">
              {prenom ? `${prenom}, prépare` : 'Prépare'} ta rentrée en {plan.nom}
            </h1>
            <p className="prep-intro">{plan.introduction}</p>
            <p className="resultats-model">
              <Cpu size={14} /> Plan généré par Gemma ({modele}) via l'API Google Gemini
            </p>
          </div>
        </div>

        <section className="prep-section">
          <h2 className="prep-section-title">
            <ListChecks size={22} /> Ce que tu dois maîtriser avant la rentrée
          </h2>
          <div className="prep-points">
            {plan.aMaitriser.map((point, i) => (
              <div key={i} className="prep-point">
                <div className="prep-numero">{i + 1}</div>
                <div>
                  <h3 className="prep-point-titre">{point.titre}</h3>
                  <p className="prep-point-pourquoi">{point.pourquoi}</p>
                  <ul className="rec-list">
                    {point.commentProgresser.map((conseil, j) => (
                      <li key={j}>{conseil}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="prep-section">
          <h2 className="prep-section-title">
            <CalendarDays size={22} /> Ton plan d'ici la rentrée
          </h2>
          <div className="prep-timeline">
            {plan.planAvantRentree.map((etape, i) => (
              <div key={i} className="prep-etape">
                <span className="prep-periode">{etape.periode}</span>
                <p className="prep-objectif">{etape.objectif}</p>
                <ul className="rec-list">
                  {etape.actions.map((action, j) => (
                    <li key={j}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {plan.ressources.length > 0 && (
          <section className="prep-section">
            <h2 className="prep-section-title">
              <BookOpen size={22} /> Ressources gratuites pour t'entraîner
            </h2>
            <div className="prep-ressources">
              {plan.ressources.map((ressource, i) => (
                <div key={i} className="prep-ressource">
                  <p className="prep-ressource-nom">{ressource.nom}</p>
                  <p className="prep-ressource-desc">{ressource.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="conseil-general-card">
          <h2 className="conseil-title">
            <Sparkles size={18} /> Pour finir
          </h2>
          <p className="conseil-text">{plan.motivation}</p>
        </div>

        <div className="disclaimer-card">
          <AlertTriangle size={18} />
          <p>
            Ce plan est indicatif et basé sur les informations que tu as fournies. Renseigne-toi auprès de
            l'établissement que tu vises sur le programme exact de première année et sur la date de la rentrée.
          </p>
        </div>

        <div className="resultats-actions no-print">
          <button className="btn btn-outline" onClick={onRetourResultats}>
            <ArrowLeft size={16} /> Revenir à mes recommandations
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer mon plan
          </button>
          <button className="btn btn-outline" onClick={onRecommencer}>
            <RotateCcw size={16} /> Refaire mon orientation
          </button>
        </div>
      </div>
    </div>
  );
};
