import React, { useState } from 'react';
import { Columns2 } from 'lucide-react';
import type { Recommandation } from '../types';

interface ComparateurFilieresProps {
  recommandations: Recommandation[];
  // Notes de l'étudiant, affichées à côté des matières clés de chaque filière
  notes?: Record<string, number>;
}

interface Ligne {
  titre: string;
  valeur: (rec: Recommandation) => React.ReactNode;
}

const liste = (items: string[] | undefined) =>
  items && items.length > 0 ? (
    <ul className="rec-list">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    '—'
  );

export const ComparateurFilieres: React.FC<ComparateurFilieresProps> = ({ recommandations, notes = {} }) => {
  const [gaucheId, setGaucheId] = useState(recommandations[0]?.filiereId ?? '');
  const [droiteId, setDroiteId] = useState(recommandations[1]?.filiereId ?? '');

  if (recommandations.length < 2) return null;

  const gauche = recommandations.find((r) => r.filiereId === gaucheId) ?? recommandations[0];
  const droite = recommandations.find((r) => r.filiereId === droiteId) ?? recommandations[1];

  const lignes: Ligne[] = [
    { titre: 'Durée des études', valeur: (r) => r.duree ?? '—' },
    { titre: 'Prérequis', valeur: (r) => r.prerequis ?? '—' },
    {
      titre: 'Matières clés',
      valeur: (r) =>
        liste(
          r.matieresPertinentes?.map((m) => (notes[m] !== undefined ? `${m} (ta note : ${notes[m]}/20)` : m))
        ),
    },
    { titre: 'Compétences à renforcer', valeur: (r) => liste(r.competencesARenforcer) },
    { titre: 'Débouchés', valeur: (r) => liste(r.debouches) },
    {
      titre: 'Où étudier au Togo',
      valeur: (r) => liste(r.etablissements?.map((e) => `${e.nom} (${e.ville})`)),
    },
  ];

  const selecteur = (valeur: string, onChange: (id: string) => void, label: string) => (
    <select className="form-select" value={valeur} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {recommandations.map((r) => (
        <option key={r.filiereId} value={r.filiereId}>
          {r.nom}
        </option>
      ))}
    </select>
  );

  return (
    <section className="comparateur no-print">
      <h2 className="prep-section-title">
        <Columns2 size={22} /> Compare deux filières
      </h2>

      <div className="comparateur-ligne comparateur-choix">
        <span className="comparateur-titre" />
        {selecteur(gauche.filiereId, setGaucheId, 'Première filière à comparer')}
        {selecteur(droite.filiereId, setDroiteId, 'Seconde filière à comparer')}
      </div>

      {lignes.map((ligne) => (
        <div key={ligne.titre} className="comparateur-ligne">
          <span className="comparateur-titre">{ligne.titre}</span>
          <div className="comparateur-cellule">{ligne.valeur(gauche)}</div>
          <div className="comparateur-cellule">{ligne.valeur(droite)}</div>
        </div>
      ))}
    </section>
  );
};
