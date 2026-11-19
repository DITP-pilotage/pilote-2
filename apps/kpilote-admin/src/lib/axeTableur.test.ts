import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import { type Cellule } from '@/lib/axeSerie'
import {
  buildToneOf,
  explainChildren,
  lastSaisieBefore,
  placeholderOf,
  tableurRowsOf,
} from '@/lib/axeTableur'

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
  modalite({ id: 'OP' }),
  modalite({ id: 'OP-ORANGE', parent: 'OP', niveau: 2 }),
  modalite({ id: 'OP-SFR', parent: 'OP', niveau: 2 }),
  modalite({ id: 'AUTRE' }),
])

const cellule = (overrides: Partial<Cellule>): Cellule => ({
  value: null,
  statut: 'absente',
  present: 0,
  expected: 0,
  ...overrides,
})

describe('tableurRowsOf', () => {
  it('cache les enfants d’une parente repliée', () => {
    const rows = tableurRowsOf({ arbre, collapsed: new Set(['OP']), visible: null })
    expect(rows.map((node) => node.id)).toEqual([TOUS_ID, 'OP', 'AUTRE'])
  })

  it('déplie tout pendant une recherche et ne garde que les modalités trouvées', () => {
    const rows = tableurRowsOf({
      arbre,
      collapsed: new Set(['OP']),
      visible: new Set([TOUS_ID, 'OP', 'OP-SFR']),
    })
    expect(rows.map((node) => node.id)).toEqual([TOUS_ID, 'OP', 'OP-SFR'])
  })
})

describe('buildToneOf', () => {
  it('allume les enfants et les ancêtres de la cellule active, sur sa seule période', () => {
    const toneOf = buildToneOf({ arbre, active: { id: 'OP', index: 2 } })
    expect(toneOf({ id: 'OP', index: 2 })).toBe('active')
    expect(toneOf({ id: 'OP-SFR', index: 2 })).toBe('precedent')
    expect(toneOf({ id: TOUS_ID, index: 2 })).toBe('dependent')
    expect(toneOf({ id: 'AUTRE', index: 2 })).toBeUndefined()
    expect(toneOf({ id: 'OP-SFR', index: 1 })).toBeUndefined()
  })
})

describe('placeholderOf', () => {
  it('montre la valeur reportée, le manque et l’absence', () => {
    expect(placeholderOf(cellule({ statut: 'reportee', value: 42 }))).toBe('↳ 42')
    expect(placeholderOf(cellule({ statut: 'manquante' }))).toBe('?')
    expect(placeholderOf(cellule({ statut: 'absente' }))).toBe('·')
    expect(placeholderOf(cellule({ statut: 'saisie', value: 3 }))).toBe('')
  })
})

describe('lastSaisieBefore', () => {
  it('trouve la dernière période saisie avant la période donnée', () => {
    expect(lastSaisieBefore({ saisies: ['1', '', ' ', ''], index: 3 })).toBe(0)
    expect(lastSaisieBefore({ saisies: ['', ''], index: 1 })).toBeNull()
  })
})

describe('explainChildren', () => {
  const op = arbre.get('OP')

  it('sépare les enfants comptés, manquants et jamais saisis', () => {
    if (!op) throw new Error('OP manquant')
    const serie = new Map([
      ['OP-ORANGE', [cellule({ statut: 'reportee', value: 5 })]],
      ['OP-SFR', [cellule({ statut: 'manquante' })]],
    ])
    const explanation = explainChildren({ arbre, node: op, index: 0, serie })
    expect(explanation.terms).toEqual(['OP-ORANGE 5 (reportée)'])
    expect(explanation.missing.map((child) => child.node.id)).toEqual(['OP-SFR'])
    expect(explanation.isEmpty).toBe(false)
  })

  it('est vide quand aucun enfant n’a été saisi', () => {
    if (!op) throw new Error('OP manquant')
    const serie = new Map([
      ['OP-ORANGE', [cellule({})]],
      ['OP-SFR', [cellule({})]],
    ])
    const explanation = explainChildren({ arbre, node: op, index: 0, serie })
    expect(explanation.isEmpty).toBe(true)
    expect(explanation.ignored).toHaveLength(2)
  })
})
