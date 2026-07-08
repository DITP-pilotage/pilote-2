import { type IndividuApiModel } from '@pilote/kpilot-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilot-shared/referentiel'
import { describe, expect, it } from 'vitest'

import { buildOrderedNodes } from './hierarchy'
import { resolveIndividuReferentielPair } from './pair'

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

const buildTree = () => {
  const refNat = referentiel('REF-NAT', 'National')
  const refReg = referentiel('REF-REG', 'Régions')
  const refsById = new Map([
    [refNat.id, refNat],
    [refReg.id, refReg],
  ])
  const fr = individu('IND-FR', 'France', 'REF-NAT')
  const idf = individu('IND-IDF', 'Île-de-France', 'REF-REG', ['IND-FR'])
  return buildOrderedNodes([fr, idf], refsById)
}

describe('resolveIndividuReferentielPair', () => {
  it('renvoie `no-hierarchy` quand aucun node disponible', () => {
    expect(resolveIndividuReferentielPair([], { individu: 'IND-FR' })).toEqual({
      kind: 'no-hierarchy',
    })
  })

  it('valide une paire (individu, referentiel) cohérente', () => {
    const nodes = buildTree()
    expect(
      resolveIndividuReferentielPair(nodes, { individu: 'IND-IDF', referentiel: 'REF-REG' }),
    ).toEqual({
      kind: 'valid',
      pair: { individu: 'IND-IDF', referentiel: 'REF-REG' },
    })
  })

  it("renvoie un mismatch avec fallback sur l'individu connu si referentiel incohérent", () => {
    const nodes = buildTree()
    const resolution = resolveIndividuReferentielPair(nodes, {
      individu: 'IND-IDF',
      referentiel: 'REF-NAT',
    })
    expect(resolution).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'IND-IDF', referentiel: 'REF-REG' },
    })
  })

  it('fallback sur la racine si individu inconnu', () => {
    const nodes = buildTree()
    const resolution = resolveIndividuReferentielPair(nodes, {
      individu: 'IND-INCONNU',
      referentiel: 'REF-REG',
    })
    expect(resolution).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'IND-FR', referentiel: 'REF-NAT' },
    })
  })

  it('fallback sur la racine si individu absent des deps', () => {
    const nodes = buildTree()
    const resolution = resolveIndividuReferentielPair(nodes, {})
    expect(resolution).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'IND-FR', referentiel: 'REF-NAT' },
    })
  })
})
