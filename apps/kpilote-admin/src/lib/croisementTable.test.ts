import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import { type AxeCroise } from '@/lib/axesCroises'
import {
  celluleIdsOf,
  emphasisOf,
  firstFeuilleOf,
  referenceOf,
  rowsOf,
  strongerEmphasis,
  toneOf,
  warningsOf,
} from '@/lib/croisementTable'

const modalite = ({
  id,
  parent = null,
}: {
  id: string
  parent?: string | null
}): ModaliteApiModel => ({
  id,
  nom: id,
  parent,
  niveau: parent ? 2 : 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const operateur: AxeCroise = {
  id: 'OP',
  nom: 'Opérateur',
  fonction: 'SUM',
  arbre: buildArbre([
    modalite({ id: 'MOBILE' }),
    modalite({ id: 'ORANGE', parent: 'MOBILE' }),
    modalite({ id: 'SFR', parent: 'MOBILE' }),
  ]),
}
const fraude: AxeCroise = {
  id: 'FR',
  nom: 'Fraude',
  fonction: 'SUM',
  arbre: buildArbre([modalite({ id: 'TVA' })]),
}
const vide: AxeCroise = { id: 'VIDE', nom: 'Vide', fonction: 'SUM', arbre: buildArbre([]) }

describe('rowsOf', () => {
  it('lit l’arbre en profondeur et saute la descendance des parentes repliées', () => {
    const ids = (collapsed: Set<string>) =>
      rowsOf({ arbre: operateur.arbre, collapsed }).map((node) => node.id)

    expect(ids(new Set())).toEqual([TOUS_ID, 'MOBILE', 'ORANGE', 'SFR'])
    expect(ids(new Set(['MOBILE']))).toEqual([TOUS_ID, 'MOBILE'])
  })
})

describe('firstFeuilleOf', () => {
  it('donne la première feuille dans l’ordre de lecture, rien pour un axe vide', () => {
    expect(firstFeuilleOf(operateur.arbre)).toBe('ORANGE')
    expect(firstFeuilleOf(vide.arbre)).toBeUndefined()
  })
})

describe('celluleIdsOf', () => {
  it('place la ligne, la colonne et les axes fixés à leur rang de déclaration', () => {
    const fixedIds = ['ORANGE', 'TVA', 'X']

    expect(
      celluleIdsOf({ layout: { rows: 2, columns: 0 }, fixedIds, row: 'R', column: 'C' }),
    ).toEqual(['C', 'TVA', 'R'])
  })

  it('met « Tous » sur l’axe des colonnes quand il n’y a pas de colonne', () => {
    expect(
      celluleIdsOf({
        layout: { rows: 0, columns: 1 },
        fixedIds: ['A', 'B'],
        row: 'R',
        column: undefined,
      }),
    ).toEqual(['R', TOUS_ID])
  })
})

describe('referenceOf', () => {
  it('nomme chaque axe sauf sur « Tous », qui porte déjà son nom', () => {
    expect(referenceOf({ axes: [operateur, fraude], ids: ['ORANGE', TOUS_ID] })).toBe(
      'Opérateur : ORANGE × Tous',
    )
  })
})

describe('warningsOf', () => {
  it('signale un axe sans modalité et un axe à une seule feuille', () => {
    const warnings = warningsOf([operateur, fraude, vide])

    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toContain('« Fraude » n’a qu’une modalité feuille')
    expect(warnings[1]).toContain('« Vide » n’a aucune modalité')
  })

  it('ne dit rien quand chaque axe a plusieurs feuilles', () => {
    expect(warningsOf([operateur])).toEqual([])
  })
})

describe('toneOf', () => {
  it('distingue la case active de ses sources', () => {
    const precedents = new Set(['b'])

    expect(toneOf({ key: 'a', activeKey: 'a', precedents })).toBe('active')
    expect(toneOf({ key: 'b', activeKey: 'a', precedents })).toBe('precedent')
    expect(toneOf({ key: 'c', activeKey: 'a', precedents })).toBeUndefined()
  })
})

describe('emphasisOf et strongerEmphasis', () => {
  it('teinte plus fort « Tous » que les parentes, et la case prend la plus forte', () => {
    expect(emphasisOf('feuille')).toBe(0)
    expect(emphasisOf('parente')).toBe(1)
    expect(emphasisOf('tous')).toBe(2)
    expect(strongerEmphasis({ first: 1, second: 2 })).toBe(2)
  })
})
