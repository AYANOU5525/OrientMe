import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  OrientationRequest,
  OrientationResponse,
  OrientationResponseSchema,
} from '../schemas';

// Chargement du catalogue
const filieresPath = join(__dirname, '../data/filieres.json');
const filieres = JSON.parse(readFileSync(filieresPath, 'utf-8')) as Array<{
  id: string;
  nom: string;
  description: string;
  domaines: string[];
  matieresPertinentes: string[];
  competencesUtiles: string[];
  debouches: string[];
  pointsVigilance: string[];
  prerequis: string;
}>;

const VALID_IDS = new Set(filieres.map((f) => f.id));

function buildCatalogSummary(): string {
  return filieres
    .map(
      (f) =>
        `- ID: "${f.id}" | Nom: "${f.nom}" | Domaines: ${f.domaines.join(', ')}`
    )
    .join('\n');
}

function buildPrompt(data: OrientationRequest): string {
  const notesText = Object.entries(data.notes)
    .map(([matiere, note]) => `  - ${matiere}: ${note}/20`)
    .join('\n');

  const prefFormation =
    data.preferenceFormation === 'theorique'
      ? 'théorique'
      : data.preferenceFormation === 'pratique'
      ? 'pratique'
      : 'théorique et pratique';

  return `
Tu es OrientaTogo AI, un assistant spécialisé dans l'orientation post-BAC au Togo.

Analyse le profil de cet étudiant et recommande exactement 3 filières d'études supérieures parmi le catalogue fourni.

## PROFIL ÉTUDIANT

Série du BAC: ${data.serieBAC}

Notes scolaires:
${notesText}

Compétences déclarées:
${data.competences.map((c) => `  - ${c}`).join('\n')}

Domaines d'intérêt:
${data.domainesInteret.map((d) => `  - ${d}`).join('\n')}

Métier envisagé: ${data.metierSouhaite || 'Non précisé'}

Activités de loisirs: ${data.loisirs || 'Non précisé'}

Préférence de formation: ${prefFormation}

## CATALOGUE DES FILIÈRES AUTORISÉES

${buildCatalogSummary()}

## INSTRUCTIONS STRICTES

1. Retourne EXACTEMENT 3 recommandations distinctes.
2. Chaque filiereId DOIT appartenir exactement au catalogue ci-dessus.
3. Adapte tes recommandations aux notes ET aux aspirations, pas seulement à la moyenne.
4. Pour chaque filière, identifie 2-3 compétences à renforcer spécifiques à ce profil.
5. Liste 3 débouchés professionnels concrets.
6. Rédige un conseil personnalisé encourageant mais réaliste.
7. Dans le profil, résume en 2-3 phrases les caractéristiques distinctives de l'étudiant.
8. Identifie 2-3 points forts et 1-2 points de vigilance.
9. Le conseilGeneral doit être une synthèse bienveillante et motivante.
10. Utilise un français simple, clair et encourageant.
11. NE MENTIONNE PAS de pourcentages de compatibilité, d'admissions garanties ou d'établissements précis.

## FORMAT DE RÉPONSE

Retourne UNIQUEMENT un JSON valide respectant exactement ce schéma:

{
  "profil": {
    "resume": "string",
    "pointsForts": ["string", "string"],
    "pointsVigilance": ["string"]
  },
  "recommandations": [
    {
      "filiereId": "string (doit être dans le catalogue)",
      "nom": "string",
      "justification": "string",
      "competencesARenforcer": ["string", "string"],
      "debouches": ["string", "string", "string"],
      "conseil": "string"
    }
  ],
  "conseilGeneral": "string"
}
  `.trim();
}

export async function getGeminiRecommendations(
  data: OrientationRequest
): Promise<OrientationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY non configurée');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  const prompt = buildPrompt(data);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Réponse vide de Gemini');
  }

  // Parse JSON
  let parsed: unknown;
  try {
    // Nettoyer le texte si nécessaire (retirer markdown code blocks)
    const cleaned = text.replace(/^```json\n?|\n?```$/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('La réponse de Gemini n\'est pas un JSON valide');
  }

  // Valider avec Zod
  const validated = OrientationResponseSchema.safeParse(parsed);
  if (!validated.success) {
    console.error('Erreur de validation Zod:', validated.error.format());
    throw new Error('La réponse de Gemini ne correspond pas au format attendu');
  }

  // Vérifier que les filiereIds sont valides
  const result = validated.data;
  for (const rec of result.recommandations) {
    if (!VALID_IDS.has(rec.filiereId)) {
      throw new Error(
        `Filière inconnue retournée par Gemini: "${rec.filiereId}". Filières autorisées: ${[...VALID_IDS].join(', ')}`
      );
    }
  }

  // Vérifier l'unicité
  const ids = result.recommandations.map((r) => r.filiereId);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== 3) {
    throw new Error('Les recommandations doivent être des filières distinctes');
  }

  // Enrichir les recommandations avec les données du catalogue
  result.recommandations = result.recommandations.map((rec) => {
    const filiere = filieres.find((f) => f.id === rec.filiereId);
    if (filiere && (!rec.debouches || rec.debouches.length === 0)) {
      rec.debouches = filiere.debouches.slice(0, 3);
    }
    return rec;
  });

  return result;
}

export { filieres, VALID_IDS };
