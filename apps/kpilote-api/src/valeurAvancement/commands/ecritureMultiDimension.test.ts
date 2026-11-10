import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { upsertObjectifIndicateurIndividu } from '@/objectifIndicateurIndividu/commands/upsertObjectifIndicateurIndividu'
import { DIMENSION_TEST_PAR_DEFAUT, fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testReferentielId, testRegId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { deleteValeurAvancement } from '@/valeurAvancement/commands/deleteValeurAvancement'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'
import { upsertValeursAvancementBatch } from '@/valeurAvancement/commands/upsertValeursAvancementBatch'

// Écritures sur un indicateur multi-dimension (cf. dimensions-design.md §5.2,
// §5.4 « Saisies », §5.5 et §5.10) : erreurs de cellule, unitaire et en lot, et
// cloisonnement par périmètre.

type Cube = Awaited<ReturnType<typeof fixtures.cubeTerritoireOperateur>>

const DATE = '2024-01-01'

const ecrivain = (cube: Cube) =>
  fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
      { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })

// Principal en lecture + WRITE_DATA restreint au périmètre donné.
const ecrivainRestreint = async (cube: Cube, membres: string[]) => {
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
    ],
  })
  await fixtures.indicateurPermissionPerimetre({
    principalId: apiKey.id,
    indicateur: { publicId: cube.indicateur },
    membres: membres.map((publicId) => ({ publicId })),
  })
  return apiKey
}

const saisir = (
  cube: Cube,
  principalId: string,
  cible: { individu: string } | { coordonnees: string[] },
  valeur = 1,
) =>
  runAsPrincipal(principalId, () =>
    upsertValeurAvancement({
      indicateurPublicId: cube.indicateur,
      body: { ...cible, date: DATE, valeur },
    }),
  )

const lot = (
  indicateurPublicId: string,
  principalId: string,
  items: Array<({ individu: string } | { coordonnees: string[] }) & { date?: string }>,
) =>
  runAsPrincipal(principalId, () =>
    upsertValeursAvancementBatch(indicateurPublicId, {
      items: items.map((item) => ({ date: DATE, valeur: 1, ...item })),
    }),
  )

const nbValeurs = async (indicateurPublicId: string) =>
  db().valeurAvancement.count({ where: { indicateur: { publicId: indicateurPublicId } } })

// Membre d'une troisième dimension, non déclarée sur le cube.
const membreHorsCube = async () => {
  const publicId = `TYPE-${testRegId().slice('REG-'.length)}`
  await fixtures.individu({
    publicId,
    referentiel: {
      publicId: `REF-${testRegId().slice('REG-'.length)}`,
      dimension: { publicId: `DIM-${testRegId().slice('REG-'.length)}` },
    },
  })
  return publicId
}

describe.concurrent('écriture multi-dimension — saisie unitaire', () => {
  it(
    'écrit une cellule complète ; les coordonnées sont acceptées dans n’importe quel ordre',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const premiere = await saisir(cube, apiKey.id, { coordonnees: [cube.orange, cube.deptA] }, 10)
      const seconde = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, cube.orange] }, 12)

      // Réponse en forme canonique (membres dans l'ordre des dimensions).
      expect(premiere._unsafeUnwrap()).toEqual({
        indicateur: cube.indicateur,
        individu: `${cube.deptA}~${cube.orange}`,
        date: DATE,
        valeur: 10,
        type: 'saisie',
      })
      expect(seconde._unsafeUnwrap().valeur).toBe(12)
      const valeurs = await db().valeurAvancement.findMany({
        where: { indicateur: { publicId: cube.indicateur } },
        include: { cellule: { include: { coordonnees: true } } },
      })
      expect(valeurs).toHaveLength(1)
      expect(valeurs[0]!.valeur.toNumber()).toBe(12)
      expect(valeurs[0]!.cellule.coordonnees).toHaveLength(2)
    }),
  )

  it(
    'COORDONNEE_MANQUANTE : la marginale SUM « DEPT, tous opérateurs » est dérivée',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const result = await saisir(cube, apiKey.id, { individu: cube.deptA })

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'COORDONNEE_MANQUANTE',
        dimension: cube.dimensionOperateur,
      })
      expect(await nbValeurs(cube.indicateur)).toBe(0)
    }),
  )

  it(
    'INDIVIDU_INCONNU : membre inexistant',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const result = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, 'OP-INCONNU'] })

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'INDIVIDU_INCONNU',
        individu: 'OP-INCONNU',
      })
    }),
  )

  it(
    'DIMENSION_NON_DECLAREE : membre existant d’une dimension absente de l’indicateur',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const horsCube = await membreHorsCube()
      const apiKey = await ecrivain(cube)

      const result = await saisir(cube, apiKey.id, {
        coordonnees: [cube.deptA, cube.orange, horsCube],
      })

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'DIMENSION_NON_DECLAREE',
        individu: horsCube,
      })
    }),
  )

  it(
    'COORDONNEES_EN_DOUBLE : deux membres de la même dimension',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const result = await saisir(cube, apiKey.id, {
        coordonnees: [cube.deptA, cube.deptB, cube.orange],
      })

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'COORDONNEES_EN_DOUBLE',
        dimension: DIMENSION_TEST_PAR_DEFAUT,
      })
    }),
  )

  it(
    'CELLULE_AGREGEE : un membre à enfants dans un niveau agrégé ne se saisit pas',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const result = await saisir(cube, apiKey.id, { coordonnees: [cube.reg1, cube.orange] })

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'CELLULE_AGREGEE', individu: cube.reg1 })
    }),
  )

  it(
    'marginale NONE : « DEPT » seul est une feuille inscriptible (forme historique ou coordonnees)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({
        operateur: { fonctionAgregation: 'NONE' },
      })
      const apiKey = await ecrivain(cube)

      const historique = await saisir(cube, apiKey.id, { individu: cube.deptA }, 7)
      const coordonnees = await saisir(cube, apiKey.id, { coordonnees: [cube.deptB] }, 8)

      expect(historique._unsafeUnwrap()).toMatchObject({ individu: cube.deptA, valeur: 7 })
      expect(coordonnees._unsafeUnwrap()).toMatchObject({ individu: cube.deptB, valeur: 8 })
      expect(await nbValeurs(cube.indicateur)).toBe(2)
    }),
  )
})

