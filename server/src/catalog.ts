import filieresData from './data/filieres.json';

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
}

// Import statique : tsc copie le JSON dans dist/, le build de production le retrouve
export const filieres: Filiere[] = filieresData;

export const filieresById = new Map(filieres.map((f) => [f.id, f]));

export const FILIERE_IDS = filieres.map((f) => f.id);
