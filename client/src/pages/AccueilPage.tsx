import React from 'react';
import {
  ClipboardList,
  Users,
  Target,
  ChevronRight,
  Star,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

interface AccueilPageProps {
  onStart: () => void;
}

export const AccueilPage: React.FC<AccueilPageProps> = ({ onStart }) => {
  const etapes = [
    {
      numero: '01',
      icon: <ClipboardList size={28} />,
      titre: 'Renseigne ton profil scolaire',
      description:
        'Indique ta série du BAC et tes notes par matière. Ces données nous aident à identifier tes points forts académiques.',
    },
    {
      numero: '02',
      icon: <Users size={28} />,
      titre: 'Partage tes compétences et tes ambitions',
      description:
        'Décris ce que tu sais faire et le type de métier ou domaine qui t\'attire. Tes aspirations comptent autant que tes notes.',
    },
    {
      numero: '03',
      icon: <Target size={28} />,
      titre: 'Découvre les filières adaptées',
      description:
        'Notre IA analyse ton profil complet et te propose trois filières universitaires avec des explications personnalisées.',
    },
  ];

  const avantages = [
    {
      titre: 'Analyse personnalisée',
      desc: 'Chaque recommandation est basée sur ton profil unique, pas sur une liste générique.',
    },
    {
      titre: 'Recommandations expliquées',
      desc: 'Tu comprends pourquoi chaque filière est pertinente pour ton profil spécifique.',
    },
    {
      titre: 'Pistes de métiers',
      desc: 'Pour chaque filière, découvre les débouchés professionnels concrets.',
    },
    {
      titre: 'Contexte togolais',
      desc: 'Les filières proposées sont adaptées aux réalités et opportunités du Togo.',
    },
  ];

  const scrollToHowItWorks = () => {
    document.getElementById('comment-ca-marche')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="page-accueil">
      <Navbar onStart={onStart} onHowItWorks={scrollToHowItWorks} />

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Star size={14} />
            <span>Orientation post-BAC par Intelligence Artificielle</span>
          </div>

          <h1 className="hero-title">
            Ton BAC est une étape.{' '}
            <span className="hero-title-accent">
              Ton avenir mérite le bon choix.
            </span>
          </h1>

          <p className="hero-subtitle">
            Découvre les filières qui correspondent à tes résultats scolaires, à tes compétences et à tes ambitions grâce à une orientation personnalisée par intelligence artificielle.
          </p>

          <div className="hero-actions">
            <button className="btn btn-hero-primary" onClick={onStart}>
              Découvrir mon orientation
              <ArrowRight size={18} />
            </button>
            <button className="btn btn-hero-secondary" onClick={scrollToHowItWorks}>
              Comment ça marche ?
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card hero-card-1">
              <div className="hero-card-icon">🎓</div>
              <div>
                <div className="hero-card-title">Informatique</div>
                <div className="hero-card-desc">Développement logiciel</div>
              </div>
              <div className="hero-card-badge match">Recommandé</div>
            </div>
            <div className="hero-card hero-card-2">
              <div className="hero-card-icon">⚡</div>
              <div>
                <div className="hero-card-title">Génie Électrique</div>
                <div className="hero-card-desc">Électronique & Énergie</div>
              </div>
              <div className="hero-card-badge">Pertinent</div>
            </div>
            <div className="hero-card hero-card-3">
              <div className="hero-card-icon">📊</div>
              <div>
                <div className="hero-card-title">Finance</div>
                <div className="hero-card-desc">Gestion & Banque</div>
              </div>
              <div className="hero-card-badge">À explorer</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section id="comment-ca-marche" className="section-how">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Comment ça marche ?</h2>
            <p className="section-subtitle">
              Un parcours guidé en trois étapes pour une orientation éclairée.
            </p>
          </div>

          <div className="steps-grid">
            {etapes.map((etape, index) => (
              <div key={index} className="step-card">
                <div className="step-card-header">
                  <div className="step-card-numero">{etape.numero}</div>
                  <div className="step-card-icon">{etape.icon}</div>
                </div>
                <h3 className="step-card-title">{etape.titre}</h3>
                <p className="step-card-desc">{etape.description}</p>
                {index < etapes.length - 1 && (
                  <div className="step-arrow">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="section-avantages">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Pourquoi Orienteme ?</h2>
          </div>

          <div className="avantages-grid">
            {avantages.map((av, i) => (
              <div key={i} className="avantage-card">
                <div className="avantage-check">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="avantage-title">{av.titre}</h4>
                  <p className="avantage-desc">{av.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta">
        <div className="section-container">
          <div className="cta-box">
            <h2 className="cta-title">Prêt à découvrir ta voie ?</h2>
            <p className="cta-subtitle">
              Complète le questionnaire en quelques minutes et reçois tes recommandations personnalisées.
            </p>
            <button className="btn btn-hero-primary" onClick={onStart}>
              Commencer mon orientation
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <p>Orienteme — Hackathon Togo 2024</p>
          <p className="footer-note">
            Les recommandations sont indicatives et ne remplacent pas un conseiller d'orientation professionnel.
          </p>
        </div>
      </footer>
    </div>
  );
};
