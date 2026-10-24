import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreger } from './stats';

test('agrège les orientations et les choix de filière', () => {
  const stats = agreger([
    { type: 'orientation', date: '2026-10-20T10:00:00Z', serieBAC: 'BAC D', domaines: ['Santé'], filieres: ['sante', 'biologie-medicale', 'agronomie'] },
    { type: 'orientation', date: '2026-10-21T10:00:00Z', serieBAC: 'BAC C', domaines: ['Santé', 'Informatique et numérique'], filieres: ['informatique', 'sante', 'reseaux'] },
    { type: 'choix', date: '2026-10-21T10:05:00Z', filiereId: 'sante' },
    { type: 'avis', date: '2026-10-21T10:06:00Z', utile: true },
    { type: 'avis', date: '2026-10-21T10:07:00Z', utile: true },
    { type: 'avis', date: '2026-10-21T10:08:00Z', utile: false },
  ]);

  assert.equal(stats.orientations, 2);
  assert.equal(stats.choix, 1);
  assert.equal(stats.avisPositifs, 2);
  assert.equal(stats.avisNegatifs, 1);
  assert.deepEqual(stats.parSerie, { 'BAC D': 1, 'BAC C': 1 });
  assert.equal(stats.parDomaine['Santé'], 2);
  assert.equal(stats.filieresRecommandees.sante, 2);
  assert.deepEqual(stats.filieresChoisies, { sante: 1 });
  assert.deepEqual(stats.parJour, { '2026-10-20': 1, '2026-10-21': 1 });
  assert.equal(stats.depuis, '2026-10-20T10:00:00Z');
});
