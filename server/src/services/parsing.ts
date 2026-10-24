import { z } from 'zod';
import { filieresById } from '../catalog';
import {
  OrientationResponse,
  OrientationResponseSchema,
  OrientationResult,
  PreparationResponse,
  PreparationResponseSchema,
} from '../schemas';

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; reason: string };

// Extrait l'objet JSON d'une réponse texte : les modèles sans mode JSON natif
// l'entourent parfois de ```json … ``` ou d'une phrase d'introduction
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('aucun objet JSON trouvé dans la réponse');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

// Extrait puis valide le JSON ; `reason` est renvoyée au modèle pour qu'il corrige sa réponse
function parseJson<T>(text: string | undefined, schema: z.ZodType<T, z.ZodTypeDef, unknown>): ValidationResult<T> {
  if (!text?.trim()) return { ok: false, reason: 'la réponse est vide' };

  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `le JSON est invalide (${detail})` };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.') || 'racine'} : ${issue.message}`)
      .join(' ; ');
    return { ok: false, reason: `le format ne respecte pas le schéma (${issues})` };
  }

  return { ok: true, data: parsed.data };
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase().replace(/\s+/g, '-');
}

// Vérifie la structure, l'appartenance au catalogue et l'unicité des filières
export function parseAiResponse(text: string | undefined): ValidationResult<OrientationResponse> {
  const parsed = parseJson(text, OrientationResponseSchema);
  if (!parsed.ok) return parsed;

  const data = parsed.data;
  for (const rec of data.recommandations) {
    rec.filiereId = normalizeId(rec.filiereId);
    if (!filieresById.has(rec.filiereId)) {
      return { ok: false, reason: `la filière "${rec.filiereId}" n'existe pas dans le catalogue` };
    }
  }

  if (new Set(data.recommandations.map((r) => r.filiereId)).size !== 3) {
    return { ok: false, reason: 'les 3 recommandations doivent porter sur 3 filières distinctes' };
  }

  return { ok: true, data };
}

export function parsePreparation(text: string | undefined): ValidationResult<PreparationResponse> {
  return parseJson(text, PreparationResponseSchema);
}

// Ajoute la fiche officielle de chaque filière choisie par Gemma (nom, description, prérequis).
// Le choix, la justification, les débouchés et les conseils restent ceux de Gemma.
export function enrichir(result: OrientationResponse): OrientationResult {
  return {
    ...result,
    recommandations: result.recommandations.map((rec) => {
      const filiere = filieresById.get(rec.filiereId);
      if (!filiere) throw new Error(`Filière inconnue : ${rec.filiereId}`);
      return {
        ...rec,
        nom: filiere.nom,
        description: filiere.description,
        prerequis: filiere.prerequis,
      };
    }),
  };
}
