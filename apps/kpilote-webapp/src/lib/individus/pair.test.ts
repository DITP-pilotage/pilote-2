import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'
import { describe, expect, it } from 'vitest'

import { buildNodesCube } from '@/tests/factories/dimensions'

import { buildOrderedNodes } from './hierarchy'
import { resolveIndividuReferentielPair } from './pair'

const referentiel = (id: string, nom: string): ReferentielApiModel => ({
  id,
  nom,
  description: null,
  dimension: 'DIM-TERRITOIRE',
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

  it('restreint l’individu par défaut aux référentiels donnés, pas les individus acceptés', () => {
    // « Orange » précède « France » : sans restriction, la racine par défaut serait un opérateur.
    const nodes = buildNodesCube().filter((n) => n.individu.id !== 'OP-SFR')
    const territoire = ['REF-NAT', 'REF-DEPT']
    expect(resolveIndividuReferentielPair(nodes, {}, territoire)).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'FR', referentiel: 'REF-NAT' },
    })
    expect(
      resolveIndividuReferentielPair(
        nodes,
        { individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR' },
        territoire,
      ),
    ).toEqual({ kind: 'valid', pair: { individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR' } })
  })
})
