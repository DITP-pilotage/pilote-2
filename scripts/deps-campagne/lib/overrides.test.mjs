import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  nomPaquetDepuisCle,
  parentDepuisCle,
  selecteurDepuisCle,
  verdictOverride,
  versionsResoluesDepuisWhy,
} from './overrides.mjs'

/**
 * Forme réelle de `pnpm why <pkg> -r --json --depth Infinity` : un tableau d'entrées
 * workspace, chacune portant un arbre imbriqué. Le paquet cherché apparaît à des
 * profondeurs variables, souvent plusieurs fois.
 */
const WHY_FIXTURE = [
  { name: 'pilote-monorepo', path: '/', private: true },
  {
    name: '@pilote/kpilote-api',
    version: '0.1.0',
    dependencies: {
      vite: {
        version: '8.0.10',
        dependencies: {
          terser: { version: '5.46.2' },
        },
      },
    },
  },
  {
    name: '@pilote/kpilote-webapp',
    version: '0.1.0',
    devDependencies: {
      'un-outil': {
        version: '1.0.0',
        dependencies: {
          terser: { version: '5.47.1' },
        },
      },
    },
    dependencies: {
      terser: { version: '5.46.2' },
    },
  },
]

test('nomPaquetDepuisCle gère un nom simple', () => {
  assert.equal(nomPaquetDepuisCle('hono'), 'hono')
})

test('nomPaquetDepuisCle gère un paquet scopé', () => {
  assert.equal(nomPaquetDepuisCle('@hono/node-server'), '@hono/node-server')
})

test('nomPaquetDepuisCle gère un sélecteur versionné', () => {
  assert.equal(nomPaquetDepuisCle('uuid@>=11.0.0 <11.1.1'), 'uuid')
})

test('nomPaquetDepuisCle gère un sélecteur versionné sur un paquet scopé', () => {
  assert.equal(nomPaquetDepuisCle('@types/node@>=20'), '@types/node')
})

test('selecteurDepuisCle rend * quand la clé ne porte pas de sélecteur', () => {
  assert.equal(selecteurDepuisCle('hono'), '*')
  assert.equal(selecteurDepuisCle('@hono/node-server'), '*')
})

test('selecteurDepuisCle extrait le range du sélecteur versionné', () => {
  assert.equal(selecteurDepuisCle('uuid@>=11.0.0 <11.1.1'), '>=11.0.0 <11.1.1')
  assert.equal(selecteurDepuisCle('@types/node@>=20'), '>=20')
})

test('un override à sélecteur versionné est INERTE si rien ne tombe dans sa fenêtre', () => {
  // Cas réel trouvé au premier run : "uuid@>=11.0.0 <11.1.1": ">=11.1.1".
  // Sans l'override, uuid se résout en 8.3.2 — hors de la fenêtre [11.0.0, 11.1.1),
  // donc l'override ne le réécrirait jamais. Comparer 8.3.2 à ">=11.1.1" est un
  // contresens : la valeur ne s'applique qu'aux versions que le sélecteur attrape.
  const v = verdictOverride({
    cle: 'uuid@>=11.0.0 <11.1.1',
    range: '>=11.1.1',
    versionsResolues: ['8.3.2'],
  })

  assert.equal(v.porteur, false, '8.3.2 est hors du sélecteur, donc jamais réécrit')
  assert.match(v.preuve, /sélecteur/)
})

test('un override à sélecteur versionné est PORTEUR si une version tombe dans sa fenêtre', () => {
  const v = verdictOverride({
    cle: 'uuid@>=11.0.0 <11.1.1',
    range: '>=11.1.1',
    versionsResolues: ['8.3.2', '11.0.5'],
  })

  assert.equal(v.porteur, true, '11.0.5 est dans le sélecteur et viole la valeur')
  assert.match(v.preuve, /11\.0\.5/)
})

test('un plancher déjà satisfait naturellement est inerte', () => {
  // hono: ">=4.12.18" — sans override, pnpm résout 4.12.27 tout seul.
  const v = verdictOverride({
    cle: 'hono',
    range: '>=4.12.18',
    versionsResolues: ['4.12.27'],
  })

  assert.equal(v.porteur, false)
  assert.match(v.preuve, /déjà conforme/)
})

test('un plancher non satisfait est porteur', () => {
  // @xmldom/xmldom: ">=0.9.10" — la chaîne speech-rule-engine pinne 0.9.9.
  const v = verdictOverride({
    cle: '@xmldom/xmldom',
    range: '>=0.9.10',
    versionsResolues: ['0.9.9'],
  })

  assert.equal(v.porteur, true)
  assert.match(v.preuve, /0\.9\.9/)
})

test('un PLAFOND dépassé est porteur — cas terser', () => {
  // terser: "<5.47.0" — le seul plafond des 9, et le seul non documenté.
  const v = verdictOverride({
    cle: 'terser',
    range: '<5.47.0',
    versionsResolues: ['5.47.1'],
  })

  assert.equal(v.porteur, true, 'un plafond franchi retient activement quelque chose')
})

