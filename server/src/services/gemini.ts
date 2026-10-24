import { ApiError, GoogleGenAI, type Content, type GenerateContentParameters } from '@google/genai';
import { Filiere, etablissementsPour, filieresById } from '../catalog';
import { config, isAiConfigured } from '../config';
import { AppError } from '../errors';
import {
  ChatRequest,
  ChatResponse,
  OrientationRequest,
  OrientationResult,
  PreparationRequest,
  PreparationResult,
} from '../schemas';
import { ValidationResult, enrichir, parseAiResponse, parseChat, parsePreparation } from './parsing';
import {
  ORIENTATION_INSTRUCTION,
  PREPARATION_INSTRUCTION,
  buildChatInstruction,
  buildPreparationPrompt,
  buildUserPrompt,
} from './prompt';

const MAX_ATTEMPTS_PER_MODEL = 2;

// Appel brut à l'API ; remplaçable dans les tests
export type ModelCaller = (params: GenerateContentParameters) => Promise<string | undefined>;

let client: GoogleGenAI | null = null;

const callGemini: ModelCaller = async (params) => {
  client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
  const response = await client.models.generateContent(params);
  return response.text;
};

// Certains modèles refusent le mode JSON natif ou l'instruction système (ex. Gemma 3).
// Le refus est détecté à la première requête puis mémorisé pour la durée de vie du serveur.
interface ModelCapabilities {
  jsonMode: boolean;
  systemInstruction: boolean;
}

const capabilities = new Map<string, ModelCapabilities>();

function capabilitiesOf(model: string): ModelCapabilities {
  let caps = capabilities.get(model);
  if (!caps) {
    caps = { jsonMode: true, systemInstruction: true };
    capabilities.set(model, caps);
  }
  return caps;
}

class InvalidAiResponseError extends Error {}

// Une génération demandée à Gemma : consignes, message, taille maximale et validation de la réponse
interface GemmaTask<T> {
  label: string;
  systemInstruction: string;
  // Messages envoyés au modèle : un seul message, ou une conversation qui se termine par l'étudiant
  contents: Content[];
  // Assez pour une réponse complète, assez bas pour couper vite une génération qui boucle
  maxOutputTokens: number;
  parse: (text: string | undefined) => ValidationResult<T>;
}

function message(text: string): Content {
  return { role: 'user', parts: [{ text }] };
}

// Sans instruction système, les règles sont placées en tête du premier message
function withInlineInstruction(systemInstruction: string, [first, ...rest]: Content[]): Content[] {
  const prompt = first.parts?.[0]?.text ?? '';
  return [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }, ...rest];
}

async function generate<T>(
  model: string,
  task: GemmaTask<T>,
  contents: Content[],
  signal: AbortSignal,
  callModel: ModelCaller
): Promise<string | undefined> {
  const caps = capabilitiesOf(model);

  try {
    return await callModel({
      model,
      contents: caps.systemInstruction ? contents : withInlineInstruction(task.systemInstruction, contents),
      config: {
        abortSignal: signal,
        temperature: 0.4,
        maxOutputTokens: task.maxOutputTokens,
        ...(caps.systemInstruction && { systemInstruction: task.systemInstruction }),
        // Pas de responseJsonSchema : avec un schéma imposé, Gemma 4 boucle (« humaniste-humaniste-… »)
        // jusqu'à la limite de jetons ; sans schéma il répond en ~20 s, la validation Zod suffit
        ...(caps.jsonMode && { responseMimeType: 'application/json' }),
        ...(config.thinkingLevel && { thinkingConfig: { thinkingLevel: config.thinkingLevel } }),
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      if (caps.jsonMode && /json|mime|schema/i.test(error.message)) {
        caps.jsonMode = false;
        console.warn(`ℹ️  ${model} : mode JSON natif refusé, bascule sur le JSON guidé par le prompt.`);
        return generate(model, task, contents, signal, callModel);
      }
      if (caps.systemInstruction && /system|developer instruction/i.test(error.message)) {
        caps.systemInstruction = false;
        console.warn(`ℹ️  ${model} : instruction système refusée, règles intégrées au message.`);
        return generate(model, task, contents, signal, callModel);
      }
    }
    throw error;
  }
}

// Génère puis valide la réponse ; en cas d'erreur, renvoie la raison au modèle pour qu'il se corrige
async function generateValidated<T>(
  model: string,
  task: GemmaTask<T>,
  signal: AbortSignal,
  callModel: ModelCaller
): Promise<T> {
  const contents: Content[] = [...task.contents];
  let reason = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    const text = await generate(model, task, contents, signal, callModel);
    const result = task.parse(text);
    if (result.ok) return result.data;

    reason = result.reason;
    console.warn(`⚠️  ${model} — réponse invalide (tentative ${attempt}/${MAX_ATTEMPTS_PER_MODEL}) : ${reason}`);
    if (text?.trim()) {
      contents.push(
        { role: 'model', parts: [{ text }] },
        {
          role: 'user',
          parts: [
            {
              text: `Ta réponse précédente est invalide : ${reason}. Renvoie uniquement l'objet JSON corrigé, conforme au format demandé.`,
            },
          ],
        }
      );
    }
  }

  throw new InvalidAiResponseError(`${model} : ${reason}`);
}

function canTryNextModel(error: unknown): boolean {
  if (error instanceof InvalidAiResponseError) return true;
  // 404 : modèle introuvable, 429 : quota du modèle épuisé, 5xx : modèle surchargé
  return error instanceof ApiError && (error.status === 404 || error.status === 429 || error.status >= 500);
}

function toAppError(error: unknown, timedOut: boolean): AppError {
  if (timedOut) {
    return new AppError('AI_TIMEOUT', 504, 'L\'analyse a pris trop de temps. Réessaie dans un instant.');
  }
  if (error instanceof InvalidAiResponseError) {
    return new AppError(
      'AI_INVALID_RESPONSE',
      502,
      'L\'IA a renvoyé une réponse inexploitable. Réessaie : le résultat peut varier d\'une tentative à l\'autre.'
    );
  }
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return new AppError(
        'AI_QUOTA',
        429,
        'Le service est très sollicité en ce moment. Patiente une minute avant de réessayer.'
      );
    }
    if (error.status === 401 || error.status === 403 || (error.status === 400 && /api key/i.test(error.message))) {
      return new AppError(
        'AI_NOT_CONFIGURED',
        503,
        'Le service d\'orientation est mal configuré (clé API invalide).'
      );
    }
  }
  return new AppError(
    'AI_UNAVAILABLE',
    502,
    'Le service d\'IA est momentanément indisponible. Réessaie dans quelques instants.'
  );
}

