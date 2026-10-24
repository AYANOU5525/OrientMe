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

// Réponses du formulaire, conservées pour pouvoir les modifier après les résultats
export interface DonneesFormulaire {
  profil: ProfilScolaire;
  competences: Competences;
  aspirations: Aspirations;
}

// Corps envoyé à POST /api/orientation (le prénom reste dans le navigateur)
export interface DemandeOrientation {
  serieBAC: string;
  notes: Record<string, number>;
  competences: string[];
  domainesInteret: string[];
  metierSouhaite: string;
  loisirs: string;
  preferenceFormation: Aspirations['preferenceFormation'];
}

export interface Recommandation {
  filiereId: string;
  nom: string;
  justification: string;
  competencesARenforcer: string[];
  debouches: string[];
  conseil: string;
  // Données officielles du catalogue, ajoutées par le serveur
  description?: string;
  prerequis?: string;
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
  // Modèle Gemma ayant produit l'analyse (ex. gemma-4-26b-a4b-it)
  model: string;
}

// Plan de rentrée généré par Gemma une fois la filière choisie
export interface PointAMaitriser {
  titre: string;
  pourquoi: string;
  commentProgresser: string[];
}

export interface EtapePreparation {
  periode: string;
  objectif: string;
  actions: string[];
}

export interface PlanRentree {
  filiereId: string;
  nom: string;
  introduction: string;
  aMaitriser: PointAMaitriser[];
  planAvantRentree: EtapePreparation[];
  ressources: { nom: string; description: string }[];
  motivation: string;
}

export interface DemandePreparation {
  profil: DemandeOrientation;
  filiereId: string;
  competencesARenforcer: string[];
}

export interface PlanRentreeResponse {
  success: boolean;
  data: PlanRentree;
  model: string;
}

export type EtapeFormulaire = 'accueil' | 'scolaire' | 'competences' | 'aspirations' | 'chargement' | 'resultats';

// Profil fictif pour essayer l'application : il est analysé par Gemma comme un vrai profil
export const PROFIL_EXEMPLE: DonneesFormulaire = {
  profil: {
    prenom: 'Kofi',
    serieBAC: 'BAC C',
    notes: {
      Mathématiques: 17,
      'Physique-Chimie': 15,
      SVT: 14,
      Français: 12,
      Anglais: 13,
      'Histoire-Géographie': 11,
    },
  },
  competences: {
    competences: [
      'Résoudre des problèmes logiques',
      'Utiliser les outils informatiques',
      'Programmer',
      'Analyser des informations',
    ],
    autreCompetence: '',
  },
  aspirations: {
    domainesInteret: ['Informatique et numérique', 'Sciences et ingénierie'],
    metierSouhaite: 'Développeur logiciel',
    loisirs: 'Jeux vidéo, lecture de blogs technologiques',
    preferenceFormation: 'les-deux',
  },
};

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
