import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'

import { type DimensionCellule } from '@/lib/individus/cellule'
import { buildOrderedNodes, type IndividuNode } from '@/lib/individus/hierarchy'

// Cube de démonstration Territoire × Opérateur (cf. IND-101 du seed POC) pour
// les tests des helpers multi-dimension.

const referentiel = (id: string, nom: string, dimension: string): ReferentielApiModel => ({
  id,
  nom,
  description: null,
  dimension,
  nombreIndividus: 0,
  widgets: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const individu = (
  id: string,
  nom: string,
  referentielId: string,
  parents: string[] = [],
): IndividuApiModel => ({
  id,
  nom,
  referentiel: referentielId,
  parents,
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

export const DIM_TERRITOIRE: DimensionCellule = {
  id: 'DIM-TERRITOIRE',
  nom: 'Territoire',
  ordre: 0,
  fonctionAgregation: 'SUM',
  referentiels: ['REF-DEPT', 'REF-NAT'],
}

export const DIM_OPERATEUR: DimensionCellule = {
  id: 'DIM-OPERATEUR',
  nom: 'Opérateur',
  ordre: 1,
  fonctionAgregation: 'SUM',
  referentiels: ['REF-OPERATEUR'],
}

export const DIMENSIONS_CUBE: ReadonlyArray<DimensionCellule> = [DIM_TERRITOIRE, DIM_OPERATEUR]

export const buildNodesCube = (): IndividuNode[] => {
  const referentiels = [
    referentiel('REF-NAT', 'National', 'DIM-TERRITOIRE'),
    referentiel('REF-DEPT', 'Départements', 'DIM-TERRITOIRE'),
    referentiel('REF-OPERATEUR', 'Opérateurs', 'DIM-OPERATEUR'),
  ]
  return buildOrderedNodes(
    [
      individu('FR', 'France', 'REF-NAT'),
      individu('DEPT-13', 'Bouches-du-Rhône', 'REF-DEPT', ['FR']),
      individu('DEPT-84', 'Vaucluse', 'REF-DEPT', ['FR']),
      individu('OP-ORANGE', 'Orange', 'REF-OPERATEUR'),
      individu('OP-SFR', 'SFR', 'REF-OPERATEUR'),
    ],
    new Map(referentiels.map((r) => [r.id, r] as const)),
  )
}
