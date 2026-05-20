import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const getReferentielLinks = async (publicId: string) => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: {
      referentiels: {
        select: {
          fonctionAgregation: true,
          referentiel: { select: { publicId: true } },
        },
      },
    },
  })
  return indicateur.referentiels
    .map((link) => ({
      referentielId: link.referentiel.publicId,
      fonctionAgregation: link.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielId.localeCompare(b.referentielId))
}

describe.concurrent('upsertIndicateur', () => {
  it(
    'crée un indicateur avec ses référentiels liés et auto-grant READ+WRITE au créateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const refA = await fixtures.referentiel({ publicId: 'REF-CREATE-A' })
      const refB = await fixtures.referentiel({ publicId: 'REF-CREATE-B' })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'Nouvel indicateur',
            referentiels: [
              { referentielId: refA.publicId, fonctionAgregation: 'SUM' },
              { referentielId: refB.publicId, fonctionAgregation: 'NONE' },
            ],
          },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielLinks(indId)).toEqual([
        { referentielId: 'REF-CREATE-A', fonctionAgregation: 'SUM' },
        { referentielId: 'REF-CREATE-B', fonctionAgregation: 'NONE' },
      ])
      const grants = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateur: { publicId: indId } },
        orderBy: { action: 'asc' },
      })
      expect(grants.map((g) => g.action)).toEqual(['READ', 'WRITE'])
    }),
  )

  it(
    "remplace l'ensemble des liens à chaque PUT (ajout + suppression)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel(
        { publicId: 'REF-REPLACE-A' },
        { publicId: 'REF-REPLACE-B' },
        { publicId: 'REF-REPLACE-C' },
      )
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [
              { referentielId: 'REF-REPLACE-A', fonctionAgregation: 'SUM' },
              { referentielId: 'REF-REPLACE-B', fonctionAgregation: 'SUM' },
            ],
          },
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [
              { referentielId: 'REF-REPLACE-B', fonctionAgregation: 'SUM' },
              { referentielId: 'REF-REPLACE-C', fonctionAgregation: 'SUM' },
            ],
          },
        }),
      )

      expect(await getReferentielLinks(indId)).toEqual([
        { referentielId: 'REF-REPLACE-B', fonctionAgregation: 'SUM' },
        { referentielId: 'REF-REPLACE-C', fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'accepte un tableau vide (supprime tous les liens)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-EMPTY-A' })
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [{ referentielId: 'REF-EMPTY-A', fonctionAgregation: 'SUM' }],
          },
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({ publicId: indId, body: { nom: 'I', referentiels: [] } }),
      )

      expect(await getReferentielLinks(indId)).toEqual([])
    }),
  )

  it(
    'dédoublonne silencieusement les referentielIds en double',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-DEDUP-A' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [
              { referentielId: 'REF-DEDUP-A', fonctionAgregation: 'SUM' },
              { referentielId: 'REF-DEDUP-A', fonctionAgregation: 'SUM' },
            ],
          },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielLinks(indId)).toEqual([
        { referentielId: 'REF-DEDUP-A', fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'rejette quand un referentielId est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-UNKNOWN-A' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur({
            publicId: indId,
            body: {
              nom: 'I',
              referentiels: [
                { referentielId: 'REF-UNKNOWN-A', fonctionAgregation: 'SUM' },
                { referentielId: 'REF-UNKNOWN-X', fonctionAgregation: 'SUM' },
                { referentielId: 'REF-UNKNOWN-Y', fonctionAgregation: 'SUM' },
              ],
            },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownReferentielIds: ['REF-UNKNOWN-X', 'REF-UNKNOWN-Y'] },
      })

      const created = await db().indicateur.findUnique({ where: { publicId: indId } })
      expect(created).toBeNull()
    }),
  )

  it(
    "rejette la mise à jour quand le principal n'a pas la permission WRITE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'Ancien' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur({ publicId: indId, body: { nom: 'X', referentiels: [] } }),
        ),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'met à jour la fonctionAgregation pour un lien existant',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-UPDATE-A' })
      const apiKey = await fixtures.apiKey()

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [{ referentielId: 'REF-UPDATE-A', fonctionAgregation: 'SUM' }],
          },
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [{ referentielId: 'REF-UPDATE-A', fonctionAgregation: 'NONE' }],
          },
        }),
      )

      expect(await getReferentielLinks(indId)).toEqual([
        { referentielId: 'REF-UPDATE-A', fonctionAgregation: 'NONE' },
      ])
    }),
  )

  it(
    "dédoublonne sur referentielId : en cas de fonctions différentes, la dernière l'emporte",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-DEDUP-FN' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: {
            nom: 'I',
            referentiels: [
              { referentielId: 'REF-DEDUP-FN', fonctionAgregation: 'SUM' },
              { referentielId: 'REF-DEDUP-FN', fonctionAgregation: 'NONE' },
            ],
          },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielLinks(indId)).toEqual([
        { referentielId: 'REF-DEDUP-FN', fonctionAgregation: 'NONE' },
      ])
    }),
  )
})