describe.concurrent('écriture multi-dimension — lot', () => {
  it(
    'compte les créations puis les mises à jour sur des cellules multi-coordonnées',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const premier = await lot(cube.indicateur, apiKey.id, [
        { coordonnees: [cube.deptA, cube.orange] },
        { coordonnees: [cube.deptA, cube.sfr] },
      ])
      const second = await lot(cube.indicateur, apiKey.id, [
        { coordonnees: [cube.sfr, cube.deptA] },
        { coordonnees: [cube.deptB, cube.orange] },
      ])

      expect(premier._unsafeUnwrap()).toEqual({ total: 2, created: 2, updated: 0 })
      expect(second._unsafeUnwrap()).toEqual({ total: 2, created: 1, updated: 1 })
    }),
  )

  it(
    'rassemble les erreurs de cellule par item sans rien écrire',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const horsCube = await membreHorsCube()
      const apiKey = await ecrivain(cube)

      const result = await lot(cube.indicateur, apiKey.id, [
        { coordonnees: [cube.deptA, cube.orange] },
        { individu: cube.deptA },
        { coordonnees: [cube.reg1, cube.orange] },
        { coordonnees: [cube.deptA, 'OP-INCONNU'] },
        { coordonnees: [cube.deptA, horsCube] },
        { coordonnees: [cube.deptA, cube.deptB] },
        { individu: cube.deptB },
      ])

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          { code: 'COORDONNEE_MANQUANTE', indices: [1, 6], dimension: cube.dimensionOperateur },
          { code: 'CELLULE_AGREGEE', indices: [2], individu: cube.reg1 },
          { code: 'INDIVIDU_INCONNU', indices: [3], individu: 'OP-INCONNU' },
          { code: 'DIMENSION_NON_DECLAREE', indices: [4], individu: horsCube },
          { code: 'COORDONNEES_EN_DOUBLE', indices: [5], dimension: DIMENSION_TEST_PAR_DEFAUT },
        ],
      })
      expect(await nbValeurs(cube.indicateur)).toBe(0)
    }),
  )

  it(
    'DUPLICATE_KEY sur la clé canonique : coordonnées en ordre inversé',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const result = await lot(cube.indicateur, apiKey.id, [
        { coordonnees: [cube.deptA, cube.orange] },
        { coordonnees: [cube.deptB, cube.orange] },
        { coordonnees: [cube.orange, cube.deptA] },
        { coordonnees: [cube.orange, cube.deptA], date: '2024-02-01' },
      ])

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          {
            code: 'DUPLICATE_KEY',
            indices: [0, 2],
            individu: `${cube.deptA}~${cube.orange}`,
            date: DATE,
          },
        ],
      })
    }),
  )

  it(
    'DUPLICATE_KEY sur la clé canonique : mélange des formes `individu` et `coordonnees`',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({
        operateur: { fonctionAgregation: 'NONE' },
      })
      const apiKey = await ecrivain(cube)

      const result = await lot(cube.indicateur, apiKey.id, [
        { individu: cube.deptA },
        { coordonnees: [cube.deptA] },
      ])

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [{ code: 'DUPLICATE_KEY', indices: [0, 1], individu: cube.deptA, date: DATE }],
      })
    }),
  )

  it(
    'DUPLICATE_KEY sur un indicateur mono-dimension qui mélange les deux formes',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const dept = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({ publicId: dept, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const result = await lot(indId, apiKey.id, [{ coordonnees: [dept] }, { individu: dept }])

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [{ code: 'DUPLICATE_KEY', indices: [0, 1], individu: dept, date: DATE }],
      })
    }),
  )
})

