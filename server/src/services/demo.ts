import { OrientationResponse } from '../schemas';

// Résultat de démonstration préenregistré (profil fictif)
export const demoResult: OrientationResponse = {
  profil: {
    resume:
      'Kofi est un bachelier scientifique (BAC C) avec d\'excellentes performances en mathématiques et en physique. Il manifeste un fort intérêt pour l\'informatique et les nouvelles technologies, avec des aptitudes logiques et analytiques prononcées.',
    pointsForts: [
      'Excellente base en mathématiques (17/20) — atout majeur pour les filières scientifiques et technologiques',
      'Aptitudes logiques et analytiques déclarées, renforcées par de bonnes notes en sciences',
      'Intérêt marqué pour l\'informatique et le numérique, domaine porteur au Togo',
    ],
    pointsVigilance: [
      'Niveau en français à consolider (12/20) — important pour la rédaction de rapports et soutenances',
      'Peu d\'expérience pratique déclarée en dehors du cadre scolaire',
    ],
  },
  recommandations: [
    {
      filiereId: 'informatique',
      nom: 'Informatique et Développement Logiciel',
      justification:
        'Tes excellents résultats en mathématiques (17/20) et en physique-chimie (15/20) constituent une base solide pour les études informatiques. Ton intérêt déclaré pour la programmation et la résolution de problèmes logiques est parfaitement aligné avec les exigences de cette filière. Le secteur numérique togolais est en plein essor, ce qui offre de réelles perspectives locales.',
      competencesARenforcer: [
        'Renforcer la pratique de la programmation (Python, JavaScript) par des projets personnels',
        'Améliorer l\'expression écrite en français pour les rapports techniques',
        'Développer une veille technologique régulière',
      ],
      debouches: [
        'Développeur logiciel',
        'Ingénieur en intelligence artificielle',
        'Développeur web/mobile',
      ],
      conseil:
        'Commence dès maintenant à pratiquer la programmation sur des plateformes gratuites comme freeCodeCamp ou Khan Academy. Un projet concret, même simple, aura plus de valeur qu\'un diplôme seul aux yeux des recruteurs.',
    },
    {
      filiereId: 'reseaux',
      nom: 'Réseaux et Télécommunications',
      justification:
        'Tes solides bases en physique et en mathématiques te préparent efficacement aux aspects techniques des réseaux et des systèmes de télécommunication. Cette filière répond à ton intérêt pour l\'informatique tout en t\'ouvrant sur les infrastructures numériques, secteur en fort développement sur le continent africain.',
      competencesARenforcer: [
        'Acquérir des bases pratiques en administration Linux',
        'Se familiariser avec les protocoles réseau (TCP/IP, DNS, HTTP)',
        'Développer des aptitudes en cybersécurité',
      ],
      debouches: [
        'Administrateur réseau',
        'Ingénieur en cybersécurité',
        'Technicien télécommunications',
      ],
      conseil:
        'La certification Cisco CCNA, disponible en formation courte, peut significativement valoriser ton profil dès la licence. Elle est reconnue internationalement et ouvre des portes rapidement.',
    },
    {
      filiereId: 'genie-electrique',
      nom: 'Génie Électrique et Électronique',
      justification:
        'Avec une note de 15/20 en physique-chimie et ton intérêt pour les sciences appliquées, le génie électrique représente une alternative solide qui combine théorie et pratique. Les énergies renouvelables constituent un secteur d\'avenir important au Togo, avec des besoins croissants en ingénieurs spécialisés.',
      competencesARenforcer: [
        'Approfondir les notions d\'électronique analogique et numérique',
        'Développer des compétences en CAO (conception assistée par ordinateur)',
        'Renforcer la pratique de travaux en laboratoire',
      ],
      debouches: [
        'Ingénieur électricien',
        'Technicien en énergies renouvelables',
        'Automaticien',
      ],
      conseil:
        'Si tu choisis cette voie, oriente-toi vers une école d\'ingénieurs proposant des stages pratiques. Le terrain est essentiel dans ce domaine et les entreprises recrutent prioritairement des candidats avec une expérience terrain.',
    },
  ],
  conseilGeneral:
    'Ton profil scientifique solide t\'ouvre plusieurs portes prometteuses dans les domaines technologiques et de l\'ingénierie. Quel que soit ton choix final, souviens-toi que la curiosité, la persévérance et la pratique régulière sont tes meilleurs atouts. N\'hésite pas à consulter des professionnels en activité dans les domaines qui t\'intéressent — quelques échanges concrets valent mieux que de nombreuses recherches théoriques. Bon courage dans cette nouvelle étape !',
};

export const demoProfile = {
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
  competences: [
    'Résoudre des problèmes logiques',
    'Utiliser les outils informatiques',
    'Programmer',
    'Analyser des informations',
  ],
  domainesInteret: ['Informatique et numérique', 'Sciences et ingénierie'],
  metierSouhaite: 'Développeur logiciel',
  loisirs: 'Jeux vidéo, lecture de blogs technologiques',
  preferenceFormation: 'les-deux',
};
