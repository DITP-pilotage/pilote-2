import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOutdated, grouperCouples } from './outdated.mjs'

const FIXTURE = {
  react: {
    current: '19.2.5',
    latest: '19.2.7',
    wanted: '19.2.5',
    isDeprecated: false,
    dependencyType: 'dependencies',
    dependentPackages: [{ name: '@pilote/kpilote-webapp', location: '/x' }],
  },
  typescript: {
    current: '5.9.3',
    latest: '6.0.3',
    wanted: '5.9.3',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
  '@tiptap/core': {
    current: '3.22.3',
    latest: '3.27.1',
    wanted: '3.22.3',
    isDeprecated: false,
    dependencyType: 'dependencies',
    dependentPackages: [{ name: '@pilote/kpilote-webapp', location: '/x' }],
  },
  '@tiptap/react': {
    current: '3.22.3',
    latest: '3.27.1',
    wanted: '3.22.3',
    isDeprecated: false,
    dependencyType: 'dependencies',
    dependentPackages: [{ name: '@pilote/kpilote-webapp', location: '/x' }],
  },
  eslint: {
    current: '9.39.4',
    latest: '10.6.0',
    wanted: '9.39.4',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
  '@eslint/js': {
    current: '9.39.4',
    latest: '10.0.1',
    wanted: '9.39.4',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
}

test('parseOutdated marque les majors en comparant current et latest', () => {
  const deps = parseOutdated(FIXTURE)
  const parNom = Object.fromEntries(deps.map((d) => [d.name, d]))

  assert.equal(parNom['typescript'].isMajor, true, '5.9.3 -> 6.0.3 est un major')
  assert.equal(parNom['eslint'].isMajor, true, '9.39.4 -> 10.6.0 est un major')
  assert.equal(parNom['react'].isMajor, false, '19.2.5 -> 19.2.7 est un patch')
  assert.equal(parNom['@tiptap/core'].isMajor, false, '3.22.3 -> 3.27.1 est un minor')
})

test('parseOutdated distingue les devDependencies des dependencies', () => {
  // Décisif : `pnpm add` sans -D déplacerait typescript de devDependencies vers dependencies.
  const deps = parseOutdated(FIXTURE)
  const parNom = Object.fromEntries(deps.map((d) => [d.name, d]))

  assert.equal(parNom['typescript'].estDevDependency, true)
  assert.equal(parNom['eslint'].estDevDependency, true)
  assert.equal(parNom['react'].estDevDependency, false)
  assert.equal(parNom['@tiptap/core'].estDevDependency, false)
})

test('parseOutdated expose les dependents à plat', () => {
  const deps = parseOutdated(FIXTURE)
  const react = deps.find((d) => d.name === 'react')
  assert.deepEqual(react.dependents, ['@pilote/kpilote-webapp'])
})

test('parseOutdated ignore une entrée sans current exploitable', () => {
  const deps = parseOutdated({
    bidon: { latest: '2.0.0', dependentPackages: [] },
  })
  assert.deepEqual(deps, [])
})

test('grouperCouples réunit tout le bloc @tiptap/* sous un seul groupe', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const tiptap = groupes.find((g) => g.nom === 'tiptap')

  assert.ok(tiptap, 'un groupe tiptap doit exister')
  assert.deepEqual(tiptap.deps.map((d) => d.name).sort(), ['@tiptap/core', '@tiptap/react'])
})

test('grouperCouples réunit eslint et @eslint/js', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const eslint = groupes.find((g) => g.nom === 'eslint')

  assert.ok(eslint, 'un groupe eslint doit exister')
  assert.deepEqual(eslint.deps.map((d) => d.name).sort(), ['@eslint/js', 'eslint'])
})

test('grouperCouples laisse les paquets non couplés seuls dans leur groupe', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const ts = groupes.find((g) => g.nom === 'typescript')

  assert.ok(ts)
  assert.equal(ts.deps.length, 1)
})
