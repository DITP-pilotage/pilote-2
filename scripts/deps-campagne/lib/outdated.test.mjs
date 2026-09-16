import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOutdated, grouperCouples, interpreterOutdated } from './outdated.mjs'

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
  'oxlint-tsgolint': {
    current: '7.0.2001',
    latest: '7.1.2000',
    wanted: '7.0.2001',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
  oxlint: {
    current: '1.80.0',
    latest: '1.84.2',
    wanted: '1.80.0',
    isDeprecated: false,
    dependencyType: 'devDependencies',
    dependentPackages: [{ name: '@pilote/kpilote-api', location: '/y' }],
  },
}

test('parseOutdated marque les majors en comparant current et latest', () => {
  const deps = parseOutdated(FIXTURE)
  const parNom = Object.fromEntries(deps.map((d) => [d.name, d]))

  assert.equal(parNom['typescript'].isMajor, true, '5.9.3 -> 6.0.3 est un major')
  assert.equal(
    parNom['oxlint'].isMajor,
    false,
    '1.80.0 -> 1.84.2 est un minor',
  )
  assert.equal(parNom['react'].isMajor, false, '19.2.5 -> 19.2.7 est un patch')
  assert.equal(parNom['@tiptap/core'].isMajor, false, '3.22.3 -> 3.27.1 est un minor')
})

test('parseOutdated distingue les devDependencies des dependencies', () => {
  // Décisif : `pnpm add` sans -D déplacerait typescript de devDependencies vers dependencies.
  const deps = parseOutdated(FIXTURE)
  const parNom = Object.fromEntries(deps.map((d) => [d.name, d]))

  assert.equal(parNom['typescript'].estDevDependency, true)
  assert.equal(parNom['oxlint'].estDevDependency, true)
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

test('interpreterOutdated accepte exit 1 + JSON : c est le cas nominal', () => {
  // Mesuré : `pnpm outdated` sort en 1 dès qu'une dep est périmée. Ce n'est pas une erreur.
  const deps = interpreterOutdated({ code: 1, stdout: JSON.stringify(FIXTURE), stderr: '' })

  assert.equal(deps.length, 6)
})

test('interpreterOutdated accepte exit 0 + vide : rien de périmé', () => {
  assert.deepEqual(interpreterOutdated({ code: 0, stdout: '', stderr: '' }), [])
})

test('interpreterOutdated accepte exit 0 + objet vide : rien de périmé', () => {
  assert.deepEqual(interpreterOutdated({ code: 0, stdout: '{}', stderr: '' }), [])
})

test('interpreterOutdated LÈVE sur stdout vide avec un code non nul', () => {
  // Le trou à ne pas laisser : rendre [] ici ferait croire à une campagne « déjà à jour ».
  assert.throws(
    () => interpreterOutdated({ code: 1, stdout: '', stderr: 'ERR_PNPM_FETCH failed' }),
    /a échoué.*ERR_PNPM_FETCH/s,
  )
})

test('interpreterOutdated LÈVE sur une sortie non-JSON', () => {
  // Mesuré : un filtre invalide sort du texte brut AVEC un exit code 0.
  assert.throws(
    () =>
      interpreterOutdated({
        code: 0,
        stdout: 'No projects matched the filters in "/repo"',
        stderr: '',
      }),
    /n'a pas rendu du JSON.*No projects matched/s,
  )
})

test('grouperCouples réunit tout le bloc @tiptap/* sous un seul groupe', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const tiptap = groupes.find((g) => g.nom === 'tiptap')

  assert.ok(tiptap, 'un groupe tiptap doit exister')
  assert.deepEqual(tiptap.deps.map((d) => d.name).sort(), ['@tiptap/core', '@tiptap/react'])
})

test('grouperCouples réunit typescript et oxlint-tsgolint', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const ts = groupes.find((g) => g.nom === 'typescript')

  assert.ok(ts, 'un groupe typescript doit exister')
  assert.deepEqual(ts.deps.map((d) => d.name).sort(), [
    'oxlint-tsgolint',
    'typescript',
  ])
})

test('grouperCouples laisse les paquets non couplés seuls dans leur groupe', () => {
  const groupes = grouperCouples(parseOutdated(FIXTURE))
  const oxlint = groupes.find((g) => g.nom === 'oxlint')

  assert.ok(oxlint)
  assert.equal(oxlint.deps.length, 1)
})
