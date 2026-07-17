import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creerReport, ajouterCommit, ajouterVerdictOverride, serialiser } from './report.mjs'

const SNAPSHOT = { outdated: 47, majors: 7, vulnerabilites: 0 }

test('creerReport pose la date et le snapshot', () => {
  const report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })

  assert.equal(report.date, '2026-07-17')
  assert.deepEqual(report.snapshot, SNAPSHOT)
  assert.deepEqual(report.commits, [])
  assert.deepEqual(report.overrides, [])
})

test('ajouterCommit empile dans l ordre', () => {
  let report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  report = ajouterCommit(report, {
    sha: 'aaa111',
    libelle: 'in-range',
    categorie: 'in-range',
    deps: [{ name: 'react', de: '19.2.5', vers: '19.2.7' }],
    oracle: { rapide: true, complet: true, echecs: [] },
  })
  report = ajouterCommit(report, {
    sha: 'bbb222',
    libelle: 'typescript 6',
    categorie: 'major',
    deps: [{ name: 'typescript', de: '5.9.3', vers: '6.0.3' }],
    oracle: { rapide: false, complet: null, echecs: ['kpilote-api: tsc — 14 erreurs'] },
  })

  assert.equal(report.commits.length, 2)
  assert.equal(report.commits[0].sha, 'aaa111')
  assert.equal(report.commits[1].categorie, 'major')
})

test('ajouterCommit ne mute pas le rapport d origine', () => {
  const report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  ajouterCommit(report, {
    sha: 'aaa111',
    libelle: 'in-range',
    categorie: 'in-range',
    deps: [],
    oracle: { rapide: true, complet: true, echecs: [] },
  })

  assert.equal(report.commits.length, 0, 'creerReport doit rester intact')
})

test('ajouterVerdictOverride empile les verdicts', () => {
  let report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  report = ajouterVerdictOverride(report, {
    cle: 'terser',
    nom: 'terser',
    range: '<5.47.0',
    versionsResolues: ['5.47.1'],
    porteur: true,
    preuve: 'sans l override, terser se résout en 5.47.1 — hors de "<5.47.0"',
  })

  assert.equal(report.overrides.length, 1)
  assert.equal(report.overrides[0].porteur, true)
})

test('serialiser produit du JSON relisible', () => {
  let report = creerReport({ date: '2026-07-17', snapshot: SNAPSHOT })
  report = ajouterCommit(report, {
    sha: 'aaa111',
    libelle: 'in-range',
    categorie: 'in-range',
    deps: [],
    oracle: { rapide: true, complet: true, echecs: [] },
  })

  const relu = JSON.parse(serialiser(report))
  assert.equal(relu.commits[0].sha, 'aaa111')
})
