import { run } from './shell.mjs'

/**
 * Périmètre des bumps : kpilote uniquement. pilote-ppg n'est jamais touché.
 *
 * Le périmètre doit couvrir TOUS les workspaces kpilote, y compris ceux qui n'ont pas de
 * tsc à eux. Un package laissé hors filtre garde sa résolution figée pendant que les apps
 * montent, et deux copies de la même dépendance se retrouvent dans un seul programme tsc.
 *
 * Pour zod c'est fatal : il estampille ses schémas avec sa propre version, en type LITTÉRAL
 * (`_$ZodTypeInternals { version: typeof version }`, dont `minor` est un littéral). Deux
 * minors différents rendent les schémas mutuellement non-assignables. Les patches passent,
 * les minors non. Oublier kpilote-shared ici a laissé zod en 4.3.6 côté shared face à 4.4.3
 * côté apps => 160 erreurs tsc sur kpilote-api, attribuées à tort au lot in-range.
 *
 * Ce n'est PAS `.openapi()` qui casse : la méthode fonctionne, ce sont les schémas importés
 * de shared qui ne la portent pas. Le mode d'échec est décrit dans DEPENDENCIES.md, section
 * « `pnpm outdated` ne voit pas les `peerDependencies` ».
 */
export const FILTRES_KPILOTE = [
  '--filter',
  '@pilote/kpilote-api',
  '--filter',
  '@pilote/kpilote-webapp',
  '--filter',
  '@pilote/kpilote-admin',
  '--filter',
  '@pilote/kpilote-ui',
  '--filter',
  '@pilote/kpilote-shared',
]

/**
 * Apps qui portent réellement un tsc. kpilote-shared et kpilote-ui n'ont que prettier.
 * Chacune exige une étape de codegen AVANT tsc, sinon les types n'existent pas encore :
 * - kpilote-api : `prisma generate --sql` introspecte les tables réelles => BASE OBLIGATOIRE
 * - webapp/admin : `tsr generate` produit les types de routes TanStack Router
 */
const APPS_TYPEES = [
  { pkg: '@pilote/kpilote-api', prepare: ['prisma', 'generate', '--sql'] },
  { pkg: '@pilote/kpilote-webapp', prepare: ['tsr', 'generate'] },
  { pkg: '@pilote/kpilote-admin', prepare: ['tsr', 'generate'] },
]

/**
 * Apps qui portent des tests.
 *
 * kpilote-admin en a bien, contrairement à ce que ce commentaire a longtemps affirmé :
 * `src/components/centre-aide/{arbre,arbreDnd}.test.ts` et
 * `src/components/centre-aide/extensions/miseEnTitre.test.ts`, avec un `vitest.setup.ts` et
 * `environment: 'jsdom'`. L'exclure faisait passer ses bumps d'outillage de test (jsdom,
 * @testing-library/*) pour non couverts alors qu'ils le sont — et inversement, laissait croire
 * qu'un « tsc vert » y était le seul filet possible.
 */
const APPS_TESTEES = ['@pilote/kpilote-api', '@pilote/kpilote-webapp', '@pilote/kpilote-admin']

/** Env que la CI fournit aux tests (cf. testAndLint.yml). Aucun vrai backend n'est appelé. */
const ENV_TESTS = {
  VITE_API_URL: 'http://localhost:3000',
  OIDC_ISSUER_URL: 'https://example.test/realms/test',
  OIDC_JWKS_URI: 'https://example.test/realms/test/protocol/openid-connect/certs',
  OIDC_AUDIENCE: 'test-client',
  OIDC_AUTHORIZED_PARTY: 'test-client',
}

export function installer() {
  return run(['pnpm', 'install', '--no-frozen-lockfile'])
}

/**
 * Depuis Prisma 7, `db execute` lit la datasource depuis `prisma.config.ts` et REFUSE
 * --schema (« unknown or unexpected option »). Ne pas le rajouter : la doc et les
 * habitudes d'avant Prisma 7 induisent en erreur ici.
 */
export function verifierBaseAccessible() {
  const { code } = run(
    ['pnpm', '-F', '@pilote/kpilote-api', 'exec', 'prisma', 'db', 'execute', '--stdin'],
    {
      input: 'SELECT 1;',
    },
  )
  return code === 0
}

/**
 * Oracle rapide : install + tsc sur les 3 apps typées. ~30 s.
 * C'est le signal discriminant sur un codebase TS : signature changée, export retiré,
 * type modifié. Inutile de payer 3 min de tests pour un commit qui ne compile pas.
 */
export function oracleRapide() {
  const echecs = []

  const install = installer()
  if (install.code !== 0) {
    return { ok: false, echecs: [`install: ${derniereLigne(install.stderr)}`] }
  }

  for (const app of APPS_TYPEES) {
    const prepare = run(['pnpm', '-F', app.pkg, 'exec', ...app.prepare])
    if (prepare.code !== 0) {
      echecs.push(`${app.pkg}: ${app.prepare.join(' ')} — ${derniereLigne(prepare.stderr)}`)
      continue
    }
    const tsc = run(['pnpm', '-F', app.pkg, 'exec', 'tsc', '--noEmit'])
    if (tsc.code !== 0) {
      echecs.push(
        `${app.pkg}: tsc — ${compterErreursTsc(tsc.stdout)} erreurs\n${extrait(tsc.stdout)}`,
      )
    }
  }

  return { ok: echecs.length === 0, echecs }
}

/** Oracle complet : lint + tests + audit. Ne le lancer que si l'oracle rapide passe. */
export function oracleComplet() {
  const echecs = []

  for (const app of APPS_TYPEES) {
    const lint = run(['pnpm', 'lint'], { env: { APP_PACKAGE: app.pkg } })
    if (lint.code !== 0) echecs.push(`${app.pkg}: lint — ${extrait(lint.stdout || lint.stderr)}`)
  }

  for (const pkg of APPS_TESTEES) {
    const test = run(['pnpm', 'test'], { env: { APP_PACKAGE: pkg, ...ENV_TESTS } })
    if (test.code !== 0) echecs.push(`${pkg}: tests — ${extrait(test.stdout || test.stderr)}`)
  }

  // `pnpm audit` sort en non-zéro dès qu'il trouve une vulnérabilité : c'est une donnée, pas une erreur.
  const audit = run(['pnpm', 'audit', '--json'])
  return { ok: echecs.length === 0, echecs, audit: audit.stdout }
}

function derniereLigne(texte) {
  const lignes = (texte ?? '').trim().split('\n').filter(Boolean)
  return lignes[lignes.length - 1] ?? '(pas de sortie)'
}

function compterErreursTsc(sortie) {
  return (sortie.match(/error TS\d+/g) ?? []).length
}

/** Le rapport doit rester compact : on ne garde que les 20 premières lignes utiles. */
function extrait(sortie) {
  return (sortie ?? '').trim().split('\n').slice(0, 20).join('\n')
}