test('un plafond non atteint est inerte', () => {
  const v = verdictOverride({
    cle: 'terser',
    range: '<5.47.0',
    versionsResolues: ['5.46.2'],
  })

  assert.equal(v.porteur, false)
})

test('une seule version hors range parmi plusieurs suffit à rendre porteur', () => {
  const v = verdictOverride({
    cle: 'postcss',
    range: '>=8.5.10',
    versionsResolues: ['8.5.11', '8.4.2', '8.5.10'],
  })

  assert.equal(v.porteur, true)
  assert.match(v.preuve, /8\.4\.2/)
})

test('aucune version résolue = paquet disparu de l arbre, donc inerte', () => {
  const v = verdictOverride({
    cle: 'mermaid',
    range: '>=11.15.0',
    versionsResolues: [],
  })

  assert.equal(v.porteur, false)
  assert.match(v.preuve, /absent de l'arbre/)
})

test('versionsResoluesDepuisWhy trouve le paquet à toutes les profondeurs, dédupliqué', () => {
  const versions = versionsResoluesDepuisWhy(WHY_FIXTURE, 'terser')

  assert.deepEqual(versions.sort(), ['5.46.2', '5.47.1'])
})

test('versionsResoluesDepuisWhy explore aussi les devDependencies', () => {
  // 5.47.1 n'est atteignable que via la branche devDependencies de la fixture.
  const versions = versionsResoluesDepuisWhy(WHY_FIXTURE, 'terser')

  assert.ok(versions.includes('5.47.1'), 'la branche devDependencies doit être explorée')
})

test('versionsResoluesDepuisWhy rend un tableau vide si le paquet est absent', () => {
  assert.deepEqual(versionsResoluesDepuisWhy(WHY_FIXTURE, 'paquet-inexistant'), [])
})

test('versionsResoluesDepuisWhy tolère une entrée workspace sans arbre', () => {
  // La première entrée de pnpm why est la racine du monorepo : ni dependencies ni version.
  assert.doesNotThrow(() => versionsResoluesDepuisWhy(WHY_FIXTURE, 'terser'))
})

test('versionsResoluesDepuisWhy ignore un noeud sans version', () => {
  const arbre = [{ name: 'x', dependencies: { terser: { from: 'terser' } } }]

  assert.deepEqual(versionsResoluesDepuisWhy(arbre, 'terser'), [])
})

test('nomPaquetDepuisCle vise l enfant d une clé parent>enfant', () => {
  // Constaté le 2026-10-29 : "evalite>fastify" était cherché tel quel dans l'arbre, donc
  // déclaré absent, alors que pilote-ppg tire bien evalite > fastify.
  assert.equal(nomPaquetDepuisCle('evalite>fastify'), 'fastify')
  assert.equal(nomPaquetDepuisCle('evalite>@fastify/static'), '@fastify/static')
  assert.equal(nomPaquetDepuisCle('@scope/parent@^2>enfant@<3'), 'enfant')
})

test('selecteurDepuisCle lit le sélecteur de l enfant, pas celui du parent', () => {
  assert.equal(selecteurDepuisCle('evalite>fastify'), '*')
  assert.equal(selecteurDepuisCle('parent@^2>enfant@>=3 <4'), '>=3 <4')
})

test('parentDepuisCle distingue le séparateur parent>enfant d un > de range', () => {
  assert.equal(parentDepuisCle('evalite>fastify'), 'evalite')
  assert.equal(parentDepuisCle('@scope/parent@^2>enfant'), '@scope/parent')
  assert.equal(parentDepuisCle('brace-expansion@>=2 <3'), null)
  assert.equal(parentDepuisCle('uuid@>11.0.0'), null)
  assert.equal(parentDepuisCle('hono'), null)
})

test('versionsResoluesDepuisWhy ne compte que les enfants directs du parent demandé', () => {
  const arbre = [
    {
      name: '@pilote/ppg',
      devDependencies: {
        evalite: { version: '1.0.0', dependencies: { fastify: { version: '5.12.7' } } },
        autre: { version: '1.0.0', dependencies: { fastify: { version: '4.0.0' } } },
      },
    },
  ]

  assert.deepEqual(versionsResoluesDepuisWhy(arbre, 'fastify', 'evalite'), ['5.12.7'])
  assert.deepEqual(versionsResoluesDepuisWhy(arbre, 'fastify').sort(), ['4.0.0', '5.12.7'])
})

test('un override parent>enfant présent sous son parent n est pas déclaré absent', () => {
  const v = verdictOverride({
    cle: 'evalite>fastify',
    range: '>=5.12.5 <6',
    versionsResolues: ['5.12.7'],
  })

  assert.equal(v.nom, 'fastify')
  assert.equal(v.parent, 'evalite')
  assert.equal(v.porteur, false)
  assert.match(v.preuve, /fastify \(sous evalite\) se résout en 5\.12\.7 — déjà conforme/)
})
