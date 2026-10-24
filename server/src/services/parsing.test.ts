import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrichir, extractJson, parseAiResponse } from './parsing';
import { demoResult } from './demo';

const validJson = JSON.stringify(demoResult);

test('extractJson lit un JSON entouré d\'un bloc Markdown ou de texte', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Voici ma réponse : {"a":{"b":2}} Bonne chance !'), { a: { b: 2 } });
  assert.throws(() => extractJson('pas de JSON ici'));
});

test('parseAiResponse accepte une réponse conforme', () => {
  const result = parseAiResponse(validJson);
  assert.equal(result.ok, true);
});

test('parseAiResponse normalise les identifiants de filière', () => {
  const data = structuredClone(demoResult);
  data.recommandations[0].filiereId = ' Informatique ';
  const result = parseAiResponse(JSON.stringify(data));
  assert.ok(result.ok);
  assert.equal(result.data.recommandations[0].filiereId, 'informatique');
});

test('parseAiResponse rejette les réponses invalides avec une raison exploitable', () => {
  const inconnue = structuredClone(demoResult);
  inconnue.recommandations[0].filiereId = 'astrophysique';
  const doublon = structuredClone(demoResult);
  doublon.recommandations[1].filiereId = 'informatique';
  const incomplete = { ...demoResult, recommandations: demoResult.recommandations.slice(0, 2) };

  const cas: Array<[string | undefined, RegExp]> = [
    [undefined, /vide/],
    ['{ "profil": ', /JSON est invalide/],
    [JSON.stringify(inconnue), /astrophysique/],
    [JSON.stringify(doublon), /distinctes/],
    [JSON.stringify(incomplete), /recommandations/],
  ];

  for (const [texte, raison] of cas) {
    const result = parseAiResponse(texte);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, raison);
  }
});

test('enrichir reprend le nom officiel et ajoute les données du catalogue', () => {
  const data = structuredClone(demoResult);
  data.recommandations[0].nom = 'Info';
  data.recommandations[0].debouches = [];

  const rec = enrichir(data).recommandations[0];
  assert.equal(rec.nom, 'Informatique et Développement Logiciel');
  assert.equal(rec.debouches.length, 3);
  assert.ok(rec.description.length > 0);
  assert.ok(rec.prerequis.length > 0);
});
