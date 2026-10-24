import React, { useState } from 'react';
import { ArrowLeft, Lock, RefreshCw } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getStatistiques, ErreurOrientation } from '../services/api';
import type { Statistiques } from '../types';

interface ConseillersPageProps {
  onRetour: () => void;
}

const CLE_MOT_DE_PASSE = 'orienteme:conseillers';

function lireMotDePasse(): string {
  try {
    return sessionStorage.getItem(CLE_MOT_DE_PASSE) ?? '';
  } catch {
    return '';
  }
}

function ecrireMotDePasse(valeur: string) {
  try {
    sessionStorage.setItem(CLE_MOT_DE_PASSE, valeur);
  } catch {
    // Stockage indisponible : il faudra ressaisir le mot de passe
  }
}

// Classement horizontal : une seule série, donc une seule couleur et pas de légende
const Classement: React.FC<{ titre: string; valeurs: Record<string, number>; libelles?: Record<string, string>; max?: number }> = ({
  titre,
  valeurs,
  libelles = {},
  max = 10,
}) => {
  const lignes = Object.entries(valeurs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max);
  const plusGrand = Math.max(1, ...lignes.map(([, v]) => v));

  return (
    <section className="stats-carte">
      <h2 className="stats-titre">{titre}</h2>
      {lignes.length === 0 ? (
        <p className="stats-vide">Pas encore de données.</p>
      ) : (
        <ul className="classement">
          {lignes.map(([cle, valeur]) => (
            <li key={cle} className="classement-ligne" title={`${libelles[cle] ?? cle} : ${valeur}`}>
              <span className="classement-libelle">{libelles[cle] ?? cle}</span>
              <span className="classement-piste">
                <span className="classement-barre" style={{ width: `${(valeur / plusGrand) * 100}%` }} />
              </span>
              <span className="classement-valeur">{valeur}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// Les 30 derniers jours, calculés une fois à l'ouverture de la page
function trenteDerniersJours() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { cle: d.toISOString().slice(0, 10), libelle: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) };
  });
}

// Orientations par jour sur les 30 derniers jours, avec infobulle au survol et vue tableau
const ActiviteParJour: React.FC<{ parJour: Record<string, number> }> = ({ parJour }) => {
  const [tableau, setTableau] = useState(false);
  const [periode] = useState(trenteDerniersJours);
  const jours = periode.map((j) => ({ ...j, valeur: parJour[j.cle] ?? 0 }));
  const plusGrand = Math.max(1, ...jours.map((j) => j.valeur));

  return (
    <section className="stats-carte stats-large">
      <div className="stats-entete">
        <h2 className="stats-titre">Orientations par jour (30 derniers jours)</h2>
        <button className="btn-expand" onClick={() => setTableau(!tableau)}>
          {tableau ? 'Voir le graphique' : 'Voir en tableau'}
        </button>
      </div>

      {tableau ? (
        <table className="stats-table">
          <thead>
            <tr>
              <th>Jour</th>
              <th>Orientations</th>
            </tr>
          </thead>
          <tbody>
            {jours.filter((j) => j.valeur > 0).map((j) => (
              <tr key={j.cle}>
                <td>{j.libelle}</td>
                <td>{j.valeur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className="colonnes" role="img" aria-label="Nombre d'orientations par jour sur les 30 derniers jours">
            <span className="colonnes-max">{plusGrand}</span>
            {jours.map((j) => (
              <div key={j.cle} className="colonne">
                <span className="colonne-barre" style={{ height: `${(j.valeur / plusGrand) * 100}%` }} />
                <span className="colonne-infobulle">
                  {j.libelle} : {j.valeur} orientation{j.valeur > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="colonnes-axe">
            <span>{jours[0].libelle}</span>
            <span>{jours[jours.length - 1].libelle}</span>
          </div>
        </>
      )}
    </section>
  );
};

export const ConseillersPage: React.FC<ConseillersPageProps> = ({ onRetour }) => {
  const [motDePasse, setMotDePasse] = useState(lireMotDePasse);
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const charger = async (valeur = motDePasse) => {
    if (!valeur.trim()) return;
    setChargement(true);
    setErreur('');
    try {
      setStats(await getStatistiques(valeur.trim()));
      ecrireMotDePasse(valeur.trim());
    } catch (error) {
      setStats(null);
      setErreur(error instanceof ErreurOrientation ? error.message : 'Une erreur inattendue est survenue.');
    } finally {
      setChargement(false);
    }
  };

  const nomsFilieres = Object.fromEntries((stats?.filieres ?? []).map((f) => [f.id, f.nom]));
  const tauxChoix = stats && stats.orientations > 0 ? Math.round((stats.choix / stats.orientations) * 100) : 0;
  const nombreAvis = stats ? stats.avisPositifs + stats.avisNegatifs : 0;
  const satisfaction = stats && nombreAvis > 0 ? Math.round((stats.avisPositifs / nombreAvis) * 100) : null;

  return (
    <div className="resultats-page">
      <div className="resultats-container">
        <div className="resultats-header">
          <Logo size="md" />
          <div className="resultats-header-text">
            <h1 className="resultats-title">Espace conseillers</h1>
            <p className="resultats-subtitle">
              Statistiques anonymes des orientations : aucun prénom, aucune note ni aucune réponse libre n'est
              enregistré.
            </p>
          </div>
        </div>

        {!stats && (
          <form
            className="stats-connexion"
            onSubmit={(e) => {
              e.preventDefault();
              charger();
            }}
          >
            <label className="form-label" htmlFor="mot-de-passe">
              <Lock size={14} /> Mot de passe
            </label>
            <input
              id="mot-de-passe"
              type="password"
              className="form-input"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete="current-password"
            />
            {erreur && <p className="form-error">{erreur}</p>}
            <button className="btn btn-primary" type="submit" disabled={chargement || !motDePasse.trim()}>
              {chargement ? 'Connexion…' : 'Voir les statistiques'}
            </button>
          </form>
        )}

        {stats && (
          <>
            <div className="stats-kpis">
              <div className="stats-kpi">
                <span className="stats-kpi-libelle">Orientations réalisées</span>
                <span className="stats-kpi-valeur">{stats.orientations}</span>
              </div>
              <div className="stats-kpi">
                <span className="stats-kpi-libelle">Plans de rentrée demandés</span>
                <span className="stats-kpi-valeur">{stats.choix}</span>
              </div>
              <div className="stats-kpi">
                <span className="stats-kpi-libelle">Taux de choix d'une filière</span>
                <span className="stats-kpi-valeur">{tauxChoix} %</span>
              </div>
              <div className="stats-kpi">
                <span className="stats-kpi-libelle">Élèves aidés (avis positifs)</span>
                <span className="stats-kpi-valeur">{satisfaction === null ? '—' : `${satisfaction} %`}</span>
                <span className="stats-kpi-detail">{nombreAvis} avis</span>
              </div>
              <div className="stats-kpi">
                <span className="stats-kpi-libelle">Données depuis le</span>
                <span className="stats-kpi-valeur stats-kpi-date">
                  {stats.depuis ? new Date(stats.depuis).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
            </div>

            <ActiviteParJour parJour={stats.parJour} />

            <div className="stats-grille">
              <Classement titre="Filières les plus recommandées" valeurs={stats.filieresRecommandees} libelles={nomsFilieres} />
              <Classement titre="Filières choisies par les élèves" valeurs={stats.filieresChoisies} libelles={nomsFilieres} />
              <Classement titre="Séries du BAC" valeurs={stats.parSerie} />
              <Classement titre="Domaines d'intérêt" valeurs={stats.parDomaine} />
            </div>

            <div className="resultats-actions">
              <button className="btn btn-outline" onClick={() => charger()} disabled={chargement}>
                <RefreshCw size={16} /> Actualiser
              </button>
            </div>
          </>
        )}

        <div className="resultats-actions mt-4">
          <button className="btn btn-ghost" onClick={onRetour}>
            <ArrowLeft size={16} /> Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};
