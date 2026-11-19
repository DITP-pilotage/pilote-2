import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import { CHILD_LIMIT, matchingIds, revealNode, suggestModaliteId } from '@/lib/axeGraphe'

const modalite = ({
  id,
  nom = id,
  parent = null,
  niveau = 1,
}: {
  id: string
  nom?: string
  parent?: string | null
  niveau?: number
}): ModaliteApiModel => ({
  id,
  nom,
  parent,
  niveau,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('suggestModaliteId', () => {
  it('préfixe le nom sans accent par le début de l’identifiant du parent', () => {
    expect(suggestModaliteId({ nom: 'Île-de-France', parent: 'FR-NORD' })).toBe('FR-ILE-DE-FRANCE')
  })

  it('ne préfixe pas une modalité du premier niveau', () => {
    expect(suggestModaliteId({ nom: 'Orange', parent: TOUS_ID })).toBe('ORANGE')
  })
})

describe('matchingIds', () => {
  const arbre = buildArbre([
    modalite({ id: 'OP', nom: 'Opérateurs' }),
    modalite({ id: 'OP-ORANGE', nom: 'Orange', parent: 'OP', niveau: 2 }),
    modalite({ id: 'AUTRE' }),
  ])

  it('garde les ancêtres d’une modalité trouvée, sans tenir compte des accents', () => {
    expect(matchingIds({ arbre, search: 'orange' })).toEqual(new Set([TOUS_ID, 'OP-ORANGE', 'OP']))
    expect(matchingIds({ arbre, search: 'operateur' })).toEqual(new Set([TOUS_ID, 'OP']))
  })

  it('ne filtre rien sans recherche', () => {
    expect(matchingIds({ arbre, search: '  ' })).toBeNull()
  })
})

describe('revealNode', () => {
  it('déplie les ancêtres et lève la limite d’affichage qui cache la modalité', () => {
    const enfants = Array.from({ length: CHILD_LIMIT + 1 }, (_, index) =>
      modalite({ id: `E${index}`, parent: 'P', niveau: 2 }),
    )
    const arbre = buildArbre([modalite({ id: 'P' }), ...enfants])

    const display = revealNode({
      arbre,
      id: `E${CHILD_LIMIT}`,
      display: { collapsed: new Set(['P']), showAll: new Set() },
    })

    expect(display.collapsed.has('P')).toBe(false)
    expect(display.showAll.has('P')).toBe(true)
  })
})
