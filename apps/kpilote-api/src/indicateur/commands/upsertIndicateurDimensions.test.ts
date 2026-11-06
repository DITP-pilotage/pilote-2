import { type UpsertIndicateurBody } from '@pilote/kpilote-shared/indicateur'
import { describe, expect, it } from 'vitest'

import { ConflictError, ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { DIMENSION_TEST_PAR_DEFAUT, fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndividuId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin } from '@/test/runAsPrincipal'

// PUT /indicateurs sur les dimensions (cf. dimensions-design.md §5.3) : passage
// en multi, remplacement par dimension, verrous structure / feuille-à-faits,
// principal restreint.

type Cube = Awaited<ReturnType<typeof fixtures.cubeTerritoireOperateur>>
type Niveau = UpsertIndicateurBody['referentiels'][number]

const body = (
  referentiels: Niveau[],
  dimensions?: UpsertIndicateurBody['dimensions'],
): UpsertIndicateurBody => ({
  nom: 'Indicateur croisé',
  visibilite: 'PRIVE',
  unite: null,
  referentiels,
  ...(dimensions && { dimensions }),
})

const territoire = (cube: Cube, fonction: Niveau['fonctionAgregation'] = 'SUM'): Niveau[] => [
  { id: cube.refNat, fonctionAgregation: fonction },
  { id: cube.refReg, fonctionAgregation: fonction },
  { id: cube.refDept, fonctionAgregation: fonction },
]

const proprietaire = (cube: Cube) =>
  fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })

const niveaux = async (publicId: string) =>
  (
    await db().indicateurReferentiel.findMany({
      where: { indicateur: { publicId } },
      include: { referentiel: true },
    })
  )
    .map((n) => ({ id: n.referentiel.publicId, fonctionAgregation: n.fonctionAgregation }))
    .sort((a, b) => a.id.localeCompare(b.id))

const configurations = async (publicId: string) =>
  (
    await db().indicateurDimension.findMany({
      where: { indicateur: { publicId } },
      include: { dimension: true },
    })
  )
    .map((c) => ({
      id: c.dimension.publicId,
      ordre: c.ordre,
      fonctionAgregation: c.fonctionAgregation,
      porteObjectifs: c.porteObjectifs,
    }))
    .sort((a, b) => a.ordre - b.ordre)

// Indicateur mono-dimension (niveaux territoriaux du cube seulement).
const indicateurMono = async (cube: Cube) => {
  await db().indicateurReferentiel.deleteMany({
    where: { indicateur: { publicId: cube.indicateur }, referentiel: { publicId: cube.refOp } },
  })
  await db().indicateurDimension.deleteMany({
    where: {
      indicateur: { publicId: cube.indicateur },
      dimension: { publicId: cube.dimensionOperateur },
    },
  })
}

