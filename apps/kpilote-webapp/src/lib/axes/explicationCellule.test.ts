import { buildModaliteTree, TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import { type TermeExplication } from '@pilote/kpilote-shared/valeursCombinaison'
import { describe, expect, it } from 'vitest'

import { buildNomOfIndividu, orderTermes, referenceLinesOf } from '@/lib/axes/explicationCellule'
import { type AxeTableau } from '@/lib/axes/tableauValeurs'

const terme = ({
  individu,
  valeur,
}: {
  individu: string
  valeur: number | null
}): TermeExplication => ({
  ids: [TOUS_ID],
  individu,
  valeur,
  source: valeur === null ? 'manquante' : 'saisie',
  date: null,
})

const termes = [
  terme({ individu: 'REG-01', valeur: 10 }),
  terme({ individu: 'REG-02', valeur: null }),
  terme({ individu: 'REG-03', valeur: 30 }),
]

describe('orderTermes', () => {
  it('trie du plus grand au plus petit, met les termes sans valeur à la fin et donne leur part en somme', () => {
    const ordered = orderTermes({ termes, fonction: 'SUM', nomOf: (item) => item.individu })

    expect(ordered.map((item) => item.nom)).toEqual(['REG-03', 'REG-01', 'REG-02'])
    expect(ordered.map((item) => item.part)).toEqual([0.75, 0.25, null])
  })

  it('ne donne pas de part en moyenne', () => {
    const ordered = orderTermes({ termes, fonction: 'AVG', nomOf: (item) => item.individu })

    expect(ordered.every((item) => item.part === null)).toBe(true)
  })
})

describe('referenceLinesOf', () => {
  it('nomme chaque axe avec sa modalité, « Tous » quand il n’est pas précisé', () => {
    const axe = (id: string, nom: string): AxeTableau => ({
      id,
      nom,
      fonction: 'SUM',
      tree: buildModaliteTree({
        modalites: [{ id: 'ORANGE', nom: 'Orange', niveau: 1, parent: null }],
      }),
    })

    expect(
      referenceLinesOf({
        axes: [axe('OP', 'Opérateur'), axe('FR', 'Fraude')],
        ids: ['ORANGE', TOUS_ID],
      }),
    ).toEqual([
      { label: 'Opérateur', value: 'Orange' },
      { label: 'Fraude', value: 'Tous' },
    ])
  })
})

describe('buildNomOfIndividu', () => {
  it('donne le nom d’un individu connu et retombe sur son identifiant sinon', () => {
    const nomOf = buildNomOfIndividu([{ id: 'REG-84', nom: 'Auvergne-Rhône-Alpes' }])

    expect(nomOf('REG-84')).toBe('Auvergne-Rhône-Alpes')
    expect(nomOf('REG-93')).toBe('REG-93')
    expect(buildNomOfIndividu(undefined)('REG-84')).toBe('REG-84')
  })
})
