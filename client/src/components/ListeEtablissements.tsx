import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import type { Etablissement } from '../types';

interface ListeEtablissementsProps {
  etablissements: Etablissement[];
}

// Écoles togolaises vérifiées à la main, avec leur source : elles ne viennent jamais de l'IA
export const ListeEtablissements: React.FC<ListeEtablissementsProps> = ({ etablissements }) => {
  if (etablissements.length === 0) return null;

  return (
    <div className="etablissements">
      <ul className="etablissements-liste">
        {etablissements.map((e) => (
          <li key={e.id} className="etablissement">
            <div className="etablissement-entete">
              <span className="etablissement-nom">{e.nom}</span>
              <span className={`etablissement-statut statut-${e.statut.replace(/\s+/g, '-').toLowerCase()}`}>
                {e.statut}
              </span>
            </div>
            <p className="etablissement-ville">
              <MapPin size={13} /> {e.ville}
            </p>
            <p className="etablissement-details">{e.details}</p>
            <a className="etablissement-source no-print" href={e.source} target="_blank" rel="noopener noreferrer">
              Source <ExternalLink size={12} />
            </a>
          </li>
        ))}
      </ul>
      <p className="etablissements-note">
        Liste vérifiée en octobre 2026 à partir de sources publiques. Les filières, conditions d'admission et dates de
        concours changent chaque année : confirme toujours auprès de l'établissement.
      </p>
    </div>
  );
};
