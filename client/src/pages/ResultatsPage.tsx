import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit,
  Printer,
  TrendingUp,
  Shield,
  Star,
  X,
  BookOpen,
  Cpu,
} from 'lucide-react';
import type { ResultatOrientation, Recommandation } from '../types';
import { Logo } from '../components/Logo';

interface ResultatsPageProps {
  prenom: string;
  resultats: ResultatOrientation;
  // Modèle ayant généré l'analyse (absent en mode démonstration)
  modele?: string;
  isDemo: boolean;
  onRecommencer: () => void;
  onModifier: () => void;
}

interface ModalProps {
  recommandation: Recommandation;
  onClose: () => void;
}

const DetailModal: React.FC<ModalProps> = ({ recommandation, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 className="modal-title" id="modal-title">{recommandation.nom}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {recommandation.description && (
            <section className="modal-section">
              <h4 className="modal-section-title">
                <BookOpen size={16} /> La filière en bref
              </h4>
              <p className="modal-text">{recommandation.description}</p>
              {recommandation.prerequis && (
                <p className="modal-text modal-prerequis">
                  <strong>Prérequis :</strong> {recommandation.prerequis}
                </p>
              )}
            </section>
          )}

          <section className="modal-section">
            <h4 className="modal-section-title">
              <Star size={16} /> Pourquoi cette filière correspond à ton profil
            </h4>
            <p className="modal-text">{recommandation.justification}</p>
          </section>

          <section className="modal-section">
            <h4 className="modal-section-title">
              <TrendingUp size={16} /> Compétences à renforcer
            </h4>
            <ul className="modal-list">
              {recommandation.competencesARenforcer.map((comp, i) => (
                <li key={i} className="modal-list-item">
                  <div className="list-dot list-dot-secondary" />
                  {comp}
                </li>
              ))}
            </ul>
          </section>

          <section className="modal-section">
            <h4 className="modal-section-title">
              <Briefcase size={16} /> Débouchés professionnels
            </h4>
            <div className="debouches-tags">
              {recommandation.debouches.map((d, i) => (
                <span key={i} className="debouche-tag">{d}</span>
              ))}
            </div>
          </section>

          <section className="modal-section conseil-section">
            <h4 className="modal-section-title">
              <Shield size={16} /> Conseil personnalisé
            </h4>
            <p className="modal-conseil">{recommandation.conseil}</p>
          </section>

          <div className="modal-disclaimer">
            ⚠️ Les conditions d'admission et la disponibilité de cette filière doivent être vérifiées auprès des établissements concernés.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const RecommandationCard: React.FC<{
  recommandation: Recommandation;
  rang: number;
  onVoirDetail: () => void;
}> = ({ recommandation, rang, onVoirDetail }) => {
  const [expanded, setExpanded] = useState(false);

  const rangLabels: Record<number, { label: string; class: string }> = {
    1: { label: '1ère recommandation', class: 'rang-1' },
    2: { label: '2ème recommandation', class: 'rang-2' },
    3: { label: '3ème recommandation', class: 'rang-3' },
  };

  const info = rangLabels[rang] || { label: `${rang}ème`, class: 'rang-other' };

  return (
    <div className={`recommandation-card ${info.class}`}>
      <div className="rec-card-header">
        <div className="rec-rang-badge">{info.label}</div>
        <h3 className="rec-nom">{recommandation.nom}</h3>
        <p className="rec-justification-preview no-print">
          {recommandation.justification.slice(0, 150)}
          {recommandation.justification.length > 150 ? '...' : ''}
        </p>
      </div>

      {/* Version complète, visible uniquement à l'impression */}
      <div className="print-only rec-print-details">
        <p>{recommandation.justification}</p>
        <h4 className="rec-section-title">Compétences à renforcer</h4>
        <ul className="rec-list">
          {recommandation.competencesARenforcer.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <h4 className="rec-section-title">Débouchés</h4>
        <p>{recommandation.debouches.join(' · ')}</p>
        <h4 className="rec-section-title">Conseil</h4>
        <p>{recommandation.conseil}</p>
      </div>

      {expanded && (
        <div className="rec-card-expanded">
          <div className="rec-section">
            <h4 className="rec-section-title">
              <TrendingUp size={14} /> Compétences à renforcer
            </h4>
            <ul className="rec-list">
              {recommandation.competencesARenforcer.slice(0, 3).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="rec-section">
            <h4 className="rec-section-title">
              <Briefcase size={14} /> Quelques métiers possibles
            </h4>
            <div className="debouches-tags">
              {recommandation.debouches.slice(0, 3).map((d, i) => (
                <span key={i} className="debouche-tag debouche-tag-sm">{d}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rec-card-footer">
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp size={16} /> Réduire</>
          ) : (
            <><ChevronDown size={16} /> Aperçu rapide</>
          )}
        </button>
        <button className="btn btn-primary btn-sm" onClick={onVoirDetail}>
          Voir les détails
        </button>
      </div>
    </div>
  );
};

export const ResultatsPage: React.FC<ResultatsPageProps> = ({
  prenom,
  resultats,
  modele,
  isDemo,
  onRecommencer,
  onModifier,
}) => {
  const [modalRec, setModalRec] = useState<Recommandation | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="resultats-page">
      {isDemo && (
        <div className="demo-banner">
          <AlertTriangle size={18} />
          <strong>Mode Démonstration</strong> — Ce résultat utilise un profil fictif (Kofi, BAC C). Il ne représente pas une analyse IA en temps réel.
        </div>
      )}

      <div className="resultats-container">
        {/* Header résultats */}
        <div className="resultats-header print-header">
          <Logo size="md" />
          <div className="resultats-header-text">
            <h1 className="resultats-title">
              {prenom ? `${prenom}, voici` : 'Voici'} les pistes qui correspondent à ton profil
            </h1>
            <p className="resultats-subtitle">
              OrientaTogo AI a analysé ton profil complet pour te proposer trois orientations adaptées.
            </p>
            {modele && (
              <p className="resultats-model">
                <Cpu size={14} /> Analyse générée par {modele} via l'API Google Gemini
              </p>
            )}
          </div>
        </div>

        {/* Analyse du profil */}
        <div className="profil-card">
          <h2 className="card-section-title">
            <Star size={18} /> Analyse de ton profil
          </h2>
          <p className="profil-resume">{resultats.profil.resume}</p>

          <div className="profil-details">
            <div className="profil-points-forts">
              <h3 className="points-title">
                <CheckCircle size={16} /> Points forts
              </h3>
              <ul className="points-list">
                {resultats.profil.pointsForts.map((p, i) => (
                  <li key={i} className="point-item point-fort">{p}</li>
                ))}
              </ul>
            </div>

            <div className="profil-vigilance">
              <h3 className="points-title">
                <AlertTriangle size={16} /> Points de vigilance
              </h3>
              <ul className="points-list">
                {resultats.profil.pointsVigilance.map((p, i) => (
                  <li key={i} className="point-item point-vigilance">{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="recommandations-section">
          <h2 className="recommandations-title">Tes trois recommandations</h2>
          <div className="recommandations-grid">
            {resultats.recommandations.map((rec, i) => (
              <RecommandationCard
                key={rec.filiereId}
                recommandation={rec}
                rang={i + 1}
                onVoirDetail={() => setModalRec(rec)}
              />
            ))}
          </div>
        </div>

        {/* Conseil général */}
        <div className="conseil-general-card">
          <h2 className="conseil-title">
            <Shield size={18} /> Conseil général
          </h2>
          <p className="conseil-text">{resultats.conseilGeneral}</p>
        </div>

        {/* Avertissement */}
        <div className="disclaimer-card">
          <AlertTriangle size={18} />
          <p>
            Ces recommandations sont indicatives et basées sur les informations que tu as fournies. Elles n'ont pas de valeur officielle. Les conditions d'admission et la disponibilité des filières doivent être vérifiées auprès des établissements d'enseignement supérieur du Togo. Consulte également un conseiller d'orientation professionnel pour valider ton choix.
          </p>
        </div>

        {/* Actions */}
        <div className="resultats-actions no-print">
          <button className="btn btn-outline" onClick={onRecommencer}>
            <RotateCcw size={16} /> Refaire mon orientation
          </button>
          <button className="btn btn-outline" onClick={onModifier}>
            <Edit size={16} /> Modifier mes réponses
          </button>
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} /> Imprimer mes résultats
          </button>
        </div>
      </div>

      {/* Modal détail */}
      {modalRec && (
        <DetailModal
          recommandation={modalRec}
          onClose={() => setModalRec(null)}
        />
      )}
    </div>
  );
};
