import { ApiError, GoogleGenAI, type Content, type GenerateContentParameters } from '@google/genai';
import { config, isAiConfigured } from '../config';
import { AppError } from '../errors';
import { OrientationRequest, OrientationResponse, OrientationResult } from '../schemas';
import { enrichir, parseAiResponse } from './parsing';
import { SYSTEM_INSTRUCTION, buildUserPrompt } from './prompt';

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

// Sans instruction système, les règles sont placées en tête du premier message
function withInlineInstruction([first, ...rest]: Content[]): Content[] {
  const prompt = first.parts?.[0]?.text ?? '';
  return [{ role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${prompt}` }] }, ...rest];
}

async function generate(
  model: string,
  contents: Content[],
  signal: AbortSignal,
  callModel: ModelCaller
): Promise<string | undefined> {
  const caps = capabilitiesOf(model);

  try {
    return await callModel({
      model,
      contents: caps.systemInstruction ? contents : withInlineInstruction(contents),
      config: {
        abortSignal: signal,
        temperature: 0.4,
        // Une réponse complète fait ~900 jetons : la limite coupe vite une génération qui boucle
        maxOutputTokens: 2048,
        ...(caps.systemInstruction && { systemInstruction: SYSTEM_INSTRUCTION }),
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
        return generate(model, contents, signal, callModel);
      }
      if (caps.systemInstruction && /system|developer instruction/i.test(error.message)) {
        caps.systemInstruction = false;
        console.warn(`ℹ️  ${model} : instruction système refusée, règles intégrées au message.`);
        return generate(model, contents, signal, callModel);
      }
    }
    throw error;
  }
}

// Génère puis valide la réponse ; en cas d'erreur, renvoie la raison au modèle pour qu'il se corrige
async function generateValidated(
  model: string,
  data: OrientationRequest,
  signal: AbortSignal,
  callModel: ModelCaller
): Promise<OrientationResponse> {
  const contents: Content[] = [{ role: 'user', parts: [{ text: buildUserPrompt(data) }] }];
  let reason = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    const text = await generate(model, contents, signal, callModel);
    const result = parseAiResponse(text);
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
        'Le quota de l\'API Gemini est atteint. Patiente une minute avant de réessayer.'
      );
    }
    if (error.status === 401 || error.status === 403 || (error.status === 400 && /api key/i.test(error.message))) {
      return new AppError(
        'AI_NOT_CONFIGURED',
        503,
        'La clé API Gemini est invalide ou n\'a pas accès au modèle configuré.'
      );
    }
  }
  return new AppError(
    'AI_UNAVAILABLE',
    502,
    'Le service d\'IA est momentanément indisponible. Réessaie dans quelques instants.'
  );
}

export async function getRecommendations(
  data: OrientationRequest,
  callModel: ModelCaller = callGemini
): Promise<{ result: OrientationResult; model: string }> {
  if (!isAiConfigured()) {
    throw new AppError(
      'AI_NOT_CONFIGURED',
      503,
      'Le service d\'orientation IA n\'est pas configuré (clé API Gemini manquante).'
    );
  }

  // Un seul budget de temps pour l'ensemble des modèles et tentatives
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  let lastError: unknown;

  try {
    for (const model of config.models) {
      const startedAt = Date.now();
      try {
        const response = await generateValidated(model, data, controller.signal, callModel);
        console.log(`✅ Recommandations générées par ${model} en ${Date.now() - startedAt} ms`);
        return { result: enrichir(response), model };
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
