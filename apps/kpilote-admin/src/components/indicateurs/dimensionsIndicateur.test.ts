import type { IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { resoudreDimensionsIndicateur, validerDimensionsIndicateur } from './dimensionsIndicateur'
import { buildInitialValues, toUpsertBody } from './indicateurFormSchema'

const dimensionParReferentiel = new Map([
  ['REF-NAT', 'DIM-TERRITOIRE'],
  ['REF-DEPT', 'DIM-TERRITOIRE'],
  ['REF-OPERATEUR', 'DIM-OPERATEUR'],
  ['REF-TYPE', 'DIM-TYPE'],
])

const territoire = {
  id: 'DIM-TERRITOIRE',
  ordre: 0,
  fonctionAgregation: 'SUM',
  porteObjectifs: true,
} as const

const indicateurMono: IndicateurApiModel = {
  id: 'IND-001',
  nom: 'Taux de couverture',
  visibilite: 'PUBLIC',
  unite: null,
  description: null,
  methodeCalcul: null,
  sourceDonnees: null,
  sourceUrl: null,
  periodeMiseAJour: null,
  jourMiseAJour: null,
  delaiMiseADisposition: null,
  referentiels: [
    { id: 'REF-DEPT', fonctionAgregation: 'SUM', nom: 'Départements' },
    { id: 'REF-NAT', fonctionAgregation: 'SUM', nom: 'National' },
  ],
  dimensions: [{ ...territoire, nom: 'Territoire', referentiels: ['REF-DEPT', 'REF-NAT'] }],
  responsables: [],
  dateDerniereValeur: null,
  dateProchaineValeur: null,
  dateMiseADisposition: null,
  createdAt: '2026-11-02T00:00:00.000Z',
  updatedAt: '2026-11-02T00:00:00.000Z',
}

describe('resoudreDimensionsIndicateur', () => {
  it('ne configure rien tant que les niveaux couvrent une seule dimension', () => {
    expect(
      resoudreDimensionsIndicateur({
        niveaux: [{ id: 'REF-NAT' }, { id: 'REF-DEPT' }],
        dimensionParReferentiel,
        configurations: [territoire],
        dimensionsConservees: [],
      }),
    ).toEqual([])
  })

  it('reprend la configuration existante et donne un défaut à la nouvelle dimension', () => {
    expect(
      resoudreDimensionsIndicateur({
        niveaux: [{ id: 'REF-DEPT' }, { id: 'REF-OPERATEUR' }],
        dimensionParReferentiel,
        configurations: [territoire],
        dimensionsConservees: [],
      }),
    ).toEqual([
      territoire,
      { id: 'DIM-OPERATEUR', ordre: 1, fonctionAgregation: 'SUM', porteObjectifs: false },
    ])
  })

  it('porte les objectifs sur la première dimension seulement, sans configuration préalable', () => {
    expect(
      resoudreDimensionsIndicateur({
        niveaux: [{ id: 'REF-TYPE' }, { id: 'REF-DEPT' }],
        dimensionParReferentiel,
        configurations: [],
        dimensionsConservees: [],
      }),
    ).toEqual([
      { id: 'DIM-TYPE', ordre: 0, fonctionAgregation: 'SUM', porteObjectifs: true },
      { id: 'DIM-TERRITOIRE', ordre: 1, fonctionAgregation: 'SUM', porteObjectifs: false },
    ])
  })

  it('trie par ordre et garde une dimension conservée sans niveau dans le formulaire', () => {
    const operateur = {
      id: 'DIM-OPERATEUR',
      ordre: 0,
      fonctionAgregation: 'NONE',
      porteObjectifs: false,
    } as const
    expect(
      resoudreDimensionsIndicateur({
        niveaux: [{ id: 'REF-DEPT' }],
        dimensionParReferentiel,
        configurations: [{ ...territoire, ordre: 1 }, operateur],
        dimensionsConservees: ['DIM-TERRITOIRE', 'DIM-OPERATEUR'],
      }),
    ).toEqual([operateur, { ...territoire, ordre: 1 }])
  })
})

describe('validerDimensionsIndicateur', () => {
  it('refuse deux dimensions de même ordre', () => {
    expect(
      validerDimensionsIndicateur([
        territoire,
        { id: 'DIM-OPERATEUR', ordre: 0, fonctionAgregation: 'SUM', porteObjectifs: false },
      ]),
    ).toBe('Chaque dimension doit avoir un ordre distinct.')
  })

  it('accepte des ordres distincts', () => {
    expect(
      validerDimensionsIndicateur([
        territoire,
        { id: 'DIM-OPERATEUR', ordre: 1, fonctionAgregation: 'SUM', porteObjectifs: false },
      ]),
    ).toBeNull()
  })
})

describe('toUpsertBody', () => {
  it('garde le body historique d’un indicateur mono-dimension (pas de `dimensions`)', () => {
    const body = toUpsertBody({ ...buildInitialValues(indicateurMono), dimensions: [] })
    expect(body).toEqual({
      nom: 'Taux de couverture',
      visibilite: 'PUBLIC',
      unite: null,
      description: null,
      methodeCalcul: null,
      sourceDonnees: null,
      sourceUrl: null,
      periodeMiseAJour: null,
      jourMiseAJour: null,
      delaiMiseADisposition: null,
      referentiels: indicateurMono.referentiels,
      responsables: [],
    })
    expect(body).not.toHaveProperty('dimensions')
  })

  it('n’envoie pas la configuration implicite d’un mono, même non résolue', () => {
    expect(toUpsertBody(buildInitialValues(indicateurMono))).not.toHaveProperty('dimensions')
  })

  it('envoie `dimensions` pour un indicateur multi-dimension', () => {
    const dimensions = [
      territoire,
      { id: 'DIM-OPERATEUR', ordre: 1, fonctionAgregation: 'SUM', porteObjectifs: false } as const,
    ]
    expect(toUpsertBody({ ...buildInitialValues(indicateurMono), dimensions }).dimensions).toEqual(
      dimensions,
    )
  })
})
