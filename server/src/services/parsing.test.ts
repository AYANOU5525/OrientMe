import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrichir, extractJson, parseAiResponse, parsePreparation } from './parsing';
import { exemplePreparation, exempleResultat } from './exemple.fixture';

const validJson = JSON.stringify(exempleResultat);

test('extractJson lit un JSON entouré d\'un bloc Markdown ou de texte', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Voici ma réponse : {"a":{"b":2}} Bonne chance !'), { a: { b: 2 } });
  assert.throws(() => extractJson('pas de JSON ici'));
});

test('parseAiResponse accepte une réponse conforme', () => {
  const result = parseAiResponse(validJson);
  assert.equal(result.ok, true);
});

test('parseAiResponse accepte une réponse emballée dans un tableau (observé avec Gemma 4)', () => {
  const result = parseAiResponse(`[\n  ${validJson}\n]`);
  assert.equal(result.ok, true);
});

test('parseAiResponse normalise les identifiants de filière', () => {
  const data = structuredClone(exempleResultat);
  data.recommandations[0].filiereId = ' Informatique ';
  const result = parseAiResponse(JSON.stringify(data));
  assert.ok(result.ok);
  assert.equal(result.data.recommandations[0].filiereId, 'informatique');
});

test('parseAiResponse rejette les réponses invalides avec une raison exploitable', () => {
  const inconnue = structuredClone(exempleResultat);
  inconnue.recommandations[0].filiereId = 'astrophysique';
  const doublon = structuredClone(exempleResultat);
  doublon.recommandations[1].filiereId = 'informatique';
  const incomplete = { ...exempleResultat, recommandations: exempleResultat.recommandations.slice(0, 2) };
  const sansDebouches = structuredClone(exempleResultat);
  sansDebouches.recommandations[0].debouches = [];

  const cas: Array<[string | undefined, RegExp]> = [
    [undefined, /vide/],
    ['{ "profil": ', /JSON est invalide/],
    [JSON.stringify(inconnue), /astrophysique/],
    [JSON.stringify(doublon), /distinctes/],
    [JSON.stringify(incomplete), /recommandations/],
    [JSON.stringify(sansDebouches), /debouches/],
  ];

  for (const [texte, raison] of cas) {
    const result = parseAiResponse(texte);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, raison);
  }
});

test('enrichir ajoute la fiche du catalogue sans toucher au contenu de Gemma', () => {
  const data = structuredClone(exempleResultat);
  data.recommandations[0].nom = 'Info';

  const rec = enrichir(data).recommandations[0];
  assert.equal(rec.nom, 'Informatique et Développement Logiciel');
  assert.deepEqual(rec.debouches, data.recommandations[0].debouches);
  assert.equal(rec.justification, data.recommandations[0].justification);
  assert.ok(rec.description.length > 0);
  assert.ok(rec.prerequis.length > 0);
});

test('parsePreparation valide le plan de rentrée et signale les champs manquants', () => {
  assert.equal(parsePreparation(JSON.stringify(exemplePreparation)).ok, true);

  // Erreur observée avec Gemma 4 : un élément de aMaitriser sans commentProgresser
  const incomplet = JSON.parse(JSON.stringify(exemplePreparation));
  delete incomplet.aMaitriser[1].commentProgresser;
  const result = parsePreparation(JSON.stringify(incomplet));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /aMaitriser\.1\.commentProgresser/);
});
