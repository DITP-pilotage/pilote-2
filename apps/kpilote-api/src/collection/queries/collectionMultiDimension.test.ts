import { describe, expect, it } from 'vitest'

import { getCollectionTauxProgression } from '@/collection/queries/getCollectionTauxProgression'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionId, testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

// Collections et indicateurs multi-dimension (cf. dimensions-design.md §5.7) :
// projection de la cellule par indicateur, `nonApplicable` si la projection ne
// garde aucune coordonnée et que la collection contient un indicateur multi.

type Cube = Awaited<ReturnType<typeof fixtures.cubeTerritoireOperateur>>

// Cube : DEPT-A = 10 (ORANGE) + 20 (SFR), objectif 60 → taux 50 %.
const peuplerCube = async (cube: Cube) => {
  for (const [operateur, valeur] of [
    [cube.orange, 10],
    [cube.sfr, 20],
  ] as const) {
    await fixtures.valeurAvancement({
      indicateur: { publicId: cube.indicateur },
      individus: [{ publicId: cube.deptA }, { publicId: operateur }],
      date: '2024-01-01',
      valeur,
    })
  }
  await fixtures.objectifIndicateurIndividu({
    indicateur: { publicId: cube.indicateur },
    individu: { publicId: cube.deptA },
    dateCible: '2024-12-01',
    valeurCible: 60,
  })
}

// Indicateur mono-dimension porté par la seule dimension Opérateur.
const indicateurOperateur = async (cube: Cube) => {
  const publicId = testIndicateurId()
  await fixtures.indicateurReferentiel({
    indicateur: { publicId },
    referentiel: { publicId: cube.refOp, dimension: { publicId: cube.dimensionOperateur } },
  })
  return publicId
}

const parIndicateur = <T extends { indicateur: string }>(contributions: T[]) =>
  [...contributions].sort((a, b) => a.indicateur.localeCompare(b.indicateur))

describe.concurrent('getCollectionTauxProgression — multi-dimension', () => {
  it(
    'collection mixte : un indicateur sans dimension commune avec la cellule est non applicable',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await peuplerCube(cube)
      const indOperateur = await indicateurOperateur(cube)
      const collectionId = testCollectionId()
      await fixtures.collection({
        publicId: collectionId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: cube.indicateur }, { publicId: indOperateur }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getCollectionTauxProgression(collectionId, { individu: cube.deptA }),
      )

      const value = result._unsafeUnwrap()
      expect(value.tauxProgression).toBe(50)
      expect(parIndicateur(value.contributions)).toEqual(
        parIndicateur([
          { indicateur: cube.indicateur, tauxProgression: 50, date: '2024-01-01', ponderation: 1 },
          {
            indicateur: indOperateur,
            tauxProgression: null,
            date: null,
            ponderation: 1,
            nonApplicable: true,
          },
        ]),
      )
    }),
  )

  it(
    'collection mixte : la cellule est projetée sur les dimensions de chaque indicateur',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await peuplerCube(cube)
      const indTerritoire = testIndicateurId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indTerritoire },
        referentiel: { publicId: cube.refDept },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indTerritoire },
        individu: { publicId: cube.deptA },
        date: '2024-01-01',
        valeur: 3,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indTerritoire },
        individu: { publicId: cube.deptA },
        dateCible: '2024-12-01',
        valeurCible: 4,
      })
      const collectionId = testCollectionId()
      await fixtures.collection({
        publicId: collectionId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: cube.indicateur }, { publicId: indTerritoire }],
      })
      const apiKey = await fixtures.apiKey()

      // DEPT-A~ORANGE : le cube n'a pas d'objectif par opérateur (taux absent →
      // null bloquant) ; l'indicateur territorial est lu sur DEPT-A.
      const result = await runAsPrincipal(apiKey.id, () =>
        getCollectionTauxProgression(collectionId, { individu: `${cube.deptA}~${cube.orange}` }),
      )

      const value = result._unsafeUnwrap()
      expect(value.tauxProgression).toBeNull()
      expect(parIndicateur(value.contributions)).toEqual(
        parIndicateur([
          { indicateur: cube.indicateur, tauxProgression: null, date: null, ponderation: 1 },
          { indicateur: indTerritoire, tauxProgression: 75, date: '2024-01-01', ponderation: 1 },
        ]),
      )
    }),
  )

  it(
    'collection 100 % mono : règle historique, pas de `nonApplicable` (null bloquant)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const indTerritoire = testIndicateurId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indTerritoire },
        referentiel: { publicId: cube.refDept },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indTerritoire },
        individu: { publicId: cube.deptA },
        date: '2024-01-01',
        valeur: 3,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indTerritoire },
        individu: { publicId: cube.deptA },
        dateCible: '2024-12-01',
        valeurCible: 4,
      })
      const indOperateur = await indicateurOperateur(cube)
      const collectionId = testCollectionId()
      await fixtures.collection({
        publicId: collectionId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indTerritoire }, { publicId: indOperateur }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getCollectionTauxProgression(collectionId, { individu: cube.deptA }),
      )

      const value = result._unsafeUnwrap()
      expect(value.tauxProgression).toBeNull()
      expect(parIndicateur(value.contributions)).toEqual(
        parIndicateur([
          { indicateur: indTerritoire, tauxProgression: 75, date: '2024-01-01', ponderation: 1 },
          { indicateur: indOperateur, tauxProgression: null, date: null, ponderation: 1 },
        ]),
      )
    }),
  )
})
