import { run } from './shell.mjs'

/**
 * Périmètre des bumps : TOUT le monorepo npm depuis le 2026-09-10.
 *
 * Le périmètre était limité à kpilote jusque-là. Deux incidents ont montré que ce
 * découpage est une illusion, parce que le `pnpm-lock.yaml` est partagé :
 *
 * 1. `pilote-ppg-auth` n'était bumpé par personne — ni par cet outil, ni à la main. Il
 *    a porté un `hono` vulnérable (9 advisories, dont une HIGH) pendant des mois pendant
 *    que les apps kpilote flottaient plus haut.
 * 2. Le bump tiptap du 2026-09-10, pourtant « kpilote only », a cassé le tsc de
 *    `pilote-ppg` (17 erreurs). `@tiptap/starter-kit` déclare des CARETS sur ses paquets
 *    frères : dès que la 3.30.5 entre quelque part dans le monorepo, le starter-kit de ppg
 *    s'y résout, alors que ppg garde son `core` en 3.29.2. Deux `@tiptap/core` dans un
 *    seul programme tsc. Les pins exacts des dépendances directes n'y peuvent rien : ils
 *    n'atteignent pas les carets internes des paquets tiers.
 *
 * Conclusion : on ne peut pas bumper une moitié du monorepo. Soit tout monte, soit rien.
 *
 * Le périmètre doit couvrir TOUS les workspaces, y compris ceux qui n'ont pas de tsc à eux.
 * Un package laissé hors filtre garde sa résolution figée pendant que les autres montent,
 * et deux copies de la même dépendance se retrouvent dans un seul programme tsc.
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
export const FILTRES_CAMPAGNE = [
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
  '--filter',
  '@pilote/ppg',
  '--filter',
  'pilote-ppg-auth',
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
  // ppg épuise la pile par défaut de Node sur ce codebase : il lui faut --stack-size, et
  // celui-ci est REFUSÉ dans NODE_OPTIONS (« --stack-size= is not allowed »). Il faut donc
  // invoquer le binaire tsc par node, pas par le shim pnpm.
  // Son tsconfig a `incremental: true` : sans purge du .tsbuildinfo entre deux commits,
  // tsc réutilise le cache et rend un VERT FAUX. Mesuré le 2026-09-10.
  {
    pkg: '@pilote/ppg',
    prepare: ['prisma', 'generate'],
    purger: 'tsconfig.tsbuildinfo',
    tsc: ['node', '--stack-size=8000', './node_modules/typescript/bin/tsc'],
  },
  { pkg: 'pilote-ppg-auth' },
]

/**
 * Apps qui portent un script `lint`. `pilote-ppg-auth` n'en a PAS — il n'a qu'un
 * `typecheck`, déjà couvert par l'oracle rapide via APPS_TYPEES. L'inclure ici ferait
 * échouer l'oracle sur un script inexistant, ce qui se lirait comme une régression.
 */
const APPS_LINTEES = [
  '@pilote/kpilote-api',
  '@pilote/kpilote-webapp',
  '@pilote/kpilote-admin',
  '@pilote/ppg',
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
 *
 * kpilote-ui (19 tests) et kpilote-shared (53 tests depuis le socle analytics) en portent
 * aussi. Ce sont les deux workspaces sans `tsc` à eux : leurs tests sont donc leur SEUL
 * filet, ce qui rend leur omission d'autant plus coûteuse.
 */
const APPS_TESTEES = [
  '@pilote/kpilote-api',
  '@pilote/kpilote-webapp',
  '@pilote/kpilote-admin',
  '@pilote/kpilote-ui',
  '@pilote/kpilote-shared',
  '@pilote/ppg',
  'pilote-ppg-auth',
]

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
 * Base de TEST de ppg (port 7433 dans son `.env.test`), indispensable depuis que ppg est
 * dans le périmètre : ses tests l'attaquent réellement. La CI la monte en service postgres
 * et joue `pnpm test:database:init` avant les tests — en local elle doit être levée.
 * Le moteur ne touche JAMAIS aux conteneurs, il se contente de constater.
 */
export function verifierBaseTestPpgAccessible() {
  const { code } = run(
    ['pnpm', '-F', '@pilote/ppg', 'exec', 'dotenv', '-e', '.env.test', '--', 'prisma', 'db', 'execute', '--stdin'],
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
    if (app.prepare) {
      const prepare = run(['pnpm', '-F', app.pkg, 'exec', ...app.prepare])
      if (prepare.code !== 0) {
        echecs.push(`${app.pkg}: ${app.prepare.join(' ')} — ${derniereLigne(prepare.stderr)}`)
        continue
      }
    }
    // Un cache incrémental survivant d'un commit à l'autre rend un vert faux.
    if (app.purger) {
      run(['pnpm', '-F', app.pkg, 'exec', 'rm', '-f', app.purger])
    }
    const tsc = run(['pnpm', '-F', app.pkg, 'exec', ...(app.tsc ?? ['tsc', '--noEmit'])])
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

  for (const pkg of APPS_LINTEES) {
    const lint = run(['pnpm', 'lint'], { env: { APP_PACKAGE: pkg } })
    if (lint.code !== 0) echecs.push(`${pkg}: lint — ${extrait(lint.stderr, lint.stdout)}`)
  }

  for (const pkg of APPS_TESTEES) {
    const test = run(['pnpm', 'test'], { env: { APP_PACKAGE: pkg, ...ENV_TESTS } })
    if (test.code !== 0) echecs.push(`${pkg}: tests — ${extrait(test.stderr, test.stdout)}`)
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

/**
 * Le rapport doit rester compact — mais par la BONNE extrémité.
 *
 * Cette fonction gardait les 20 PREMIÈRES lignes. Pour `pnpm lint` comme pour `vitest`, ces
 * 20 lignes sont le préambule pnpm et le bruit de migration : le message d'erreur réel n'y est
 * jamais. Mesuré le 2026-09-10 — l'échec du bump TypeScript 7 a été enregistré sans une seule
 * ligne d'erreur, et il a fallu le reproduire à la main pour apprendre qu'il s'agissait de
 * « typescript-eslint does not support TS 7.0 ».
 *
 * Et stderr était ÉCARTÉ dès que stdout était non vide (`stdout || stderr`), ce qui suffit à
 * perdre tout crash qui ne passe pas par stdout. On concatène les deux, et on garde la fin.
 */
function extrait(...sorties) {
  const lignes = sorties
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join('\n')
    .split('\n')
  return lignes.slice(-20).join('\n')
}
