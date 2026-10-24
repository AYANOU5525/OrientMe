import { useState } from 'react';
import { AccueilPage } from './pages/AccueilPage';
import { FormulaireOrientation } from './pages/FormulaireOrientation';
import { ResultatsPage } from './pages/ResultatsPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorCard } from './components/ErrorCard';
import { soumettreOrientation, ErreurOrientation } from './services/api';
import type { CodeErreur } from './services/api';
import type { ResultatOrientation, DonneesFormulaire } from './types';
import './App.css';

type EtapeApp = 'accueil' | 'formulaire' | 'chargement' | 'resultats' | 'erreur';

function App() {
  const [etape, setEtape] = useState<EtapeApp>('accueil');
  const [resultats, setResultats] = useState<ResultatOrientation | null>(null);
  const [modele, setModele] = useState('');
  const [prenom, setPrenom] = useState('');
  const [erreur, setErreur] = useState<{ message: string; code: CodeErreur }>({
    message: '',
    code: 'UNKNOWN',
  });
  const [dernierProfil, setDernierProfil] = useState<DonneesFormulaire | null>(null);

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
    setEtape('chargement');

    const autreCompetence = data.competences.autreCompetence.trim();

    try {
      const response = await soumettreOrientation({
        serieBAC: data.profil.serieBAC,
        notes: data.profil.notes,
        competences: autreCompetence
          ? [...data.competences.competences, autreCompetence]
          : data.competences.competences,
        domainesInteret: data.aspirations.domainesInteret,
        metierSouhaite: data.aspirations.metierSouhaite,
        loisirs: data.aspirations.loisirs,
        preferenceFormation: data.aspirations.preferenceFormation,
      });

      setResultats(response.data);
      setModele(response.model);
      setEtape('resultats');
    } catch (error: unknown) {
      afficherErreur(error);
    }
  };

  const handleReessayer = () => {
    if (dernierProfil) {
      handleSubmitFormulaire(dernierProfil);
    } else {
      setEtape('formulaire');
    }
  };

  const handleRecommencer = () => {
    setResultats(null);
    setPrenom('');
    setDernierProfil(null);
    setEtape('accueil');
  };

  // Retour au formulaire, pré-rempli avec les dernières réponses
  const handleModifier = () => {
    setResultats(null);
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

      {etape === 'chargement' && <LoadingScreen />}

      {etape === 'erreur' && (
        <div className="error-page">
          <ErrorCard
            message={erreur.message}
            onRetry={peutReessayer ? handleReessayer : undefined}
          />
          <button
            className="btn btn-ghost mt-4"
            onClick={() => setEtape('accueil')}
          >
            ← Retour à l'accueil
          </button>
        </div>
      )}

      {etape === 'resultats' && resultats && (
        <ResultatsPage
          prenom={prenom}
          resultats={resultats}
          modele={modele}
          onRecommencer={handleRecommencer}
          onModifier={handleModifier}
        />
      )}
    </div>
  );
}

export default App;
