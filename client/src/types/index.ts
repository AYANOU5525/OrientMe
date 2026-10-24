// Types partagés frontend
export interface Note {
  matiere: string;
  valeur: number | '';
}

export interface ProfilScolaire {
  prenom: string;
  serieBAC: string;
  notes: Record<string, number>;
}

export interface Competences {
  competences: string[];
  autreCompetence: string;
}

export interface Aspirations {
  domainesInteret: string[];
  metierSouhaite: string;
  loisirs: string;
  preferenceFormation: 'theorique' | 'pratique' | 'les-deux';
}

export interface ProfilComplet extends ProfilScolaire, Competences, Aspirations {}

export interface Recommandation {
  filiereId: string;
  nom: string;
  justification: string;
  competencesARenforcer: string[];
  debouches: string[];
  conseil: string;
}

export interface AnalyseProfil {
  resume: string;
  pointsForts: string[];
  pointsVigilance: string[];
}

export interface ResultatOrientation {
  profil: AnalyseProfil;
  recommandations: Recommandation[];
  conseilGeneral: string;
}

export interface ApiResponse {
  success: boolean;
  data: ResultatOrientation;
  isDemo?: boolean;
  profile?: ProfilComplet;
}

export type EtapeFormulaire = 'accueil' | 'scolaire' | 'competences' | 'aspirations' | 'chargement' | 'resultats';

export const SERIES_BAC = [
  'BAC A4',
  'BAC C',
  'BAC D',
  'BAC G2',
  'BAC F',
  'BAC E',
  'Autre série',
] as const;

export const MATIERES_PAR_SERIE: Record<string, string[]> = {
  'BAC A4': ['Français', 'Anglais', 'Histoire-Géographie', 'Philosophie', 'Mathématiques'],
  'BAC C': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais', 'Histoire-Géographie'],
  'BAC D': ['SVT', 'Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie'],
  'BAC G2': ['Économie', 'Comptabilité', 'Mathématiques', 'Français', 'Anglais'],
  'BAC F': ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais'],
  'BAC E': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais'],
  'Autre série': ['Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'Philosophie', 'Économie', 'SVT', 'Physique-Chimie'],
};

export const COMPETENCES_LISTE = [
  'Résoudre des problèmes logiques',
  'Utiliser les outils informatiques',
  'Programmer',
  'Communiquer facilement',
  'Convaincre et négocier',
  'Organiser des activités',
  'Gérer de l\'argent',
  'Travailler en équipe',
  'Dessiner et créer',
  'Écrire et rédiger',
  'Analyser des informations',
  'Aider et accompagner les autres',
  'Entreprendre',
  'Réaliser des activités pratiques ou techniques',
] as const;

export const DOMAINES_INTERET = [
  'Informatique et numérique',
  'Santé',
  'Sciences et ingénierie',
  'Gestion et finance',
  'Commerce et entrepreneuriat',
  'Droit',
  'Communication et médias',
  'Éducation',
  'Agriculture et environnement',
  'Arts et création',
] as const;
