import { useEffect, useState } from 'react';
import { AccueilPage } from './pages/AccueilPage';
import { FormulaireOrientation } from './pages/FormulaireOrientation';
import { ResultatsPage } from './pages/ResultatsPage';
import { PreparationPage } from './pages/PreparationPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorCard } from './components/ErrorCard';
import { soumettreOrientation, demanderPlanRentree, ErreurOrientation } from './services/api';
import type { CodeErreur } from './services/api';
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
  };
}

function App() {
  const [etape, setEtape] = useState<EtapeApp>('accueil');
  const [action, setAction] = useState<Action>('orientation');
  const [resultats, setResultats] = useState<ResultatOrientation | null>(null);
  const [modele, setModele] = useState('');
  const [prenom, setPrenom] = useState('');
  const [erreur, setErreur] = useState<{ message: string; code: CodeErreur }>({
    message: '',
    code: 'UNKNOWN',
  });
  const [dernierProfil, setDernierProfil] = useState<DonneesFormulaire | null>(null);
  const [filiereChoisie, setFiliereChoisie] = useState<Recommandation | null>(null);
  const [plan, setPlan] = useState<{ data: PlanRentree; modele: string } | null>(null);

  // Chaque nouvel écran s'affiche depuis le haut
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etape]);

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
      setModele(response.model);
      setEtape('resultats');
    } catch (error: unknown) {
      afficherErreur(error);
    }
  };

  // L'étudiant a choisi sa filière : Gemma lui prépare un plan pour la rentrée
  const handleChoisirFiliere = async (recommandation: Recommandation) => {
    // Sans profil en mémoire, le plan ne peut pas être personnalisé : retour au formulaire
    if (!dernierProfil) {
      setEtape('formulaire');
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
      setPlan({ data: response.data, modele: response.model });
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

  const handleRecommencer = () => {
    setResultats(null);
    setPlan(null);
    setFiliereChoisie(null);
    setPrenom('');
    setDernierProfil(null);
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

  return (
    <div className="app-root">
      {etape === 'accueil' && (
        <AccueilPage onStart={() => setEtape('formulaire')} />
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
          modele={modele}
          onChoisir={handleChoisirFiliere}
          onRecommencer={handleRecommencer}
          onModifier={handleModifier}
        />
      )}

      {etape === 'preparation' && plan && (
        <PreparationPage
          prenom={prenom}
          plan={plan.data}
          modele={plan.modele}
          onRetourResultats={() => setEtape('resultats')}
          onRecommencer={handleRecommencer}
        />
      )}
    </div>
  );
}

export default App;
