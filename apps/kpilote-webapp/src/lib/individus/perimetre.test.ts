import { describe, expect, it } from 'vitest'

import { buildNodesCube, DIMENSIONS_CUBE } from '@/tests/factories/dimensions'

import { estDansPerimetre } from './perimetre'

const FR = { dimension: 'DIM-TERRITOIRE', individu: 'FR', referentiel: 'REF-NAT' }
const DEPT_84 = { dimension: 'DIM-TERRITOIRE', individu: 'DEPT-84', referentiel: 'REF-DEPT' }
const ORANGE = { dimension: 'DIM-OPERATEUR', individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR' }

const nodes = buildNodesCube()
const verifier = (perimetre: string[], coordonnees: (typeof FR)[]) =>
  estDansPerimetre({ perimetre, coordonnees, nodes, dimensions: DIMENSIONS_CUBE })

describe('estDansPerimetre', () => {
  it('inclut les descendants d’un membre du périmètre', () => {
    expect(verifier(['FR'], [DEPT_84, ORANGE])).toBe(true)
    expect(verifier(['DEPT-84'], [DEPT_84])).toBe(true)
  })

  it('exclut un ancêtre ou un frère du membre autorisé', () => {
    expect(verifier(['DEPT-84'], [FR])).toBe(false)
    expect(verifier(['DEPT-13'], [DEPT_84, ORANGE])).toBe(false)
  })

  it('ET entre dimensions, OU dans une dimension', () => {
    expect(verifier(['DEPT-13', 'DEPT-84', 'OP-ORANGE'], [DEPT_84, ORANGE])).toBe(true)
    expect(verifier(['DEPT-84', 'OP-SFR'], [DEPT_84, ORANGE])).toBe(false)
  })

  it('une dimension contrainte laissée sur « Tous » est hors périmètre', () => {
    expect(verifier(['OP-ORANGE'], [DEPT_84])).toBe(false)
  })

  it('ne contraint pas une dimension absente du périmètre', () => {
    expect(verifier(['OP-ORANGE'], [DEPT_84, ORANGE])).toBe(true)
  })

  it('fail-closed : périmètre vide ou membres inconnus', () => {
    expect(verifier([], [DEPT_84])).toBe(false)
    expect(verifier(['REG-INCONNUE'], [DEPT_84])).toBe(false)
  })

  it('rattache un membre d’un niveau non déclaré via les parents de la coordonnée', () => {
    const sansNational = nodes.filter((node) => node.individu.id !== 'FR')
    expect(
      estDansPerimetre({
        perimetre: ['FR'],
        coordonnees: [DEPT_84],
        nodes: sansNational,
        dimensions: DIMENSIONS_CUBE,
      }),
    ).toBe(true)
  })
})
