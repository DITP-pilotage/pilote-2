import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import { computeSerie, computeValeurs } from '@/lib/axeSerie'

const modalite = ({
  id,
  parent = null,
  niveau = 1,
}: {
  id: string
  parent?: string | null
  niveau?: number
}): ModaliteApiModel => ({
  id,
  nom: id,
  parent,
  niveau,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const arbre = buildArbre([
  modalite({ id: 'CPAM' }),
  modalite({ id: 'CAF' }),
  modalite({ id: 'MSA' }),
])

describe('computeSerie', () => {
  it('attend une modalité saisie plus tard, manquante avant sa première valeur', () => {
    const serie = computeSerie({
      arbre,
      saisies: { CPAM: ['10', '10', '10'], CAF: ['', '', '5'] },
      fonction: 'SUM',
    })

    expect(
      serie
        .get('CAF')
        ?.slice(0, 3)
        .map((cellule) => cellule.statut),
    ).toEqual(['manquante', 'manquante', 'saisie'])
    expect(serie.get(TOUS_ID)?.[0]).toMatchObject({ value: 10, present: 1, expected: 2 })
    expect(serie.get(TOUS_ID)?.[2]).toMatchObject({ value: 15, present: 2, expected: 2 })
  })

  it('reporte la dernière valeur connue sur les périodes sans saisie', () => {
    const serie = computeSerie({ arbre, saisies: { CPAM: ['10', '', '12'] }, fonction: 'SUM' })

    expect(serie.get('CPAM')?.[1]).toMatchObject({ value: 10, statut: 'reportee' })
    expect(serie.get('CPAM')?.[5]).toMatchObject({ value: 12, statut: 'reportee' })
  })

  it('ignore une modalité jamais saisie : ni 0, ni manquante', () => {
    const serie = computeSerie({
      arbre,
      saisies: { CPAM: ['10'], CAF: ['20'] },
      fonction: 'AVG',
    })

    expect(serie.get('MSA')?.[0]?.statut).toBe('absente')
    expect(serie.get(TOUS_ID)?.[0]).toMatchObject({ value: 15, present: 2, expected: 2 })
  })
})

describe('computeValeurs', () => {
  it('sort une feuille vide du calcul de sa parente', () => {
    const valeurs = computeValeurs({ arbre, saisies: { CPAM: '10', CAF: '' }, fonction: 'SUM' })

    expect(valeurs.get('CAF')?.statut).toBe('absente')
    expect(valeurs.get(TOUS_ID)).toMatchObject({ value: 10, present: 1, expected: 1 })
  })
})
