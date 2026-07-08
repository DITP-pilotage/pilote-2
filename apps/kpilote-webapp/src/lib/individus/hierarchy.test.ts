import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'
import { describe, expect, it } from 'vitest'

import { buildOrderedNodes, pickRoot } from './hierarchy'

const referentiel = (id: string, nom: string): ReferentielApiModel => ({
  id,
  nom,
  description: null,
  nombreIndividus: 0,
  widgets: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const individu = (
  id: string,
  nom: string,
  referentielId: string,
  parents: string[] = [],
): IndividuApiModel => ({
  id,
  nom,
  referentiel: referentielId,
  parents,
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('buildOrderedNodes', () => {
  it('place les individus sans parent en racine (depth 0)', () => {
    const refNat = referentiel('REF-NAT', 'National')
    const refsById = new Map([[refNat.id, refNat]])
    const fr = individu('IND-FR', 'France', 'REF-NAT')

    const nodes = buildOrderedNodes([fr], refsById)

    expect(nodes).toHaveLength(1)
    expect(nodes[0]!.depth).toBe(0)
    expect(nodes[0]!.parentPath).toEqual([])
    expect(nodes[0]!.individu.id).toBe('IND-FR')
  })

  it('lie un enfant à son parent présent dans la liste', () => {
    const refNat = referentiel('REF-NAT', 'National')
    const refReg = referentiel('REF-REG', 'Régions')
    const refsById = new Map([
      [refNat.id, refNat],
      [refReg.id, refReg],
    ])
    const fr = individu('IND-FR', 'France', 'REF-NAT')
    const idf = individu('IND-IDF', 'Île-de-France', 'REF-REG', ['IND-FR'])

    const nodes = buildOrderedNodes([fr, idf], refsById)

    expect(nodes.map((n) => [n.individu.id, n.depth])).toEqual([
      ['IND-FR', 0],
      ['IND-IDF', 1],
    ])
    expect(nodes[1]!.parentPath).toEqual(['France'])
  })

  it("trie chaque niveau par nom dans l'ordre français", () => {
    const ref = referentiel('REF-REG', 'Régions')
    const refsById = new Map([[ref.id, ref]])
    const occitanie = individu('IND-OCC', 'Occitanie', 'REF-REG')
    const auvergne = individu('IND-ARA', 'Auvergne', 'REF-REG')
    const ileDeFrance = individu('IND-IDF', 'Île-de-France', 'REF-REG')

    const nodes = buildOrderedNodes([occitanie, auvergne, ileDeFrance], refsById)

    expect(nodes.map((n) => n.individu.id)).toEqual(['IND-ARA', 'IND-IDF', 'IND-OCC'])
  })

  it("ignore un parent qui n'est pas dans la liste fournie (racine implicite)", () => {
    const ref = referentiel('REF-REG', 'Régions')
    const refsById = new Map([[ref.id, ref]])
    const idf = individu('IND-IDF', 'Île-de-France', 'REF-REG', ['IND-FR-ABSENT'])

    const nodes = buildOrderedNodes([idf], refsById)

    expect(nodes).toHaveLength(1)
    expect(nodes[0]!.depth).toBe(0)
  })

  it("écarte les individus dont le référentiel n'est pas fourni", () => {
    const ref = referentiel('REF-NAT', 'National')
    const refsById = new Map([[ref.id, ref]])
    const fr = individu('IND-FR', 'France', 'REF-NAT')
    const orphelin = individu('IND-X', 'Orphelin', 'REF-INCONNU')

    const nodes = buildOrderedNodes([fr, orphelin], refsById)

    expect(nodes.map((n) => n.individu.id)).toEqual(['IND-FR'])
  })
})

describe('pickRoot', () => {
  it('renvoie la première racine rencontrée', () => {
    const ref = referentiel('REF-NAT', 'National')
    const refsById = new Map([[ref.id, ref]])
    const fr = individu('IND-FR', 'France', 'REF-NAT')

    const root = pickRoot(buildOrderedNodes([fr], refsById))

    expect(root?.individu.id).toBe('IND-FR')
  })

  it('renvoie la première racine par ordre du nom quand il y en a plusieurs', () => {
    const ref = referentiel('REF-MIN', 'Ministères')
    const refsById = new Map([[ref.id, ref]])
    const economie = individu('IND-ECO', 'Économie', 'REF-MIN')
    const culture = individu('IND-CUL', 'Culture', 'REF-MIN')

    const root = pickRoot(buildOrderedNodes([economie, culture], refsById))

    expect(root?.individu.id).toBe('IND-CUL')
  })

  it('renvoie null sur un arbre vide', () => {
    expect(pickRoot([])).toBeNull()
  })
})
