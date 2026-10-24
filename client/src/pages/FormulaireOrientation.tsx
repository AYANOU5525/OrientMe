import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, User, GraduationCap } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import type { DonneesFormulaire } from '../types';
import {
  SERIES_BAC,
  MATIERES_PAR_SERIE,
  COMPETENCES_LISTE,
  DOMAINES_INTERET,
} from '../types';

interface FormulaireProps {
  // Réponses précédentes, pour « Modifier mes réponses »
  initialData?: DonneesFormulaire;
  onSubmit: (data: DonneesFormulaire) => void;
  onBack: () => void;
}

type EtapeForm = 1 | 2 | 3;

const ETAPE_LABELS = ['Profil scolaire', 'Compétences', 'Aspirations'];

export const FormulaireOrientation: React.FC<FormulaireProps> = ({ initialData, onSubmit, onBack }) => {
  const [etape, setEtape] = useState<EtapeForm>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // État Étape 1
  const [prenom, setPrenom] = useState(initialData?.profil.prenom ?? '');
  const [serieBAC, setSerieBAC] = useState(initialData?.profil.serieBAC ?? '');
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialData?.profil.notes ?? {}).map(([matiere, note]) => [matiere, String(note)])
    )
  );

  // État Étape 2
  const [competencesSelectionnees, setCompetencesSelectionnees] = useState<string[]>(
    initialData?.competences.competences ?? []
  );
  const [autreCompetence, setAutreCompetence] = useState(initialData?.competences.autreCompetence ?? '');

  // État Étape 3
  const [domainesInteret, setDomainesInteret] = useState<string[]>(
    initialData?.aspirations.domainesInteret ?? []
  );
  const [metierSouhaite, setMetierSouhaite] = useState(initialData?.aspirations.metierSouhaite ?? '');
  const [loisirs, setLoisirs] = useState(initialData?.aspirations.loisirs ?? '');
  const [preferenceFormation, setPreferenceFormation] = useState<'theorique' | 'pratique' | 'les-deux'>(
    initialData?.aspirations.preferenceFormation ?? 'les-deux'
  );

  // Sur mobile, chaque étape doit s'afficher depuis le haut
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etape]);

  const matieres = serieBAC ? MATIERES_PAR_SERIE[serieBAC] || MATIERES_PAR_SERIE['Autre série'] : [];

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item) as T[]);
    } else {
      setter([...list, item] as T[]);
    }
  };

  const validerEtape1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!prenom.trim()) e.prenom = 'Ton prénom est requis.';
    if (!serieBAC) e.serieBAC = 'Sélectionne ta série du BAC.';
    const notesValides = matieres.filter((m) => notes[m] !== undefined && notes[m] !== '');
    if (notesValides.length === 0) e.notes = 'Saisis au moins une note.';

    const notesInvalides = Object.entries(notes).filter(
      ([, v]) => v !== '' && (parseFloat(v) < 0 || parseFloat(v) > 20)
    );
    if (notesInvalides.length > 0) {
      e.notesRange = 'Les notes doivent être comprises entre 0 et 20.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validerEtape2 = (): boolean => {
    const e: Record<string, string> = {};
    if (competencesSelectionnees.length === 0) {
      e.competences = 'Sélectionne au moins une compétence.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validerEtape3 = (): boolean => {
    const e: Record<string, string> = {};
    if (domainesInteret.length === 0) {
      e.domaines = 'Sélectionne au moins un domaine d\'intérêt.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (etape === 1 && validerEtape1()) setEtape(2);
    else if (etape === 2 && validerEtape2()) setEtape(3);
    else if (etape === 3 && validerEtape3()) {
      // Construire les données finales
      const notesFinales: Record<string, number> = {};
      matieres.forEach((m) => {
        if (notes[m] !== undefined && notes[m] !== '') {
          notesFinales[m] = parseFloat(notes[m]);
        }
      });

      // La compétence libre reste séparée : App l'ajoute à la liste au moment de l'envoi
      onSubmit({
        profil: { prenom: prenom.trim(), serieBAC, notes: notesFinales },
        competences: { competences: competencesSelectionnees, autreCompetence },
        aspirations: { domainesInteret, metierSouhaite, loisirs, preferenceFormation },
      });
    }
  };

  const handleBack = () => {
    if (etape === 1) onBack();
    else setEtape((e) => (e - 1) as EtapeForm);
  };

  return (
    <div className="formulaire-wrapper">
      <div className="formulaire-container">
        {/* Header */}
        <div className="form-header">
          <button className="btn-back" onClick={handleBack}>
            <ChevronLeft size={18} /> Retour
          </button>
          <div className="form-header-info">
            <GraduationCap size={22} className="color-primary" />
            <span className="form-step-label">Étape {etape} sur 3</span>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar step={etape} totalSteps={3} labels={ETAPE_LABELS} />

        {/* ÉTAPE 1 */}
        {etape === 1 && (
          <div className="form-etape">
            <h2 className="form-etape-title">
              <User size={22} /> Ton profil scolaire
            </h2>
            <p className="form-etape-subtitle">
              Ces informations nous aident à comprendre ton parcours académique.
            </p>

            {/* Prénom */}
            <div className="form-group">
              <label className="form-label" htmlFor="prenom">Prénom *</label>
              <input
                id="prenom"
                type="text"
                className={`form-input ${errors.prenom ? 'input-error' : ''}`}
                placeholder="Ton prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                maxLength={50}
              />
              {errors.prenom && <span className="form-error">{errors.prenom}</span>}
            </div>

            {/* Série BAC */}
            <div className="form-group">
              <label className="form-label" htmlFor="serie-bac">Série du BAC *</label>
              <select
                id="serie-bac"
                className={`form-select ${errors.serieBAC ? 'input-error' : ''}`}
                value={serieBAC}
                onChange={(e) => {
                  setSerieBAC(e.target.value);
                  setNotes({});
                }}
              >
                <option value="">Sélectionne ta série</option>
                {SERIES_BAC.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.serieBAC && <span className="form-error">{errors.serieBAC}</span>}
            </div>

            {/* Notes */}
            {serieBAC && (
              <div className="form-group">
                <label className="form-label">Notes scolaires (sur 20)</label>
                <p className="form-hint">
                  Saisis tes notes dans les matières que tu as étudiées. Laisse vide si non applicable.
                </p>
                {errors.notes && <span className="form-error">{errors.notes}</span>}
                {errors.notesRange && <span className="form-error">{errors.notesRange}</span>}

                <div className="notes-grid">
                  {matieres.map((matiere) => (
                    <div key={matiere} className="note-item">
                      <label className="note-label" htmlFor={`note-${matiere}`}>{matiere}</label>
                      <div className="note-input-wrapper">
                        <input
                          id={`note-${matiere}`}
                          type="number"
                          className="note-input"
                          placeholder="—"
                          min={0}
                          max={20}
                          step={0.5}
                          value={notes[matiere] ?? ''}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [matiere]: e.target.value }))
                          }
                        />
                        <span className="note-suffix">/20</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2 */}
        {etape === 2 && (
          <div className="form-etape">
            <h2 className="form-etape-title">Qu'est-ce que tu sais bien faire ?</h2>
            <p className="form-etape-subtitle">
              Sélectionne toutes les compétences qui te correspondent. Sois honnête — cela améliore tes recommandations.
            </p>
            {errors.competences && (
              <div className="form-error-banner">{errors.competences}</div>
            )}

            <div className="chips-grid">
              {COMPETENCES_LISTE.map((comp) => {
                const isSelected = competencesSelectionnees.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    className={`chip ${isSelected ? 'chip-selected' : ''}`}
                    onClick={() =>
                      toggleItem(competencesSelectionnees, comp, setCompetencesSelectionnees)
                    }
                  >
                    {isSelected && <span className="chip-check">✓</span>}
                    {comp}
                  </button>
                );
              })}
            </div>

            <div className="form-group mt-4">
              <label className="form-label" htmlFor="autre-competence">Une autre compétence ? (optionnel)</label>
              <input
                id="autre-competence"
                type="text"
                className="form-input"
                placeholder="Ex: Jouer d'un instrument, Parler 3 langues..."
                value={autreCompetence}
                onChange={(e) => setAutreCompetence(e.target.value)}
                maxLength={80}
              />
            </div>

            <p className="selection-count">
              {competencesSelectionnees.length} compétence(s) sélectionnée(s)
            </p>
          </div>
        )}

        {/* ÉTAPE 3 */}
        {etape === 3 && (
          <div className="form-etape">
            <h2 className="form-etape-title">Quel avenir aimerais-tu construire ?</h2>
            <p className="form-etape-subtitle">
              Tes aspirations sont aussi importantes que tes résultats. Partage-les avec nous.
            </p>

            {/* Domaines d'intérêt */}
            <div className="form-group">
              <label className="form-label">Quels domaines t'intéressent ? *</label>
              {errors.domaines && <span className="form-error">{errors.domaines}</span>}
              <div className="chips-grid">
                {DOMAINES_INTERET.map((domaine) => {
                  const isSelected = domainesInteret.includes(domaine);
                  return (
                    <button
                      key={domaine}
                      type="button"
                      className={`chip ${isSelected ? 'chip-selected' : ''}`}
                      onClick={() =>
                        toggleItem(domainesInteret, domaine, setDomainesInteret)
                      }
                    >
                      {isSelected && <span className="chip-check">✓</span>}
                      {domaine}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Métier souhaité */}
            <div className="form-group">
              <label className="form-label" htmlFor="metier">Quel métier aimerais-tu exercer ? (optionnel)</label>
              <input
                id="metier"
                type="text"
                className="form-input"
                placeholder="Ex: Médecin, Ingénieur logiciel, Entrepreneur..."
                value={metierSouhaite}
                onChange={(e) => setMetierSouhaite(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Loisirs */}
            <div className="form-group">
              <label className="form-label" htmlFor="loisirs">Qu'aimes-tu faire pendant ton temps libre ? (optionnel)</label>
              <textarea
                id="loisirs"
                className="form-textarea"
                placeholder="Ex: Regarder des tutoriels informatiques, Dessiner, Jardiner..."
                value={loisirs}
                onChange={(e) => setLoisirs(e.target.value)}
                rows={3}
                maxLength={200}
              />
            </div>

            {/* Préférence de formation */}
            <div className="form-group">
              <label className="form-label">Préfères-tu une formation plutôt... ?</label>
              <div className="radio-group">
                {(['theorique', 'pratique', 'les-deux'] as const).map((val) => {
                  const labels = { theorique: 'Théorique', pratique: 'Pratique', 'les-deux': 'Les deux' };
                  return (
                    <label key={val} className={`radio-option ${preferenceFormation === val ? 'radio-selected' : ''}`}>
                      <input
                        type="radio"
                        name="preference"
                        value={val}
                        checked={preferenceFormation === val}
                        onChange={() => setPreferenceFormation(val)}
                      />
                      {labels[val]}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="form-nav">
          <button className="btn btn-outline" onClick={handleBack}>
            <ChevronLeft size={16} />
            Précédent
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            {etape === 3 ? (
              <>
                Découvrir mes filières
                <span className="ml-1">✨</span>
              </>
            ) : (
              <>
                Continuer
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
