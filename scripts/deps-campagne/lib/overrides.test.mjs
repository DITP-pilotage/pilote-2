import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nomPaquetDepuisCle, verdictOverride } from './overrides.mjs'

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