// Exécute une tâche sur les modèles Gemma configurés, dans l'ordre, avec un budget de temps unique
async function runGemma<T>(task: GemmaTask<T>, callModel: ModelCaller): Promise<{ data: T; model: string }> {
  if (!isAiConfigured()) {
    throw new AppError(
      'AI_NOT_CONFIGURED',
      503,
      'Le service d\'orientation n\'est pas encore configuré (clé API manquante).'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  let lastError: unknown;

  try {
    for (const model of config.models) {
      const startedAt = Date.now();
      try {
        const data = await generateValidated(model, task, controller.signal, callModel);
        console.log(`✅ ${task.label} généré par ${model} en ${Date.now() - startedAt} ms`);
        return { data, model };
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Échec avec ${model} :`, error instanceof Error ? error.message : error);
        if (controller.signal.aborted || !canTryNextModel(error)) break;
      }
    }
  } finally {
    clearTimeout(timer);
  }

  throw toAppError(lastError, controller.signal.aborted);
}

export async function getRecommendations(
  data: OrientationRequest,
  callModel: ModelCaller = callGemini
): Promise<{ result: OrientationResult; model: string }> {
  const { data: response, model } = await runGemma(
    {
      label: 'Orientation',
      systemInstruction: ORIENTATION_INSTRUCTION,
      contents: [message(buildUserPrompt(data))],
      maxOutputTokens: 2048,
      parse: parseAiResponse,
    },
    callModel
  );
  return { result: enrichir(response), model };
}

// Plan de préparation à la rentrée pour la filière choisie par l'étudiant
export async function getPreparation(
  demande: PreparationRequest,
  callModel: ModelCaller = callGemini
): Promise<{ result: PreparationResult; model: string }> {
  const filiere = filieresById.get(demande.filiereId);
  if (!filiere) {
    throw new AppError('INVALID_INPUT', 400, 'Cette filière n\'existe pas dans le catalogue.');
  }

  const { data, model } = await runGemma(
    {
      label: 'Plan de rentrée',
      systemInstruction: PREPARATION_INSTRUCTION,
      contents: [message(buildPreparationPrompt(demande, filiere))],
      maxOutputTokens: 3072,
      parse: parsePreparation,
    },
    callModel
  );
  return {
    result: {
      filiereId: filiere.id,
      nom: filiere.nom,
      duree: filiere.duree,
      etablissements: etablissementsPour(filiere.id).map(({ filieres: _, ...etablissement }) => etablissement),
      ...data,
    },
    model,
  };
}

// Discussion « Pose tes questions à Orienteme » : le contexte (profil, fiches, écoles) est dans les consignes
export async function getChatReponse(
  demande: ChatRequest,
  callModel: ModelCaller = callGemini
): Promise<{ result: ChatResponse; model: string }> {
  const fiches = demande.recommandations
    .map((rec) => filieresById.get(rec.filiereId))
    .filter((filiere): filiere is Filiere => filiere !== undefined);

  const historique: Content[] = demande.historique.map((m) => ({
    role: m.role === 'etudiant' ? 'user' : 'model',
    parts: [{ text: m.texte }],
  }));

  const { data, model } = await runGemma(
    {
      label: 'Réponse de la discussion',
      systemInstruction: buildChatInstruction(demande.profil, fiches),
      contents: [...historique, message(demande.question)],
      maxOutputTokens: 1024,
      parse: parseChat,
    },
    callModel
  );
  return { result: data, model };
}
