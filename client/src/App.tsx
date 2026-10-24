import { useEffect, useState } from 'react';
import { AccueilPage } from './pages/AccueilPage';
import { FormulaireOrientation } from './pages/FormulaireOrientation';
import { ResultatsPage } from './pages/ResultatsPage';
import { PreparationPage } from './pages/PreparationPage';
import { ConseillersPage } from './pages/ConseillersPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorCard } from './components/ErrorCard';
import { soumettreOrientation, demanderPlanRentree, ErreurOrientation } from './services/api';
import type { CodeErreur } from './services/api';
import { QUESTIONS_PERSONNALITE } from './types';
import type {
  ResultatOrientation,
  DonneesFormulaire,
  DemandeOrientation,
  PlanRentree,
  Recommandation,
} from './types';
import './App.css';

type EtapeApp = 'accueil' | 'formulaire' | 'chargement' | 'resultats' | 'preparation' | 'erreur';

// Action à relancer avec « Réessayer » : l'orientation ou le plan de rentrée
type Action = 'orientation' | 'preparation';

// Derniers résultats, gardés dans ce navigateur uniquement pour survivre à un rechargement de la page
interface Session {
  prenom: string;
  dernierProfil: DonneesFormulaire;
  resultats: ResultatOrientation;
  filiereChoisie: Recommandation | null;
  plan: PlanRentree | null;
}

const CLE_SESSION = 'orienteme:session';

function lireSession(): Session | null {
  try {
    const session = JSON.parse(localStorage.getItem(CLE_SESSION) ?? 'null') as Session | null;
    return Array.isArray(session?.resultats?.recommandations) && session?.dernierProfil ? session : null;
  } catch {
    return null;
  }
}

function ecrireSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    else localStorage.removeItem(CLE_SESSION);
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'application fonctionne sans
  }
}

function versDemande(data: DonneesFormulaire): DemandeOrientation {
  const autreCompetence = data.competences.autreCompetence.trim();
  return {
    serieBAC: data.profil.serieBAC,
    notes: data.profil.notes,
    competences: autreCompetence
      ? [...data.competences.competences, autreCompetence]
      : data.competences.competences,
    domainesInteret: data.aspirations.domainesInteret,
    metierSouhaite: data.aspirations.metierSouhaite,
    loisirs: data.aspirations.loisirs,
    preferenceFormation: data.aspirations.preferenceFormation,
    personnalite: QUESTIONS_PERSONNALITE.filter((q) => data.personnalite?.[q.id]).map(
      (q) => `${q.question} ${data.personnalite[q.id]}`
    ),
  };
}

const estEspaceConseillers = () => window.location.hash === '#conseillers';

