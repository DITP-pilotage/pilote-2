import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import {
  type AxeCroise,
  buildCroisement,
  buildSampleCroise,
  celluleKey,
  MAX_COMBINAISONS,
  withColumnsAxe,
  withRowsAxe,
} from '@/lib/axesCroises'

const modalite = (id: string): ModaliteApiModel => ({
  id,
  nom: id,
  parent: null,
  niveau: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const operateur = buildArbre([modalite('ORANGE'), modalite('SFR')])
const fraude = buildArbre([modalite('TVA'), modalite('IR')])

// Cube creux : SFR × IR n'est jamais saisi.
const saisies = {
  [celluleKey(['ORANGE', 'TVA'])]: '10',
  [celluleKey(['ORANGE', 'IR'])]: '20',
  [celluleKey(['SFR', 'TVA'])]: '30',
}

const operateurAvg: AxeCroise = { id: 'OP', nom: 'Opérateur', arbre: operateur, fonction: 'AVG' }
const fraudeAvg: AxeCroise = { id: 'FR', nom: 'Fraude', arbre: fraude, fonction: 'AVG' }
const axeVide: AxeCroise = { id: 'VIDE', nom: 'Vide', arbre: buildArbre([]), fonction: 'SUM' }

describe('buildCroisement', () => {
  it('descend le dernier axe déclaré et combine donc le premier au plus près des saisies', () => {
    const resolve = buildCroisement({ axes: [operateurAvg, fraudeAvg], saisies })

    const tous = resolve([TOUS_ID, TOUS_ID])
    expect(tous.descendedAxe).toBe(1)
    // moyenne(TVA = moyenne(10, 30), IR = moyenne(20)) = moyenne(20, 20)
    expect(tous.value).toBe(20)
  })

  it('donne un autre « Tous » en moyenne quand on inverse l’ordre et qu’il manque une combinaison', () => {
    const resolve = buildCroisement({
      axes: [fraudeAvg, operateurAvg],
      saisies: Object.fromEntries(
        Object.entries(saisies).map(([key, value]) => [key.split('|').reverse().join('|'), value]),
      ),
    })

    // moyenne(ORANGE = moyenne(10, 20), SFR = moyenne(30)) = moyenne(15, 30)
    expect(resolve([TOUS_ID, TOUS_ID]).value).toBe(22.5)
  })

  it('sort une combinaison jamais saisie du calcul', () => {
    const resolve = buildCroisement({ axes: [operateurAvg, fraudeAvg], saisies })

    expect(resolve(['SFR', 'IR']).statut).toBe('absente')
    expect(resolve(['SFR', TOUS_ID])).toMatchObject({ value: 30, present: 1, expected: 1 })
  })

  it('ne rend pas saisissable le « Tous » d’un axe sans modalité', () => {
    const resolve = buildCroisement({
      axes: [operateurAvg, axeVide],
      saisies: { [celluleKey(['ORANGE', TOUS_ID])]: '10' },
    })

    expect(resolve(['ORANGE', TOUS_ID])).toMatchObject({ isSaisissable: false, value: null })
    expect(resolve(['ORANGE', 'X'])).toMatchObject({ isSaisissable: false })
  })
})

describe('buildSampleCroise', () => {
  it('ne remplit rien quand un axe n’a aucune feuille', () => {
    expect(buildSampleCroise({ axes: [operateurAvg, axeVide], full: true })).toEqual({})
  })

  it('tire au hasard un échantillon plafonné au-delà du maximum de combinaisons', () => {
    const grandesFeuilles = Array.from({ length: 200 }, (_, index) => modalite(`M${index}`))
    const grandAxe = (id: string): AxeCroise => ({
      id,
      nom: id,
      arbre: buildArbre(grandesFeuilles),
      fonction: 'SUM',
    })

    const sample = buildSampleCroise({ axes: [grandAxe('A'), grandAxe('B')], full: true })

    expect(Object.keys(sample).length).toBeGreaterThan(0)
    expect(Object.keys(sample).length).toBeLessThanOrEqual(MAX_COMBINAISONS)
  })
})

describe('disposition des axes', () => {
  it('échange lignes et colonnes quand on met en lignes l’axe des colonnes', () => {
    expect(withRowsAxe({ layout: { rows: 0, columns: 1 }, index: 1 })).toEqual({
      rows: 1,
      columns: 0,
    })
  })

  it('échange lignes et colonnes quand on met en colonnes l’axe des lignes', () => {
    expect(withColumnsAxe({ layout: { rows: 0, columns: 1 }, index: 0 })).toEqual({
      rows: 1,
      columns: 0,
    })
  })

  it('ne croise jamais un axe avec lui-même quand les colonnes étaient vides', () => {
    expect(withColumnsAxe({ layout: { rows: 0, columns: null }, index: 0 })).toEqual({
      rows: 1,
      columns: 0,
    })
    expect(withColumnsAxe({ layout: { rows: 1, columns: null }, index: 1 })).toEqual({
      rows: 0,
      columns: 1,
    })
  })
})
