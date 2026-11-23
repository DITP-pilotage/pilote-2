import { buildModaliteTree, TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import { describe, expect, it } from 'vitest'

import {
  buildCelluleIds,
  buildTableauValeursContext,
  describeChargementError,
  initialCollapsed,
  modalitesOf,
  syncFixedIds,
  toggleIn,
  withColumnsAxe,
  withRowsAxe,
} from '@/lib/axes/tableauValeurs'

describe('layout', () => {
  it('échange lignes et colonnes quand on choisit en lignes l’axe en colonnes', () => {
    expect(withRowsAxe({ layout: { rows: 0, columns: 1 }, index: 1 })).toEqual({
      rows: 1,
      columns: 0,
    })
    expect(withRowsAxe({ layout: { rows: 0, columns: 1 }, index: 2 })).toEqual({
      rows: 2,
      columns: 1,
    })
  })

  it('échange aussi quand on choisit en colonnes l’axe en lignes', () => {
    expect(withColumnsAxe({ layout: { rows: 0, columns: 1 }, index: 0, axesCount: 3 })).toEqual({
      rows: 1,
      columns: 0,
    })
  })

  it('passe les lignes sur un autre axe quand les colonnes étaient les périodes', () => {
    expect(withColumnsAxe({ layout: { rows: 0, columns: null }, index: 0, axesCount: 2 })).toEqual({
      rows: 1,
      columns: 0,
    })
  })

  it('revient aux périodes en colonnes', () => {
    expect(withColumnsAxe({ layout: { rows: 1, columns: 0 }, index: null, axesCount: 2 })).toEqual({
      rows: 1,
      columns: null,
    })
  })
})

describe('buildCelluleIds', () => {
  it('croise la ligne, la colonne et les modalités fixées', () => {
    expect(
      buildCelluleIds({
        layout: { rows: 2, columns: 0 },
        fixedIds: [TOUS_ID, 'TVA', TOUS_ID],
        row: 'FT',
        column: 'FR',
      }),
    ).toEqual(['FR', 'TVA', 'FT'])
  })

  it('sans axe en colonnes, garde les modalités fixées ailleurs', () => {
    expect(
      buildCelluleIds({
        layout: { rows: 0, columns: null },
        fixedIds: [TOUS_ID, 'TVA'],
        row: 'FT',
        column: null,
      }),
    ).toEqual(['FT', 'TVA'])
  })
})

describe('initialCollapsed', () => {
  it('déplie un petit arbre', () => {
    const tree = buildModaliteTree({
      modalites: [
        { id: 'FISCALE', nom: 'Fiscale', niveau: 1, parent: null },
        { id: 'TVA', nom: 'TVA', niveau: 2, parent: 'FISCALE' },
      ],
    })
    expect(initialCollapsed(tree).size).toBe(0)
  })

  it('replie les parentes du premier niveau d’un grand arbre', () => {
    const feuilles = Array.from({ length: 45 }, (_, index) => ({
      id: `F${index}`,
      nom: `Feuille ${index}`,
      niveau: 2,
      parent: 'FISCALE',
    }))
    const tree = buildModaliteTree({
      modalites: [
        { id: 'FISCALE', nom: 'Fiscale', niveau: 1, parent: null },
        { id: 'SOCIALE', nom: 'Sociale', niveau: 1, parent: null },
        ...feuilles,
      ],
    })
    expect([...initialCollapsed(tree)]).toEqual(['FISCALE'])
  })
})

describe('toggleIn', () => {
  it('ajoute puis retire un id', () => {
    const once = toggleIn({ set: new Set(), id: 'A' })
    expect([...once]).toEqual(['A'])
    expect([...toggleIn({ set: once, id: 'A' })]).toEqual([])
  })
})

describe('buildTableauValeursContext', () => {
  it('range les séries par combinaison et réunit les périodes', () => {
    const modalite = (id: string) => ({
      id,
      nom: id,
      niveau: 1,
      parent: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    })
    const point = (date: string, valeur: number) => ({
      indicateur: 'IND',
      individu: 'D84',
      date,
      valeur,
      type: 'saisie' as const,
    })

    const context = buildTableauValeursContext({
      axes: [
        { id: 'OPERATEUR', nom: 'Opérateur', fonction: 'SUM', modalites: [modalite('FT')] },
        { id: 'TYPE', nom: 'Type', fonction: 'AVG', modalites: [modalite('TVA')] },
      ],
      items: [
        { modalites: ['FT', 'TVA'], valeurs: [point('2025-02-01', 2)] },
        { modalites: ['TVA'], valeurs: [point('2025-01-01', 1)] },
      ],
    })

    expect(context.axes.map((axe) => axe.tree.get(TOUS_ID)?.nom)).toEqual([
      'Tous (Opérateur)',
      'Tous (Type)',
    ])
    expect([...context.series.keys()]).toEqual(['FT|TVA', `${TOUS_ID}|TVA`])
    expect(context.periodes).toEqual(['2025-01-01', '2025-02-01'])
  })
})

describe('syncFixedIds', () => {
  it('ne change que les axes dont le sélecteur de la page a bougé', () => {
    expect(
      syncFixedIds({
        fixedIds: ['FT', 'TVA', 'X'],
        previous: [null, null, 'X'],
        next: ['CAF', null, null],
      }),
    ).toEqual(['CAF', 'TVA', TOUS_ID])
  })
})

describe('modalitesOf', () => {
  it('garde les modalités fixées d’une combinaison, sans « Tous »', () => {
    expect(modalitesOf(['FT', TOUS_ID, 'TVA'])).toEqual(['FT', 'TVA'])
  })
})

describe('describeChargementError', () => {
  it('reprend le message de l’API quand elle refuse la lecture', () => {
    const body = { code: 'TROP_DE_COMBINAISONS', message: '2 400 combinaisons, au-delà de 2 000.' }

    expect(describeChargementError({ status: 400, body })).toBe(body.message)
  })

  it('ne présume pas de la cause d’une autre erreur', () => {
    expect(describeChargementError({ status: 404, body: null })).toContain('pas disponible')
    expect(describeChargementError({ status: 500, body: null })).toContain('pas pu être chargées')
    expect(describeChargementError({ status: null, body: null })).toContain('pas pu être chargées')
  })
})
