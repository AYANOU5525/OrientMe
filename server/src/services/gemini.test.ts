import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, type GenerateContentParameters } from '@google/genai';
import { demoResult, demoProfile } from './demo';
import { OrientationRequestSchema } from '../schemas';
import type { ModelCaller } from './gemini';

// La configuration est lue au chargement du module : on fixe l'environnement avant l'import
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'model-a';
process.env.GEMINI_FALLBACK_MODELS = 'model-b';
process.env.GEMINI_TIMEOUT_MS = '300';

const loadService = () => import('./gemini');
const profil = OrientationRequestSchema.parse(demoProfile);
const validJson = JSON.stringify(demoResult);

// Faux appel à l'API : rejoue les réponses dans l'ordre et enregistre les requêtes
function fakeCaller(...responses: Array<string | Error>) {
  const calls: GenerateContentParameters[] = [];
  const caller: ModelCaller = async (params) => {
    calls.push(structuredClone({ ...params, config: { ...params.config, abortSignal: undefined } }));
    const next = responses.shift();
    if (next === undefined) throw new Error('appel inattendu');
    if (next instanceof Error) throw next;
    return next;
  };
  return { caller, calls };
}

test('renvoie les recommandations enrichies et le modèle utilisé', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(validJson);

  const { result, model } = await getRecommendations(profil, caller);

  assert.equal(model, 'model-a');
  assert.equal(result.recommandations.length, 3);
  assert.ok(result.recommandations[0].description);
  assert.equal(calls[0].config?.responseMimeType, 'application/json');
  assert.ok(calls[0].config?.systemInstruction);
});

test('demande une correction au modèle quand sa réponse est invalide', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller('Désolé, je ne peux pas.', validJson);

  const { model } = await getRecommendations(profil, caller);

  assert.equal(model, 'model-a');
  assert.equal(calls.length, 2);
  const contents = calls[1].contents as Array<{ role: string; parts: Array<{ text: string }> }>;
  assert.equal(contents.length, 3);
  assert.match(contents[2].parts[0].text, /invalide/);
});

test('bascule sur le modèle de secours en cas de quota épuisé', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(new ApiError({ message: 'Resource exhausted', status: 429 }), validJson);

  const { model } = await getRecommendations(profil, caller);

  assert.equal(model, 'model-b');
  assert.deepEqual(calls.map((c) => c.model), ['model-a', 'model-b']);
});

test('ne tente pas le modèle de secours si la clé API est refusée', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(new ApiError({ message: 'API key not valid', status: 400 }));

  await assert.rejects(getRecommendations(profil, caller), { code: 'AI_NOT_CONFIGURED', status: 503 });
  assert.equal(calls.length, 1);
});

test('renvoie AI_TIMEOUT quand le budget de temps est dépassé', async () => {
  const { getRecommendations } = await loadService();
  const caller: ModelCaller = (params) =>
    new Promise((_, reject) =>
      params.config?.abortSignal?.addEventListener('abort', () => reject(new Error('aborted')))
    );

  await assert.rejects(getRecommendations(profil, caller), { code: 'AI_TIMEOUT', status: 504 });
});

test('se passe du mode JSON natif si le modèle le refuse', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(
    new ApiError({ message: 'JSON mode is not enabled for models/model-a', status: 400 }),
    validJson
  );

  await getRecommendations(profil, caller);

  assert.equal(calls[0].config?.responseMimeType, 'application/json');
  assert.equal(calls[1].config?.responseMimeType, undefined);
  assert.equal(calls[1].config?.responseJsonSchema, undefined);
});

test('intègre les règles au message si l\'instruction système est refusée', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(
    new ApiError({ message: 'Developer instruction is not enabled for models/model-a', status: 400 }),
    validJson
  );

  await getRecommendations(profil, caller);

  assert.equal(calls[1].config?.systemInstruction, undefined);
  const contents = calls[1].contents as Array<{ parts: Array<{ text: string }> }>;
  assert.match(contents[0].parts[0].text, /CATALOGUE DES FILIÈRES AUTORISÉES/);
});
