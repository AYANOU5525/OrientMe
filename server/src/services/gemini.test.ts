import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, type GenerateContentParameters } from '@google/genai';
import { exemplePreparation, exempleResultat, exempleProfil } from './exemple.fixture';
import { OrientationRequestSchema } from '../schemas';
import type { ModelCaller } from './gemini';

// La configuration est lue au chargement du module : on fixe l'environnement avant l'import
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'gemma-test-a';
process.env.GEMINI_FALLBACK_MODELS = 'gemma-test-b';
process.env.GEMINI_TIMEOUT_MS = '300';

const loadService = () => import('./gemini');
const profil = OrientationRequestSchema.parse(exempleProfil);
const validJson = JSON.stringify(exempleResultat);

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

  assert.equal(model, 'gemma-test-a');
  assert.equal(result.recommandations.length, 3);
  assert.ok(result.recommandations[0].description);
  assert.equal(calls[0].config?.responseMimeType, 'application/json');
  assert.ok(calls[0].config?.systemInstruction);
});

test('demande une correction au modèle quand sa réponse est invalide', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller('Désolé, je ne peux pas.', validJson);

  const { model } = await getRecommendations(profil, caller);

  assert.equal(model, 'gemma-test-a');
  assert.equal(calls.length, 2);
  const contents = calls[1].contents as Array<{ role: string; parts: Array<{ text: string }> }>;
  assert.equal(contents.length, 3);
  assert.match(contents[2].parts[0].text, /invalide/);
});

test('bascule sur le modèle de secours en cas de quota épuisé', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(new ApiError({ message: 'Resource exhausted', status: 429 }), validJson);

  const { model } = await getRecommendations(profil, caller);

  assert.equal(model, 'gemma-test-b');
  assert.deepEqual(calls.map((c) => c.model), ['gemma-test-a', 'gemma-test-b']);
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
    new ApiError({ message: 'JSON mode is not enabled for models/gemma-test-a', status: 400 }),
    validJson
  );

  await getRecommendations(profil, caller);

  assert.equal(calls[0].config?.responseMimeType, 'application/json');
  assert.equal(calls[1].config?.responseMimeType, undefined);
  assert.equal(calls[1].config?.responseJsonSchema, undefined);
});

test('n\'accepte que des modèles Gemma', async () => {
  const { parseModels } = await import('../config');

  assert.deepEqual(parseModels(undefined, 'gemma-4-31b-it'), ['gemma-4-26b-a4b-it', 'gemma-4-31b-it']);
  assert.throws(() => parseModels('gemini-2.5-flash', ''), /Gemma/);
  assert.throws(() => parseModels('gemma-4-26b-a4b-it', 'gemma-4-31b-it, gpt-4o'), /gpt-4o/);
});

test('n\'envoie jamais de schéma JSON à Gemma', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(validJson);

  await getRecommendations(profil, caller);

  assert.equal(calls[0].config?.responseJsonSchema, undefined);
});

test('intègre les règles au message si l\'instruction système est refusée', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(
    new ApiError({ message: 'Developer instruction is not enabled for models/gemma-test-a', status: 400 }),
    validJson
  );

  await getRecommendations(profil, caller);

  assert.equal(calls[1].config?.systemInstruction, undefined);
  const contents = calls[1].contents as Array<{ parts: Array<{ text: string }> }>;
  assert.match(contents[0].parts[0].text, /CATALOGUE DES FILIÈRES AUTORISÉES/);
});

test('génère le plan de rentrée de la filière choisie', async () => {
  const { getPreparation } = await loadService();
  const { caller, calls } = fakeCaller(JSON.stringify(exemplePreparation));

  const { result, model } = await getPreparation(
    { profil, filiereId: 'informatique', competencesARenforcer: ['Rédaction de rapports'] },
    caller
  );

  assert.equal(model, 'gemma-test-a');
  assert.equal(result.nom, 'Informatique et Développement Logiciel');
  assert.equal(result.aMaitriser.length, 2);
  // Le prompt contient la fiche de la filière, les compétences à renforcer et les consignes de rentrée
  const requete = JSON.stringify(calls[0]);
  assert.match(requete, /FILIÈRE CHOISIE/);
  assert.match(requete, /Rédaction de rapports/);
  assert.match(requete, /avant la rentrée/);
  assert.equal(calls[0].config?.maxOutputTokens, 3072);
});

test('refuse un plan de rentrée pour une filière hors catalogue, sans appeler Gemma', async () => {
  const { getPreparation } = await loadService();
  const { caller, calls } = fakeCaller();

  await assert.rejects(
    getPreparation({ profil, filiereId: 'astrophysique', competencesARenforcer: [] }, caller),
    { code: 'INVALID_INPUT', status: 400 }
  );
  assert.equal(calls.length, 0);
});

test('le plan de rentrée inclut la durée et les écoles vérifiées de la filière', async () => {
  const { getPreparation } = await loadService();
  const { caller } = fakeCaller(JSON.stringify(exemplePreparation));

  const { result } = await getPreparation({ profil, filiereId: 'informatique', competencesARenforcer: [] }, caller);

  assert.ok(result.duree);
  assert.ok(result.etablissements.some((e) => e.nom.includes('Polytechnique')));
});

test('transmet les réponses du questionnaire de personnalité', async () => {
  const { getRecommendations } = await loadService();
  const { caller, calls } = fakeCaller(validJson);

  await getRecommendations({ ...profil, personnalite: ['Tu préfères travailler : sur le terrain'] }, caller);

  assert.match(JSON.stringify(calls[0]), /sur le terrain/);
});

test('répond à une question en tenant compte de l\'historique et des écoles vérifiées', async () => {
  const { getChatReponse } = await loadService();
  const { caller, calls } = fakeCaller(JSON.stringify({ reponse: 'La licence dure 3 ans.' }));

  const { result } = await getChatReponse(
    {
      profil,
      recommandations: [{ filiereId: 'informatique', nom: 'Informatique' }],
      historique: [
        { role: 'etudiant', texte: 'Bonjour' },
        { role: 'orienteme', texte: 'Bonjour Kofi !' },
      ],
      question: 'Combien de temps durent les études ?',
    },
    caller
  );

  assert.equal(result.reponse, 'La licence dure 3 ans.');
  const contents = calls[0].contents as Array<{ role: string; parts: Array<{ text: string }> }>;
  assert.deepEqual(contents.map((c) => c.role), ['user', 'model', 'user']);
  assert.match(contents[2].parts[0].text, /Combien de temps/);
  assert.match(JSON.stringify(calls[0]), /École Nationale Polytechnique/);
});
