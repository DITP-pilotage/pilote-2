import { describe, expect, it } from 'vitest'

import { loadTopologieCube } from '@/dimension/queries/loadContexteResolution'
import { loadIndicateurDimensions } from '@/dimension/queries/loadIndicateurDimensions'
import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { DIMENSION_TEST_PAR_DEFAUT, fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'

// Chargement de la topologie d'un indicateur multi-dimension (cf.
// dimensions-design.md §5.4, point 2 « Enfants déclarés les plus proches »).

type Cube = Awaited<ReturnType<typeof fixtures.cubeTerritoireOperateur>>

// Retire le niveau REG de l'indicateur : NAT et DEPT restent déclarés.
const sansNiveauRegional = async (cube: Cube) => {
  await db().indicateurReferentiel.deleteMany({
    where: { indicateur: { publicId: cube.indicateur }, referentiel: { publicId: cube.refReg } },
  })
}

const idsParPublicId = async (publicIds: string[]) =>
  new Map(
    (await db().individu.findMany({ where: { publicId: { in: publicIds } } })).map((i) => [
      i.publicId,
      i.id,
    ]),
  )

describe.concurrent('loadTopologieCube', () => {
  it(
    'trie les dimensions par ordre et porte les fonctions de marginale et de niveau',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({
        territoire: { ordre: 1 },
        operateur: { ordre: 0, fonctionAgregation: 'AVG' },
      })
      const indicateur = await db().indicateur.findUniqueOrThrow({
        where: { publicId: cube.indicateur },
      })

      const dimensions = await loadIndicateurDimensions(indicateur.id)

      expect(dimensions.map((d) => [d.publicId, d.ordre, d.fonctionAgregation])).toEqual([
        [cube.dimensionOperateur, 0, 'AVG'],
        [DIMENSION_TEST_PAR_DEFAUT, 1, 'SUM'],
      ])
    }),
  )

  it(
    'saute les niveaux non déclarés : sans REG, les DEPT sont les enfants directs de NAT',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await sansNiveauRegional(cube)
      const indicateur = await db().indicateur.findUniqueOrThrow({
        where: { publicId: cube.indicateur },
      })
      const ids = await idsParPublicId([
        cube.nat,
        cube.reg1,
        cube.deptA,
        cube.deptB,
        cube.deptC,
        cube.orange,
        cube.sfr,
        cube.free,
      ])

      const topologie = await loadTopologieCube(await loadIndicateurDimensions(indicateur.id))

      expect(topologie.membres.has(ids.get(cube.reg1)!)).toBe(false)
      expect([...(topologie.enfantsParMembre.get(ids.get(cube.nat)!) ?? [])].sort()).toEqual(
        [ids.get(cube.deptA)!, ids.get(cube.deptB)!, ids.get(cube.deptC)!].sort(),
      )
      expect(topologie.parentsParMembre.get(ids.get(cube.deptC)!)).toEqual([ids.get(cube.nat)!])
      expect(topologie.racinesParDimension.get(topologie.dimensions[0]!.dimensionId)).toEqual([
        ids.get(cube.nat)!,
      ])
      expect(
        [...(topologie.racinesParDimension.get(topologie.dimensions[1]!.dimensionId) ?? [])].sort(),
      ).toEqual([ids.get(cube.orange)!, ids.get(cube.sfr)!, ids.get(cube.free)!].sort())
    }),
  )

  it(
    'de bout en bout : NAT agrège directement les départements quand REG n’est pas déclaré',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await sansNiveauRegional(cube)
      for (const [dept, valeur] of [
        [cube.deptA, 1],
        [cube.deptB, 2],
        [cube.deptC, 4],
      ] as const) {
        await fixtures.valeurAvancement({
          indicateur: { publicId: cube.indicateur },
          individus: [{ publicId: dept }, { publicId: cube.orange }],
          valeur,
        })
      }
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(cube.indicateur, { individus: [cube.nat] }),
      )

      const [point] = result._unsafeUnwrap().items
      expect(point).toMatchObject({
        individu: cube.nat,
        valeur: 7,
        type: 'derivee',
        couverture: { nbEnfantsAvecValeur: 3, nbEnfantsTotal: 3 },
      })
      if (point?.type !== 'derivee') throw new Error('Point dérivé attendu')
      expect(point.contributions.map((c) => c.individu).sort()).toEqual(
        [cube.deptA, cube.deptB, cube.deptC].sort(),
      )
    }),
  )
})
