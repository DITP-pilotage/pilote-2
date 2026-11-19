import { describe, expect, it } from 'vitest'

import {
  ancestorsOf,
  buildModaliteTree,
  countFeuilles,
  depthFirst,
  descendantsOf,
  TOUS_ID,
} from './modaliteTree'

const modalites = [
  { id: 'FISCALE', nom: 'Fiscale', niveau: 1, parent: null },
  { id: 'SOCIALE', nom: 'Sociale', niveau: 1, parent: null },
  { id: 'TVA', nom: 'TVA', niveau: 2, parent: 'FISCALE' },
  { id: 'IR', nom: 'Impôt sur le revenu', niveau: 2, parent: 'FISCALE' },
]

describe('buildModaliteTree', () => {
  it('rattache les modalités du premier niveau à « Tous »', () => {
    const tree = buildModaliteTree({ modalites })

    expect(tree.get(TOUS_ID)).toMatchObject({
      nom: 'Tous',
      kind: 'tous',
      niveau: 0,
      children: ['FISCALE', 'SOCIALE'],
    })
    expect(tree.get('FISCALE')).toMatchObject({ kind: 'parente', parent: TOUS_ID })
    expect(tree.get('TVA')).toMatchObject({ kind: 'feuille', parent: 'FISCALE' })
  })

  it('nomme « Tous » à la demande', () => {
    const tree = buildModaliteTree({ modalites, tousNom: 'Tous (Type de fraude)' })

    expect(tree.get(TOUS_ID)?.nom).toBe('Tous (Type de fraude)')
  })

  it('compte les feuilles', () => {
    expect(countFeuilles(buildModaliteTree({ modalites }))).toBe(3)
  })
})

describe('parcours', () => {
  const tree = buildModaliteTree({ modalites })

  it('remonte les ancêtres jusqu’à « Tous »', () => {
    expect(ancestorsOf({ tree, id: 'TVA' }).map((node) => node.id)).toEqual(['FISCALE', TOUS_ID])
  })

  it('liste la descendance', () => {
    expect(descendantsOf({ tree, id: TOUS_ID })).toEqual(['FISCALE', 'TVA', 'IR', 'SOCIALE'])
  })

  it('lit chaque parente suivie de sa descendance, sauf si elle est repliée', () => {
    expect(depthFirst({ tree }).map((node) => node.id)).toEqual([
      TOUS_ID,
      'FISCALE',
      'TVA',
      'IR',
      'SOCIALE',
    ])
    expect(depthFirst({ tree, isOpen: (id) => id !== 'FISCALE' }).map((node) => node.id)).toEqual([
      TOUS_ID,
      'FISCALE',
      'SOCIALE',
    ])
  })
})
