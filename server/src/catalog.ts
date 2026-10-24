import filieresData from './data/filieres.json';
import etablissementsData from './data/etablissements.json';

export interface Filiere {
  id: string;
  nom: string;
  description: string;
  domaines: string[];
  matieresPertinentes: string[];
  competencesUtiles: string[];
  debouches: string[];
  pointsVigilance: string[];
  prerequis: string;
  duree: string;
}

export interface Etablissement {
  id: string;
  nom: string;
  ville: string;
  statut: string;
  filieres: string[];
  details: string;
  source: string;
}

// Import statique : tsc copie le JSON dans dist/, le build de production le retrouve
export const filieres: Filiere[] = filieresData;

export const filieresById = new Map(filieres.map((f) => [f.id, f]));

export const FILIERE_IDS = filieres.map((f) => f.id);

// Établissements togolais vérifiés à la main (sources publiques), jamais générés par l'IA
export const etablissements: Etablissement[] = etablissementsData.etablissements;
export const ETABLISSEMENTS_VERIFIES_LE = etablissementsData.verifieLe;
export const ETABLISSEMENTS_AVERTISSEMENT = etablissementsData.avertissement;

export function etablissementsPour(filiereId: string): Etablissement[] {
  return etablissements.filter((e) => e.filieres.includes(filiereId));
}