function App() {
  const [etape, setEtape] = useState<EtapeApp>('accueil');
  const [action, setAction] = useState<Action>('orientation');
  const [resultats, setResultats] = useState<ResultatOrientation | null>(null);
  const [prenom, setPrenom] = useState('');
  const [erreur, setErreur] = useState<{ message: string; code: CodeErreur }>({
    message: '',
    code: 'UNKNOWN',
  });
  const [dernierProfil, setDernierProfil] = useState<DonneesFormulaire | null>(null);
  const [filiereChoisie, setFiliereChoisie] = useState<Recommandation | null>(null);
  const [plan, setPlan] = useState<PlanRentree | null>(null);
  // Session trouvée au chargement de la page ; remplacée par la session en cours dès qu'il y a des résultats
  const [sessionInitiale, setSessionInitiale] = useState<Session | null>(lireSession);
  const [conseillers, setConseillers] = useState(estEspaceConseillers);

  const sessionSauvegardee: Session | null =
    resultats && dernierProfil ? { prenom, dernierProfil, resultats, filiereChoisie, plan } : sessionInitiale;

  // Chaque nouvel écran s'affiche depuis le haut
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etape]);

  // L'espace conseillers s'ouvre avec l'adresse …/#conseillers
  useEffect(() => {
    const surChangement = () => setConseillers(estEspaceConseillers());
    window.addEventListener('hashchange', surChangement);
    return () => window.removeEventListener('hashchange', surChangement);
  }, []);

  // Sauvegarde automatique des derniers résultats dans ce navigateur
  useEffect(() => {
    if (resultats && dernierProfil) {
      ecrireSession({ prenom, dernierProfil, resultats, filiereChoisie, plan });
    }
  }, [prenom, dernierProfil, resultats, filiereChoisie, plan]);

  const afficherErreur = (error: unknown) => {
    if (error instanceof ErreurOrientation) {
      setErreur({ message: error.message, code: error.code });
    } else {
      setErreur({ message: 'Une erreur inattendue est survenue.', code: 'UNKNOWN' });
    }
    setEtape('erreur');
  };

  const handleSubmitFormulaire = async (data: DonneesFormulaire) => {
    setPrenom(data.profil.prenom);
    setDernierProfil(data);
    setAction('orientation');
    setEtape('chargement');

    try {
      const response = await soumettreOrientation(versDemande(data));
      setResultats(response.data);
      setFiliereChoisie(null);
      setPlan(null);
      setEtape('resultats');
    } catch (error: unknown) {
      afficherErreur(error);
    }
  };

  // L'étudiant a choisi sa filière : l'IA lui prépare un plan pour la rentrée
  const handleChoisirFiliere = async (recommandation: Recommandation) => {
    // Sans profil en mémoire, le plan ne peut pas être personnalisé : retour au formulaire
    if (!dernierProfil) {
      setEtape('formulaire');
      return;
    }
    // Plan déjà généré pour cette filière : pas de nouvel appel à l'IA
    if (plan?.filiereId === recommandation.filiereId) {
      setEtape('preparation');
      return;
    }
    setFiliereChoisie(recommandation);
    setAction('preparation');
    setEtape('chargement');

    try {
      const response = await demanderPlanRentree({
        profil: versDemande(dernierProfil),
        filiereId: recommandation.filiereId,
        competencesARenforcer: recommandation.competencesARenforcer.slice(0, 5),
      });
      setPlan(response.data);
      setEtape('preparation');
    } catch (error: unknown) {
      afficherErreur(error);
    }
  };

  const handleReessayer = () => {
    if (action === 'preparation' && filiereChoisie) {
      handleChoisirFiliere(filiereChoisie);
    } else if (dernierProfil) {
      handleSubmitFormulaire(dernierProfil);
    } else {
      setEtape('formulaire');
    }
  };

  // Reprend les derniers résultats sauvegardés dans ce navigateur
  const handleReprendre = () => {
    if (!sessionSauvegardee) return;
    setPrenom(sessionSauvegardee.prenom);
    setDernierProfil(sessionSauvegardee.dernierProfil);
    setResultats(sessionSauvegardee.resultats);
    setFiliereChoisie(sessionSauvegardee.filiereChoisie);
    setPlan(sessionSauvegardee.plan);
    setEtape('resultats');
  };

  const handleRecommencer = () => {
    setResultats(null);
    setPlan(null);
    setFiliereChoisie(null);
    setPrenom('');
    setDernierProfil(null);
    ecrireSession(null);
    setSessionInitiale(null);
    setEtape('accueil');
  };

  // Retour au formulaire, pré-rempli avec les dernières réponses
  const handleModifier = () => {
    setResultats(null);
    setPlan(null);
    setEtape('formulaire');
  };

  // Réessayer est inutile tant que la clé API n'est pas configurée
  const peutReessayer = erreur.code !== 'AI_NOT_CONFIGURED';

  if (conseillers) {
    return (
      <div className="app-root">
        <ConseillersPage onRetour={() => { window.location.hash = ''; }} />
      </div>
    );
  }

  return (
    <div className="app-root">
      {etape === 'accueil' && (
        <AccueilPage
          onStart={() => setEtape('formulaire')}
          onReprendre={sessionSauvegardee ? handleReprendre : undefined}
          prenomSauvegarde={sessionSauvegardee?.prenom}
        />
      )}

      {etape === 'formulaire' && (
        <FormulaireOrientation
          initialData={dernierProfil ?? undefined}
          onSubmit={handleSubmitFormulaire}
          onBack={() => setEtape('accueil')}
        />
      )}

      {etape === 'chargement' && <LoadingScreen variante={action} />}

      {etape === 'erreur' && (
        <div className="error-page">
          <ErrorCard
            message={erreur.message}
            onRetry={peutReessayer ? handleReessayer : undefined}
          />
          {action === 'preparation' && resultats ? (
            <button className="btn btn-ghost mt-4" onClick={() => setEtape('resultats')}>
              ← Revenir à mes recommandations
            </button>
          ) : (
            <button className="btn btn-ghost mt-4" onClick={() => setEtape('accueil')}>
              ← Retour à l'accueil
            </button>
          )}
        </div>
      )}

      {etape === 'resultats' && resultats && (
        <ResultatsPage
          prenom={prenom}
          resultats={resultats}
          demande={dernierProfil ? versDemande(dernierProfil) : undefined}
          onChoisir={handleChoisirFiliere}
          onRecommencer={handleRecommencer}
          onModifier={handleModifier}
        />
      )}

      {etape === 'preparation' && plan && (
        <PreparationPage
          prenom={prenom}
          plan={plan}
          onRetourResultats={() => setEtape('resultats')}
          onRecommencer={handleRecommencer}
        />
      )}
    </div>
  );
}

export default App;
