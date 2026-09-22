import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  lireExclusions,
  lireMinimumReleaseAge,
  verdictQuarantaine,
  versionsVerrouillees,
} from './quarantaine.mjs'

const YAML = `packages:
  - "apps/*"

minimumReleaseAge: 20160
minimumReleaseAgeExclude:
  # expire: jamais
  - next
  - "@next/*"
  # expire: 2026-08-03
  # next-auth est épinglé en exact, publié le 2026-07-20.
  - next-auth
  - "@auth/core"
  # expire: 2026-09-04
  - deepmerge-ts
  - sans-marqueur

autreCle: valeur
`

test('lit les exclusions avec leur échéance déclarée', () => {
  assert.deepEqual(lireExclusions(YAML), [
    { paquet: 'next', expire: 'jamais' },
    { paquet: '@next/*', expire: 'jamais' },
    { paquet: 'next-auth', expire: '2026-08-03' },
    { paquet: '@auth/core', expire: '2026-08-03' },
    { paquet: 'deepmerge-ts', expire: '2026-09-04' },
    { paquet: 'sans-marqueur', expire: '2026-09-04' },
  ])
})

test('ferme le bloc à la première clé non indentée', () => {
  assert.equal(lireExclusions(YAML).some((e) => e.paquet.includes('autreCle')), false)
})

test('rend une liste vide si la clé est absente', () => {
  assert.deepEqual(lireExclusions('packages:\n  - "apps/*"\n'), [])
})

const LE_22 = new Date('2026-09-22T00:00:00Z')
const QUARANTAINE = 20160

test('une exclusion sans échéance est en défaut', () => {
  const v = verdictQuarantaine({
    paquet: 'x', expire: null, publieeLe: null,
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'sans-echeance')
})

test('une politique permanente est laissée tranquille', () => {
  const v = verdictQuarantaine({
    paquet: 'next', expire: 'jamais', publieeLe: null,
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'permanente')
})

test('échéance non atteinte : rien à faire', () => {
  const v = verdictQuarantaine({
    paquet: 'x', expire: '2026-10-01', publieeLe: new Date('2026-09-20T00:00:00Z'),
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'en-cours')
  assert.equal(v.resteJours, 9)
})

test('échéance dépassée ET version mûre : retirable', () => {
  const v = verdictQuarantaine({
    paquet: 'deepmerge-ts', expire: '2026-09-04', publieeLe: new Date('2026-08-21T00:00:00Z'),
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'retirable')
  assert.equal(v.retardJours, 18)
  assert.equal(v.ageJours, 32)
})

test("échéance dépassée mais version encore fraîche : NE PAS retirer", () => {
  const v = verdictQuarantaine({
    paquet: 'x', expire: '2026-09-04', publieeLe: new Date('2026-09-18T00:00:00Z'),
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'echue-mais-prematuree')
  assert.equal(v.ageJours, 4)
})

test('échéance dépassée et version inconnue : à vérifier à la main', () => {
  const v = verdictQuarantaine({
    paquet: '@next/*', expire: '2026-09-04', publieeLe: null,
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'echue-non-verifiable')
})

test('une échéance illisible est signalée, pas ignorée', () => {
  const v = verdictQuarantaine({
    paquet: 'x', expire: 'bientôt', publieeLe: null,
    aujourdhui: LE_22, minimumReleaseAgeMinutes: QUARANTAINE,
  })
  assert.equal(v.statut, 'echeance-illisible')
})

const LOCKFILE = `packages:

  '@auth/core@0.41.3':
    resolution: {integrity: sha512-x}

  next-auth@5.0.0-beta.32:
    resolution: {integrity: sha512-y}

  deepmerge-ts@8.0.2:
    resolution: {integrity: sha512-z}

  deepmerge-ts@7.1.5:
    resolution: {integrity: sha512-w}

snapshots:

  next-auth@5.0.0-beta.32(next@16.3.3(react@19.2.8))(react@19.2.8):
    dependencies:
      '@auth/core': 0.41.3
`

test('trouve la version d\'un paquet non scopé', () => {
  assert.deepEqual(versionsVerrouillees('next-auth', LOCKFILE), ['5.0.0-beta.32'])
})

test('trouve la version d\'un paquet scopé, dont la clé est quotée dans le lockfile', () => {
  assert.deepEqual(versionsVerrouillees('@auth/core', LOCKFILE), ['0.41.3'])
})

test('rend toutes les versions quand il y en a plusieurs', () => {
  assert.deepEqual(versionsVerrouillees('deepmerge-ts', LOCKFILE).sort(), ['7.1.5', '8.0.2'])
})

test('ne résout pas un motif glob', () => {
  assert.deepEqual(versionsVerrouillees('@next/*', LOCKFILE), [])
})

test('ne confond pas un paquet avec un autre dont il est le préfixe', () => {
  assert.deepEqual(versionsVerrouillees('next', LOCKFILE), [])
})

test('lit minimumReleaseAge', () => {
  assert.equal(lireMinimumReleaseAge(YAML), 20160)
  assert.equal(lireMinimumReleaseAge('packages:\n  - "apps/*"\n'), 0)
})
