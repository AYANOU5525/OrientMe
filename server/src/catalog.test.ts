import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etablissements, etablissementsPour, filieres, filieresById } from './catalog';

// Domaines proposés dans le formulaire (client/src/types/index.ts)
const DOMAINES_FORMULAIRE = [
  'Informatique et numérique',
  'Santé',
  'Sciences et ingénierie',
  'Gestion et finance',
  'Commerce et entrepreneuriat',
  'Droit',
  'Communication et médias',
  'Éducation',
  'Agriculture et environnement',
  'Arts et création',
];

test('chaque filière est complète et utilise les domaines du formulaire', () => {
  assert.equal(new Set(filieres.map((f) => f.id)).size, filieres.length, 'identifiants en double');
  for (const f of filieres) {
    assert.ok(f.duree, `${f.id} : durée manquante`);
    assert.ok(f.debouches.length > 0, `${f.id} : débouchés manquants`);
    for (const domaine of f.domaines) {
      assert.ok(DOMAINES_FORMULAIRE.includes(domaine), `${f.id} : domaine inconnu « ${domaine} »`);
    }
  }
});

test('chaque établissement renvoie à des filières existantes et cite sa source', () => {
  for (const e of etablissements) {
    assert.match(e.source, /^https:\/\//, `${e.id} : source manquante`);
    for (const id of e.filieres) {
      assert.ok(filieresById.has(id), `${e.id} : filière inconnue « ${id} »`);
    }
  }
});

test('chaque filière a au moins un établissement au Togo', () => {
  for (const f of filieres) {
    assert.ok(etablissementsPour(f.id).length > 0, `${f.id} : aucun établissement`);
  }
});