describe.concurrent('écriture multi-dimension — cloisonnement (périmètre)', () => {
  it(
    'restreint à OP-ORANGE : écrit (DEPT, ORANGE), refuse (DEPT, SFR) en écriture et en suppression',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptA }, { publicId: cube.sfr }],
        date: DATE,
      })
      const apiKey = await ecrivainRestreint(cube, [cube.orange])

      const autorise = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, cube.orange] })
      const refuse = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, cube.sfr] })
      const suppression = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: cube.indicateur,
          body: { coordonnees: [cube.deptA, cube.sfr], date: DATE },
        }),
      )

      expect(autorise.isOk()).toBe(true)
      expect(refuse._unsafeUnwrapErr()).toEqual({
        type: 'HORS_PERIMETRE',
        individu: `${cube.deptA}~${cube.sfr}`,
      })
      expect(suppression._unsafeUnwrapErr()).toEqual({
        type: 'HORS_PERIMETRE',
        individu: `${cube.deptA}~${cube.sfr}`,
      })
      expect(await nbValeurs(cube.indicateur)).toBe(2)
    }),
  )

  it(
    'descendants inclus et ET entre dimensions : périmètre { REG-1, ORANGE }',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivainRestreint(cube, [cube.reg1, cube.orange])

      const deptAOrange = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, cube.orange] })
      const deptASfr = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, cube.sfr] })
      const deptCOrange = await saisir(cube, apiKey.id, { coordonnees: [cube.deptC, cube.orange] })

      expect(deptAOrange.isOk()).toBe(true)
      expect(deptASfr._unsafeUnwrapErr().type).toBe('HORS_PERIMETRE')
      expect(deptCOrange._unsafeUnwrapErr().type).toBe('HORS_PERIMETRE')
    }),
  )

  it(
    'lot : HORS_PERIMETRE par item, rien n’est écrit',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivainRestreint(cube, [cube.orange])

      const result = await lot(cube.indicateur, apiKey.id, [
        { coordonnees: [cube.deptA, cube.orange] },
        { coordonnees: [cube.deptA, cube.sfr] },
        { coordonnees: [cube.deptB, cube.sfr] },
      ])

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          { code: 'HORS_PERIMETRE', indices: [1], individu: `${cube.deptA}~${cube.sfr}` },
          { code: 'HORS_PERIMETRE', indices: [2], individu: `${cube.deptB}~${cube.sfr}` },
        ],
      })
      expect(await nbValeurs(cube.indicateur)).toBe(0)
    }),
  )

  it(
    'restreint sans périmètre : aucune écriture possible (fail-closed)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivainRestreint(cube, [])

      const result = await saisir(cube, apiKey.id, { coordonnees: [cube.deptA, cube.orange] })

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'HORS_PERIMETRE',
        individu: `${cube.deptA}~${cube.orange}`,
      })
    }),
  )

  it(
    'objectifs : le contrôle de périmètre s’applique au sous-cube des objectifs',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const restreintOperateur = await ecrivainRestreint(cube, [cube.orange])
      const restreintTerritoire = await ecrivainRestreint(cube, [cube.reg1])
      const objectif = (principalId: string) =>
        runAsPrincipal(principalId, () =>
          upsertObjectifIndicateurIndividu({
            indicateurPublicId: cube.indicateur,
            body: { individu: cube.deptA, dateCible: '2024-12-01', valeurCible: 60 },
          }),
        )

      // Objectifs par territoire seul : un périmètre Opérateur ne couvre aucune
      // cellule d'objectif.
      expect((await objectif(restreintOperateur.id))._unsafeUnwrapErr()).toEqual({
        type: 'HORS_PERIMETRE',
        individu: cube.deptA,
      })
      expect((await objectif(restreintTerritoire.id))._unsafeUnwrap()).toMatchObject({
        individu: cube.deptA,
        valeurCible: 60,
      })
    }),
  )

  it(
    'objectifs : une coordonnée hors du sous-cube des objectifs est refusée',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await ecrivain(cube)

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertObjectifIndicateurIndividu({
          indicateurPublicId: cube.indicateur,
          body: { coordonnees: [cube.deptA, cube.orange], dateCible: '2024-12-01', valeurCible: 1 },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'DIMENSION_NON_DECLAREE',
        individu: cube.orange,
      })
    }),
  )
})
