import { z } from 'zod';
import type { Etablissement } from './catalog';

// Schéma de validation de la requête entrante
// Les longueurs maximales limitent la taille du prompt envoyé au modèle
export const OrientationRequestSchema = z.object({
  serieBAC: z.string().trim().min(1, 'La série du BAC est requise').max(30),
  notes: z
    .record(z.string().trim().min(1).max(40), z.number().min(0).max(20))
    .refine((notes) => Object.keys(notes).length > 0, 'Au moins une note est requise')
    .refine((notes) => Object.keys(notes).length <= 15, '15 notes au maximum'),
  competences: z
    .array(z.string().trim().min(1).max(80))
    .min(1, 'Sélectionne au moins une compétence')
    .max(20),
  domainesInteret: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Sélectionne au moins un domaine d\'intérêt')
    .max(12),
  metierSouhaite: z.string().trim().max(100).optional().default(''),
  loisirs: z.string().trim().max(200).optional().default(''),
  preferenceFormation: z.enum(['theorique', 'pratique', 'les-deux']),
  // Réponses au mini-questionnaire de personnalité, sous la forme « question : réponse »
  personnalite: z.array(z.string().trim().min(1).max(160)).max(8).optional().default([]),
});

export type OrientationRequest = z.infer<typeof OrientationRequestSchema>;

// Schéma de validation de la réponse du modèle
const RecommandationSchema = z.object({
  filiereId: z.string(),
  nom: z.string(),
  justification: z.string().min(1),
  competencesARenforcer: z.array(z.string()).min(1),
  debouches: z.array(z.string()).min(1),
  conseil: z.string().min(1),
});

export const OrientationResponseSchema = z.object({
  profil: z.object({
    resume: z.string().min(1),
    pointsForts: z.array(z.string()).min(1),
    pointsVigilance: z.array(z.string()),
  }),
  recommandations: z.array(RecommandationSchema).length(3),
  conseilGeneral: z.string().min(1),
});

export type OrientationResponse = z.infer<typeof OrientationResponseSchema>;

// Réponse envoyée au client : l'orientation vient de Gemma, complétée par la fiche officielle du catalogue
export type RecommandationEnrichie = z.infer<typeof RecommandationSchema> & {
  description: string;
  prerequis: string;
  duree: string;
  matieresPertinentes: string[];
  etablissements: Omit<Etablissement, 'filieres'>[];
};

export type OrientationResult = Omit<OrientationResponse, 'recommandations'> & {
  recommandations: RecommandationEnrichie[];
};

// Plan de préparation à la rentrée, demandé une fois la filière choisie
export const PreparationRequestSchema = z.object({
  profil: OrientationRequestSchema,
  filiereId: z.string().trim().min(1).max(60),
  // Compétences à renforcer identifiées lors de l'orientation, pour garder un conseil cohérent
  competencesARenforcer: z.array(z.string().trim().min(1).max(200)).max(5).optional().default([]),
});

export type PreparationRequest = z.infer<typeof PreparationRequestSchema>;

export const PreparationResponseSchema = z.object({
  introduction: z.string().min(1),
  aMaitriser: z
    .array(
      z.object({
        titre: z.string().min(1),
        pourquoi: z.string().min(1),
        commentProgresser: z.array(z.string()).min(1),
      })
    )
    .min(2)
    .max(6),
  planAvantRentree: z
    .array(
      z.object({
        periode: z.string().min(1),
        objectif: z.string().min(1),
        actions: z.array(z.string()).min(1),
      })
    )
    .min(2)
    .max(6),
  ressources: z.array(z.object({ nom: z.string().min(1), description: z.string().min(1) })).max(6),
  motivation: z.string().min(1),
});

export type PreparationResponse = z.infer<typeof PreparationResponseSchema>;

export type PreparationResult = PreparationResponse & {
  filiereId: string;
  nom: string;
  duree: string;
  etablissements: Omit<Etablissement, 'filieres'>[];
};

// Discussion « Pose tes questions à Orienteme »
export const ChatRequestSchema = z.object({
  profil: OrientationRequestSchema,
  recommandations: z
    .array(z.object({ filiereId: z.string().trim().min(1).max(60), nom: z.string().trim().max(120) }))
    .max(3)
    .optional()
    .default([]),
  // Messages précédents, en alternance, en commençant par l'étudiant
  historique: z
    .array(z.object({ role: z.enum(['etudiant', 'orienteme']), texte: z.string().trim().min(1).max(2000) }))
    .max(12)
    .optional()
    .default([]),
  question: z.string().trim().min(1, 'Écris ta question').max(500),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  reponse: z.string().trim().min(1),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Avis anonyme sur l'utilité des recommandations
export const AvisRequestSchema = z.object({ utile: z.boolean() });
