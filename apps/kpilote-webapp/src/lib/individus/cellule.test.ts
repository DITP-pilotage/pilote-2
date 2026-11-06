import { describe, expect, it } from 'vitest'

import {
  buildNodesCube,
  DIM_OPERATEUR,
  DIM_TERRITOIRE,
  DIMENSIONS_CUBE,
} from '@/tests/factories/dimensions'

import {
  estMultiDimension,
  formatAutres,
  parseAutres,
  remplacerCoordonnee,
  resolveCelluleDepuisUrl,
} from './cellule'

const FR = { dimension: 'DIM-TERRITOIRE', individu: 'FR', referentiel: 'REF-NAT' }
const DEPT_84 = { dimension: 'DIM-TERRITOIRE', individu: 'DEPT-84', referentiel: 'REF-DEPT' }
const ORANGE = { dimension: 'DIM-OPERATEUR', individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR' }

describe('parseAutres / formatAutres', () => {
  it('sérialise en CSV, absent quand vide', () => {
    expect(formatAutres(['OP-ORANGE', 'TYPE-A'])).toBe('OP-ORANGE,TYPE-A')
    expect(formatAutres([])).toBeUndefined()
  })

  it('parse en ignorant les segments vides et les espaces', () => {
    expect(parseAutres(' OP-ORANGE, ,TYPE-A ')).toEqual(['OP-ORANGE', 'TYPE-A'])
    expect(parseAutres(undefined)).toEqual([])
    expect(parseAutres('')).toEqual([])
  })
})

describe('estMultiDimension', () => {
  it('vrai à partir de deux dimensions', () => {
    expect(estMultiDimension([DIM_TERRITOIRE])).toBe(false)
    expect(estMultiDimension(DIMENSIONS_CUBE)).toBe(true)
  })
})

describe('resolveCelluleDepuisUrl', () => {
  const nodes = buildNodesCube()

  it('accepte un lien profond historique : marginale « tous » sur les autres dimensions', () => {
    expect(
      resolveCelluleDepuisUrl({
        nodes,
        dimensions: DIMENSIONS_CUBE,
        search: { individu: 'DEPT-84', referentiel: 'REF-DEPT' },
      }),
    ).toEqual({ kind: 'valid', cellule: { id: 'DEPT-84', coordonnees: [DEPT_84] } })
  })

  it('résout une cellule complète dans l’ordre des dimensions', () => {
    expect(
      resolveCelluleDepuisUrl({
        nodes,
        dimensions: DIMENSIONS_CUBE,
        search: { individu: 'DEPT-84', referentiel: 'REF-DEPT', autres: 'OP-ORANGE' },
      }),
    ).toEqual({
      kind: 'valid',
      cellule: { id: 'DEPT-84~OP-ORANGE', coordonnees: [DEPT_84, ORANGE] },
    })
  })

  it('porte la coordonnée suivante dans `individu` quand la principale vaut « Tous »', () => {
    expect(
      resolveCelluleDepuisUrl({
        nodes,
        dimensions: DIMENSIONS_CUBE,
        search: { individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR' },
      }),
    ).toEqual({ kind: 'valid', cellule: { id: 'OP-ORANGE', coordonnees: [ORANGE] } })
  })

  it('redirige vers la forme canonique (ordre des dimensions)', () => {
    expect(
      resolveCelluleDepuisUrl({
        nodes,
        dimensions: DIMENSIONS_CUBE,
        search: { individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR', autres: 'DEPT-84' },
      }),
    ).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'DEPT-84', referentiel: 'REF-DEPT', autres: 'OP-ORANGE' },
    })
  })

  it('écarte les membres inconnus et les doublons de dimension', () => {
    expect(
      resolveCelluleDepuisUrl({
        nodes,
        dimensions: DIMENSIONS_CUBE,
        search: { individu: 'DEPT-84', referentiel: 'REF-DEPT', autres: 'DEPT-13,OP-INCONNU' },
      }),
    ).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'DEPT-84', referentiel: 'REF-DEPT', autres: undefined },
    })
  })

  it('corrige un référentiel incohérent avec l’individu', () => {
    expect(
      resolveCelluleDepuisUrl({
        nodes,
        dimensions: DIMENSIONS_CUBE,
        search: { individu: 'DEPT-84', referentiel: 'REF-NAT' },
      }),
    ).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'DEPT-84', referentiel: 'REF-DEPT', autres: undefined },
    })
  })

  it('par défaut, fixe les dimensions à racine unique (France, tous opérateurs)', () => {
    expect(resolveCelluleDepuisUrl({ nodes, dimensions: DIMENSIONS_CUBE, search: {} })).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'FR', referentiel: 'REF-NAT', autres: undefined },
    })
  })

  it('sans racine unique, prend la première racine de la dimension principale', () => {
    const sansNational = nodes.filter((node) => node.individu.id !== 'FR')
    expect(
      resolveCelluleDepuisUrl({
        nodes: sansNational,
        dimensions: [
          { ...DIM_OPERATEUR, ordre: 0 },
          { ...DIM_TERRITOIRE, ordre: 1 },
        ],
        search: {},
      }),
    ).toEqual({
      kind: 'mismatch',
      fallback: { individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR', autres: undefined },
    })
  })

  it('renvoie `no-hierarchy` sans individu', () => {
    expect(resolveCelluleDepuisUrl({ nodes: [], dimensions: DIMENSIONS_CUBE, search: {} })).toEqual(
      { kind: 'no-hierarchy' },
    )
  })
})

describe('remplacerCoordonnee', () => {
  it('remplace la coordonnée d’une dimension en gardant les autres', () => {
    expect(
      remplacerCoordonnee({
        coordonnees: [DEPT_84, ORANGE],
        dimensions: DIMENSIONS_CUBE,
        dimension: 'DIM-TERRITOIRE',
        coordonnee: FR,
      }),
    ).toEqual({ individu: 'FR', referentiel: 'REF-NAT', autres: 'OP-ORANGE' })
  })

  it('« Tous » sur la principale fait passer la suivante dans `individu`', () => {
    expect(
      remplacerCoordonnee({
        coordonnees: [DEPT_84, ORANGE],
        dimensions: DIMENSIONS_CUBE,
        dimension: 'DIM-TERRITOIRE',
        coordonnee: null,
      }),
    ).toEqual({ individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR', autres: undefined })
  })

  it('ajoute une coordonnée sur une dimension « Tous »', () => {
    expect(
      remplacerCoordonnee({
        coordonnees: [DEPT_84],
        dimensions: DIMENSIONS_CUBE,
        dimension: 'DIM-OPERATEUR',
        coordonnee: ORANGE,
      }),
    ).toEqual({ individu: 'DEPT-84', referentiel: 'REF-DEPT', autres: 'OP-ORANGE' })
  })

  it('refuse de vider la cellule', () => {
    expect(
      remplacerCoordonnee({
        coordonnees: [DEPT_84],
        dimensions: DIMENSIONS_CUBE,
        dimension: 'DIM-TERRITOIRE',
        coordonnee: null,
      }),
    ).toBeNull()
  })
})
