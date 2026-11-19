import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import {
  axeWarningsOf,
  CHILD_LIMIT,
  edgesOf,
  lanesOf,
  matchingIds,
  nodeMetaOf,
  type PlacedNode,
  revealNode,
  searchSummaryOf,
  suggestModaliteId,
} from '@/lib/axeGraphe'

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

describe('searchSummaryOf', () => {
  it('dit qu’aucune modalité ne correspond', () => {
    expect(searchSummaryOf(0)).toBe('Aucune modalité ne correspond.')
  })

  it('accorde le nombre de modalités affichées', () => {
    expect(searchSummaryOf(1)).toBe('1 modalité affichée (résultats et leurs parents)')
    expect(searchSummaryOf(3)).toBe('3 modalités affichées (résultats et leurs parents)')
  })
})

describe('axeWarningsOf', () => {
  const niveau = (ordre: number) => ({ ordre, nom: `Niveau ${ordre}` })

  it('signale un niveau vide, une feuille trop haute et une parente à enfant unique', () => {
    const arbre = buildArbre([
      modalite({ id: 'OP' }),
      modalite({ id: 'OP-ORANGE', parent: 'OP', niveau: 2 }),
      modalite({ id: 'SEULE' }),
    ])
    const warnings = axeWarningsOf({ arbre, niveaux: [niveau(1), niveau(2), niveau(3)] })
    expect(warnings.emptyNiveaux.map((empty) => empty.ordre)).toEqual([3])
    expect(warnings.earlyFeuilles.map((feuille) => feuille.id)).toEqual(['OP-ORANGE', 'SEULE'])
    expect(warnings.singleChildParentes.map((parente) => parente.id)).toEqual(['OP'])
    expect(warnings.count).toBe(4)
    expect(warnings.isTruncated).toBe(false)
  })

  it('ne signale rien sur un axe complet', () => {
    const arbre = buildArbre([modalite({ id: 'A' }), modalite({ id: 'B' })])
    expect(axeWarningsOf({ arbre, niveaux: [niveau(1)] }).count).toBe(0)
  })
})

describe('lanesOf', () => {
  it('range le niveau le plus fin à gauche et « Tous » dans la dernière colonne', () => {
    expect(lanesOf(2)).toEqual([
      { column: 0, ordre: 2 },
      { column: 1, ordre: 1 },
      { column: 2, ordre: 0 },
    ])
  })
})

const placedOf = (node: { id: string; parent: string | null; children?: string[] }) =>
  ({
    nom: node.id,
    kind: 'parente',
    niveau: 1,
    children: [],
    x: 0,
    y: 0,
    hidden: 0,
    ...node,
  }) satisfies PlacedNode

describe('edgesOf', () => {
  it('relie chaque nœud placé à sa parente placée', () => {
    const placed = new Map([
      [TOUS_ID, placedOf({ id: TOUS_ID, parent: null })],
      ['A', placedOf({ id: 'A', parent: TOUS_ID })],
      ['B', placedOf({ id: 'B', parent: 'CACHEE' })],
    ])
    expect(edgesOf(placed).map(({ node, parent }) => `${node.id}>${parent.id}`)).toEqual([
      `A>${TOUS_ID}`,
    ])
  })
})

describe('nodeMetaOf', () => {
  it('nomme l’opération seulement en simulation', () => {
    const node = placedOf({ id: 'A', parent: TOUS_ID, children: ['A1', 'A2'] })
    expect(nodeMetaOf({ node, isSimulating: false, fonction: 'AVG' })).toBe('Calcul de 2 enfants')
    expect(nodeMetaOf({ node, isSimulating: true, fonction: 'AVG' })).toBe('Moyenne de 2 enfants')
  })

  it('compte les modalités repliées', () => {
    const node = { ...placedOf({ id: 'A', parent: TOUS_ID, children: ['A1'] }), hidden: 3 }
    expect(nodeMetaOf({ node, isSimulating: false, fonction: 'SUM' })).toBe('3 modalités repliées')
  })
})
