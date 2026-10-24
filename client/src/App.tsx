import React, { useState } from 'react';
import { AccueilPage } from './pages/AccueilPage';
import { FormulaireOrientation } from './pages/FormulaireOrientation';
import { ResultatsPage } from './pages/ResultatsPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorCard } from './components/ErrorCard';
import { soumettreOrientation, getDemo } from './services/api';
import { ResultatOrientation, ProfilScolaire, Competences, Aspirations } from './types';
import './App.css';

type EtapeApp = 'accueil' | 'formulaire' | 'chargement' | 'resultats' | 'erreur';

function App() {
  const [etape, setEtape] = useState<EtapeApp>('accueil');
  const [resultats, setResultats] = useState<ResultatOrientation | null>(null);
  const [prenom, setPrenom] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [erreur, setErreur] = useState('');
  const [dernierProfil, setDernierProfil] = useState<{
    profil: ProfilScolaire;
    competences: Competences;
    aspirations: Aspirations;
  } | null>(null);

  const handleStartOrientation = () => {
    setEtape('formulaire');
  };

  const handleSubmitFormulaire = async (data: {
    profil: ProfilScolaire;
    competences: Competences;
    aspirations: Aspirations;
  }) => {
    setPrenom(data.profil.prenom);
    setDernierProfil(data);
    setEtape('chargement');
    setIsDemo(false);

    try {
      const allCompetences = data.competences.autreCompetence?.trim()
        ? [...data.competences.competences, data.competences.autreCompetence.trim()]
        : data.competences.competences;

      const response = await soumettreOrientation({
        serieBAC: data.profil.serieBAC,
        notes: data.profil.notes,
        competences: allCompetences,
        domainesInteret: data.aspirations.domainesInteret,
        metierSouhaite: data.aspirations.metierSouhaite,
        loisirs: data.aspirations.loisirs,
        preferenceFormation: data.aspirations.preferenceFormation,
      });

      setResultats(response.data);
      setEtape('resultats');
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la connexion au serveur.';

      // Vérifier si c'est un problème de serveur non configuré
      const isServiceUnavailable =
        msg.includes('SERVICE_UNAVAILABLE') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('non configuré') ||
        msg.includes('Network Error');

      if (isServiceUnavailable) {
        setErreur(
          'Le service d\'orientation IA n\'est pas disponible pour le moment. Vérifiez que le serveur est démarré et que la clé Gemini est configurée.'
        );
      } else {
        setErreur(msg);
      }
      setEtape('erreur');
    }
  };

  const handleReessayer = () => {
    if (dernierProfil) {
      handleSubmitFormulaire(dernierProfil);
    } else {
      setEtape('formulaire');
    }
  };

  const handleVoirDemo = async () => {
    setEtape('chargement');
    try {
      const response = await getDemo();
      setResultats(response.data);
      setPrenom('Kofi');
      setIsDemo(true);
      setEtape('resultats');
    } catch {
      setErreur('Impossible de charger la démonstration. Vérifiez que le serveur est démarré.');
      setEtape('erreur');
    }
  };

  const handleRecommencer = () => {
    setResultats(null);
    setPrenom('');
    setIsDemo(false);
    setDernierProfil(null);
    setEtape('accueil');
  };

  const handleModifier = () => {
    setResultats(null);
    setIsDemo(false);
    setEtape('formulaire');
  };

  return (
    <div className="app-root">
      {etape === 'accueil' && (
        <AccueilPage onStart={handleStartOrientation} />
      )}

      {etape === 'formulaire' && (
        <FormulaireOrientation
          onSubmit={handleSubmitFormulaire}
          onBack={() => setEtape('accueil')}
        />
      )}

      {etape === 'chargement' && <LoadingScreen />}

      {etape === 'erreur' && (
        <div className="error-page">
          <ErrorCard
            message={erreur}
            onRetry={handleReessayer}
            onDemo={handleVoirDemo}
            showDemo={true}
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
          isDemo={isDemo}
          onRecommencer={handleRecommencer}
          onModifier={handleModifier}
        />
      )}
    </div>
  );
}

export default App;
