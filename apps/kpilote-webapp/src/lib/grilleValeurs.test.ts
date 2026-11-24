import { describe, expect, it } from 'vitest'

import { formatDate, formatValeur, type LigneGrille, movePosition } from '@/lib/grilleValeurs'

const buildLignes = (indexes: number[]): LigneGrille[] =>
  indexes.map((index, rang) => ({ index, numero: rang + 1, cellules: [] }))

const BAS = { ligne: 1, colonne: 0 }
const DROITE = { ligne: 0, colonne: 1 }

describe('formatDate', () => {
  it('affiche une date ISO au format jour/mois/année', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024')
  })
})

describe('formatValeur', () => {
  it('formate un nombre en fr-FR', () => {
    expect(formatValeur(1234.5)).toBe(new Intl.NumberFormat('fr-FR').format(1234.5))
  })
})

describe('movePosition', () => {
  it('reste sur la dernière ligne quand on descend depuis la dernière ligne', () => {
    const lignes = buildLignes([0, 1, 2])

    expect(
      movePosition({ position: { ligne: 2, colonne: 0 }, delta: BAS, lignes, nombreColonnes: 3 }),
    ).toEqual({ ligne: 2, colonne: 0 })
  })

  it('reste sur la dernière colonne quand on va à droite depuis la dernière colonne', () => {
    const lignes = buildLignes([0, 1])

    expect(
      movePosition({
        position: { ligne: 0, colonne: 2 },
        delta: DROITE,
        lignes,
        nombreColonnes: 3,
      }),
    ).toEqual({ ligne: 0, colonne: 2 })
  })

  it('passe à la ligne suivante de la liste affichée', () => {
    const lignes = buildLignes([0, 3, 7])

    expect(
      movePosition({ position: { ligne: 3, colonne: 1 }, delta: BAS, lignes, nombreColonnes: 3 }),
    ).toEqual({ ligne: 7, colonne: 1 })
  })

  it('sélectionne la première ligne affichée depuis une sélection hors des lignes', () => {
    const lignes = buildLignes([4, 9])

    expect(
      movePosition({ position: { ligne: -1, colonne: 0 }, delta: BAS, lignes, nombreColonnes: 3 }),
    ).toEqual({ ligne: 4, colonne: 0 })
  })

  it('renvoie la position inchangée quand il n’y a aucune ligne', () => {
    const position = { ligne: -1, colonne: 0 }

    expect(movePosition({ position, delta: BAS, lignes: [], nombreColonnes: 3 })).toEqual(position)
  })
})
