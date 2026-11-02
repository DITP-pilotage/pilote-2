import { describe, expect, it } from 'vitest'

import { referentielsCollection, referentielsTableauDeBord } from './tableauDeBord'

const dim = (id: string) => ({
  id,
  nom: id,
  ordre: 0,
  fonctionAgregation: 'SUM' as const,
  porteObjectifs: true,
  referentiels: [],
})
const mono = (dimension: string) => ({ dimensions: [dim(dimension)] })
const multi = (...dimensions: string[]) => ({ dimensions: dimensions.map(dim) })

const referentiels = [
  { id: 'REF-DEPT', dimension: 'DIM-TERRITOIRE' },
  { id: 'REF-NAT', dimension: 'DIM-TERRITOIRE' },
  { id: 'REF-OPERATEUR', dimension: 'DIM-OPERATEUR' },
  { id: 'REF-ACADEMIE', dimension: 'DIM-ACADEMIE' },
]
const ids = (refs: ReadonlyArray<{ id: string }>) => refs.map((r) => r.id)

describe('referentielsTableauDeBord', () => {
  it('sans indicateur multi-dimension : tous les référentiels (règle historique)', () => {
    expect(
      ids(
        referentielsTableauDeBord({
          referentiels,
          indicateurs: [mono('DIM-TERRITOIRE'), mono('DIM-ACADEMIE')],
        }),
      ),
    ).toEqual(['REF-DEPT', 'REF-NAT', 'REF-OPERATEUR', 'REF-ACADEMIE'])
  })

  it('écarte les dimensions qui n’existent que croisées', () => {
    expect(
      ids(
        referentielsTableauDeBord({
          referentiels,
          indicateurs: [
            mono('DIM-TERRITOIRE'),
            mono('DIM-ACADEMIE'),
            multi('DIM-TERRITOIRE', 'DIM-OPERATEUR'),
          ],
        }),
      ),
    ).toEqual(['REF-DEPT', 'REF-NAT', 'REF-ACADEMIE'])
  })

  it('100 % multi-dimension : garde la dimension la plus fréquente', () => {
    expect(
      ids(
        referentielsTableauDeBord({
          referentiels: referentiels.filter((r) => r.id !== 'REF-ACADEMIE'),
          indicateurs: [
            multi('DIM-TERRITOIRE', 'DIM-OPERATEUR'),
            multi('DIM-FRAUDE', 'DIM-TERRITOIRE'),
          ],
        }),
      ),
    ).toEqual(['REF-DEPT', 'REF-NAT'])
  })
})

describe('referentielsCollection', () => {
  const indicateurs = [mono('DIM-TERRITOIRE'), multi('DIM-TERRITOIRE', 'DIM-OPERATEUR')]

  it('ajoute les dimensions croisées des indicateurs de la collection', () => {
    expect(
      ids(
        referentielsCollection({
          referentiels,
          indicateurs,
          indicateursCollection: indicateurs,
        }),
      ),
    ).toEqual(['REF-DEPT', 'REF-NAT', 'REF-OPERATEUR', 'REF-ACADEMIE'])
  })

  it('collection 100 % mono : identique au tableau de bord', () => {
    expect(
      ids(
        referentielsCollection({
          referentiels,
          indicateurs,
          indicateursCollection: [mono('DIM-TERRITOIRE')],
        }),
      ),
    ).toEqual(ids(referentielsTableauDeBord({ referentiels, indicateurs })))
  })
})