describe.concurrent('upsertIndicateur — dimensions', () => {
  it(
    'passage en multi sans `dimensions` : 400, chaque dimension (historique comprise) doit être configurée',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await indicateurMono(cube)
      const apiKey = await proprietaire(cube)

      const appel = runAsAdmin(apiKey.id, () =>
        upsertIndicateur(
          cube.indicateur,
          body([...territoire(cube), { id: cube.refOp, fonctionAgregation: 'NONE' }]),
        ),
      )

      await expect(appel).rejects.toThrow(ValidationError)
      await expect(appel).rejects.toMatchObject({
        details: {
          dimensionsAConfigurer: [cube.dimensionOperateur, DIMENSION_TEST_PAR_DEFAUT].sort(),
        },
      })
    }),
  )

  it(
    'passage en multi avec `dimensions` : niveaux et configuration posés',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await indicateurMono(cube)
      const apiKey = await proprietaire(cube)

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(
          cube.indicateur,
          body(
            [...territoire(cube), { id: cube.refOp, fonctionAgregation: 'NONE' }],
            [
              {
                id: DIMENSION_TEST_PAR_DEFAUT,
                ordre: 1,
                fonctionAgregation: 'SUM',
                porteObjectifs: true,
              },
              {
                id: cube.dimensionOperateur,
                ordre: 0,
                fonctionAgregation: 'AVG',
                porteObjectifs: false,
              },
            ],
          ),
        ),
      )

      expect(await configurations(cube.indicateur)).toEqual([
        { id: cube.dimensionOperateur, ordre: 0, fonctionAgregation: 'AVG', porteObjectifs: false },
        {
          id: DIMENSION_TEST_PAR_DEFAUT,
          ordre: 1,
          fonctionAgregation: 'SUM',
          porteObjectifs: true,
        },
      ])
      expect(await niveaux(cube.indicateur)).toHaveLength(4)
    }),
  )

  it(
    "ajout d'une dimension sur un indicateur qui a des valeurs : 409",
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await indicateurMono(cube)
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individu: { publicId: cube.deptA },
      })
      const apiKey = await proprietaire(cube)

      await expect(
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(
            cube.indicateur,
            body(
              [...territoire(cube), { id: cube.refOp, fonctionAgregation: 'NONE' }],
              [
                {
                  id: DIMENSION_TEST_PAR_DEFAUT,
                  ordre: 0,
                  fonctionAgregation: 'SUM',
                  porteObjectifs: true,
                },
                {
                  id: cube.dimensionOperateur,
                  ordre: 1,
                  fonctionAgregation: 'SUM',
                  porteObjectifs: false,
                },
              ],
            ),
          ),
        ),
      ).rejects.toThrow(ConflictError)
    }),
  )

  it(
    'remplacement par dimension : un payload territoire seul ne retire pas la dimension Opérateur',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptA }, { publicId: cube.orange }],
      })
      const apiKey = await proprietaire(cube)

      // Format pilote-ppg : seuls les niveaux territoriaux, sans `dimensions`.
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(cube.indicateur, body([{ id: cube.refDept, fonctionAgregation: 'SUM' }])),
      )

      expect(await niveaux(cube.indicateur)).toEqual(
        [
          { id: cube.refDept, fonctionAgregation: 'SUM' },
          { id: cube.refOp, fonctionAgregation: 'NONE' },
        ].sort((a, b) => a.id.localeCompare(b.id)),
      )
      expect((await configurations(cube.indicateur)).map((c) => c.id)).toEqual([
        DIMENSION_TEST_PAR_DEFAUT,
        cube.dimensionOperateur,
      ])
    }),
  )

  it(
    'verrou feuille-à-faits : un niveau NONE qui porte des faits ne passe pas en SUM (409)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({ fonctionNiveaux: 'NONE' })
      // REG en NONE : (REG-1, ORANGE) est une feuille, on y a saisi.
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.reg1 }, { publicId: cube.orange }],
      })
      const apiKey = await proprietaire(cube)

      await expect(
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(
            cube.indicateur,
            body([
              { id: cube.refNat, fonctionAgregation: 'NONE' },
              { id: cube.refReg, fonctionAgregation: 'SUM' },
              { id: cube.refDept, fonctionAgregation: 'NONE' },
            ]),
          ),
        ),
      ).rejects.toThrow(ConflictError)
      // Le même passage sur un niveau sans fait reste permis.
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(
          cube.indicateur,
          body([
            { id: cube.refNat, fonctionAgregation: 'SUM' },
            { id: cube.refReg, fonctionAgregation: 'NONE' },
            { id: cube.refDept, fonctionAgregation: 'NONE' },
          ]),
        ),
      )
      expect(await niveaux(cube.indicateur)).toContainEqual({
        id: cube.refNat,
        fonctionAgregation: 'SUM',
      })
    }),
  )

  it(
    'verrou feuille-à-faits : une marginale NONE qui porte des faits ne passe pas en SUM (409)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({
        operateur: { fonctionAgregation: 'NONE' },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individu: { publicId: cube.deptA },
      })
      const apiKey = await proprietaire(cube)

      await expect(
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(
            cube.indicateur,
            body(territoire(cube), [
              {
                id: cube.dimensionOperateur,
                ordre: 1,
                fonctionAgregation: 'SUM',
                porteObjectifs: false,
              },
            ]),
          ),
        ),
      ).rejects.toThrow(ConflictError)
    }),
  )

  it(
    '`porteObjectifs` verrouillé dès qu’un objectif existe (409)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: cube.indicateur },
        individu: { publicId: cube.deptA },
      })
      const apiKey = await proprietaire(cube)

      await expect(
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(
            cube.indicateur,
            body(territoire(cube), [
              {
                id: cube.dimensionOperateur,
                ordre: 1,
                fonctionAgregation: 'SUM',
                porteObjectifs: true,
              },
            ]),
          ),
        ),
      ).rejects.toThrow(ConflictError)
    }),
  )

  it(
    'verrou feuille-à-faits : ajouter un niveau sous un membre agrégeable à faits (409)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptA }, { publicId: cube.orange }],
      })
      // Niveau commune (même dimension) : une commune sous DEPT-A, une sous DEPT-C.
      const refCommune = testReferentielId()
      for (const dept of [cube.deptA, cube.deptC]) {
        await fixtures.relation({
          parent: { publicId: dept },
          child: { publicId: testIndividuId(), referentiel: { publicId: refCommune } },
        })
      }
      const apiKey = await proprietaire(cube)

      const appel = runAsAdmin(apiKey.id, () =>
        upsertIndicateur(
          cube.indicateur,
          body([...territoire(cube), { id: refCommune, fonctionAgregation: 'SUM' }]),
        ),
      )

      await expect(appel).rejects.toThrow(ConflictError)
      await expect(appel).rejects.toThrow(/masquerait des faits/)
      expect(await niveaux(cube.indicateur)).not.toContainEqual(
        expect.objectContaining({ id: refCommune }),
      )
    }),
  )

  it(
    'ajout d’un niveau sous des membres sans fait, ou sous un niveau NONE : permis',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      // Faits sur DEPT-C uniquement ; le nouveau niveau ne descend que de DEPT-A.
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptC }, { publicId: cube.orange }],
      })
      const refCommune = testReferentielId()
      await fixtures.relation({
        parent: { publicId: cube.deptA },
        child: { publicId: testIndividuId(), referentiel: { publicId: refCommune } },
      })
      const apiKey = await proprietaire(cube)

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(
          cube.indicateur,
          body([...territoire(cube), { id: refCommune, fonctionAgregation: 'SUM' }]),
        ),
      )

      expect(await niveaux(cube.indicateur)).toContainEqual({
        id: refCommune,
        fonctionAgregation: 'SUM',
      })
    }),
  )

  it(
    'multi-dimension sans aucune dimension `porteObjectifs` : 400',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await proprietaire(cube)

      await expect(
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(
            cube.indicateur,
            body(territoire(cube), [
              {
                id: DIMENSION_TEST_PAR_DEFAUT,
                ordre: 0,
                fonctionAgregation: 'SUM',
                porteObjectifs: false,
              },
            ]),
          ),
        ),
      ).rejects.toThrow(ValidationError)
    }),
  )

  it(
    'sous-cube effectif des objectifs : comparé avant/après, pas le drapeau brut',
    integrationTest(async () => {
      // Aucun drapeau : le sous-cube se replie sur la première dimension (Territoire).
      const cube = await fixtures.cubeTerritoireOperateur({ territoire: { porteObjectifs: false } })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: cube.indicateur },
        individu: { publicId: cube.deptA },
      })
      const apiKey = await proprietaire(cube)
      const configurer = (
        territoireDimension: { ordre: number; porteObjectifs: boolean },
        operateur: { ordre: number; porteObjectifs: boolean },
      ) =>
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(
            cube.indicateur,
            body(territoire(cube), [
              { id: DIMENSION_TEST_PAR_DEFAUT, fonctionAgregation: 'SUM', ...territoireDimension },
              { id: cube.dimensionOperateur, fonctionAgregation: 'SUM', ...operateur },
            ]),
          ),
        )

      // Inverser les ordres sans drapeau ferait passer le grain sur Opérateur.
      await expect(
        configurer({ ordre: 1, porteObjectifs: false }, { ordre: 0, porteObjectifs: false }),
      ).rejects.toThrow(ValidationError)
      // Opérateur porte explicitement les objectifs : le sous-cube change.
      await expect(
        configurer({ ordre: 0, porteObjectifs: false }, { ordre: 1, porteObjectifs: true }),
      ).rejects.toThrow(ConflictError)
      // Expliciter le repli (Territoire) ne change pas le sous-cube effectif.
      await configurer({ ordre: 0, porteObjectifs: true }, { ordre: 1, porteObjectifs: false })
      expect(await configurations(cube.indicateur)).toContainEqual({
        id: DIMENSION_TEST_PAR_DEFAUT,
        ordre: 0,
        fonctionAgregation: 'SUM',
        porteObjectifs: true,
      })
    }),
  )

  it(
    'principal au périmètre restreint : 403, même sans ligne de périmètre',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const avecPerimetre = await fixtures.apiKey()
      const sansPerimetre = await fixtures.apiKey()
      await fixtures.indicateurPermissionPerimetre({
        principalId: avecPerimetre.id,
        indicateur: { publicId: cube.indicateur },
        membres: [{ publicId: cube.orange }],
      })
      await fixtures.indicateurPermissionPerimetre({
        principalId: sansPerimetre.id,
        indicateur: { publicId: cube.indicateur },
        membres: [],
      })

      for (const principal of [avecPerimetre, sansPerimetre]) {
        await expect(
          runAsAdmin(principal.id, () => upsertIndicateur(cube.indicateur, body(territoire(cube)))),
        ).rejects.toThrow(ForbiddenError)
      }
    }),
  )
})
