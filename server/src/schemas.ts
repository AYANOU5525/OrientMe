import { z } from 'zod';

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
});

export type OrientationRequest = z.infer<typeof OrientationRequestSchema>;

// Schéma de validation de la réponse du modèle
const RecommandationSchema = z.object({
  filiereId: z.string(),
  nom: z.string(),
  justification: z.string().min(1),
  competencesARenforcer: z.array(z.string()).min(1),
  debouches: z.array(z.string()),
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

// Réponse envoyée au client : recommandations complétées avec les données du catalogue
export type RecommandationEnrichie = z.infer<typeof RecommandationSchema> & {
  description: string;
  prerequis: string;
};

export type OrientationResult = Omit<OrientationResponse, 'recommandations'> & {
  recommandations: RecommandationEnrichie[];
};
