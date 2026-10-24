import { z } from 'zod';

// Schéma de validation de la requête entrante
export const OrientationRequestSchema = z.object({
  serieBAC: z.string().min(1, 'La série du BAC est requise'),
  notes: z.record(z.string(), z.number().min(0).max(20)).refine(
    (notes) => Object.keys(notes).length > 0,
    'Au moins une note est requise'
  ),
  competences: z.array(z.string()).min(1, 'Sélectionne au moins une compétence'),
  domainesInteret: z.array(z.string()).min(1, 'Sélectionne au moins un domaine d\'intérêt'),
  metierSouhaite: z.string().optional().default(''),
  loisirs: z.string().optional().default(''),
  preferenceFormation: z.enum(['theorique', 'pratique', 'les-deux']),
});

export type OrientationRequest = z.infer<typeof OrientationRequestSchema>;

// Schéma de validation de la réponse Gemini
const RecommandationSchema = z.object({
  filiereId: z.string(),
  nom: z.string(),
  justification: z.string(),
  competencesARenforcer: z.array(z.string()),
  debouches: z.array(z.string()),
  conseil: z.string(),
});

export const OrientationResponseSchema = z.object({
  profil: z.object({
    resume: z.string(),
    pointsForts: z.array(z.string()),
    pointsVigilance: z.array(z.string()),
  }),
  recommandations: z.array(RecommandationSchema).length(3),
  conseilGeneral: z.string(),
});

export type OrientationResponse = z.infer<typeof OrientationResponseSchema>;
