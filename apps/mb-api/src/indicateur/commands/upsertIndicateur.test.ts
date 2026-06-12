import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const getConfigurationsReferentiels = async (publicId: string) => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: { referentiels: { include: { referentiel: true } } },
  })
  return indicateur.referentiels
    .map((configuration) => ({
      referentielPublicId: configuration.referentiel.publicId,
      fonctionAgregation: configuration.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielPublicId.localeCompare(b.referentielPublicId))
}

describe.concurrent('upsertIndicateur', () => {
  it(
    'crée un indicateur avec ses référentiels configurés et auto-grant READ+WRITE au créateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refCreateA = testReferentielId()
      const refCreateB = testReferentielId()
      const apiKey = await fixtures.apiKey()
      const refA = await fixtures.referentiel({ publicId: refCreateA })
      const refB = await fixtures.referentiel({ publicId: refCreateB })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'Nouvel indicateur',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: refA.publicId, fonctionAgregation: 'SUM' },
            { referentielPublicId: refB.publicId, fonctionAgregation: 'NONE' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      const configurationsTriees = [
        { referentielPublicId: refCreateA, fonctionAgregation: 'SUM' as const },
        { referentielPublicId: refCreateB, fonctionAgregation: 'NONE' as const },
      ].sort((a, b) => a.referentielPublicId.localeCompare(b.referentielPublicId))
      expect(await getConfigurationsReferentiels(indId)).toEqual(configurationsTriees)
      const grants = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateur: { publicId: indId } },
        orderBy: { action: 'asc' },
      })
      expect(grants.map((g) => g.action)).toEqual(['READ', 'WRITE'])
    }),
  )

  it(
    'persiste la visibilité fournie à la création',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, { nom: 'I', visibilite: 'PUBLIC', unite: null, referentiels: [] }),
      )

      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(row.visibilite).toBe('PUBLIC')
    }),
  )

  it(
    "persiste l'unité fournie à la création et la met à jour via PUT",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: 'POURCENTAGE',
          referentiels: [],
        }),
      )
      const apresCreation = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresCreation.unite).toBe('POURCENTAGE')

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: 'ANNEES',
          referentiels: [],
        }),
      )
      const apresMaj = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresMaj.unite).toBe('ANNEES')

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [],
        }),
      )
      const apresRemise = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresRemise.unite).toBeNull()
    }),
  )

  it(
    "permet à un principal disposant de WRITE de modifier la visibilité d'un indicateur existant",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, { nom: 'I', visibilite: 'PUBLIC', unite: null, referentiels: [] }),
      )

      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(row.visibilite).toBe('PUBLIC')
    }),
  )

  it(
    "remplace l'ensemble des configurations à chaque PUT (ajout + suppression)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReplaceA = testReferentielId()
      const refReplaceB = testReferentielId()
      const refReplaceC = testReferentielId()
      await fixtures.referentiel(
        { publicId: refReplaceA },
        { publicId: refReplaceB },
        { publicId: refReplaceC },
      )
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: refReplaceA, fonctionAgregation: 'SUM' },
            { referentielPublicId: refReplaceB, fonctionAgregation: 'SUM' },
          ],
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: refReplaceB, fonctionAgregation: 'SUM' },
            { referentielPublicId: refReplaceC, fonctionAgregation: 'SUM' },
          ],
        }),
      )

      const configurationsTriees = [
        { referentielPublicId: refReplaceB, fonctionAgregation: 'SUM' as const },
        { referentielPublicId: refReplaceC, fonctionAgregation: 'SUM' as const },
      ].sort((a, b) => a.referentielPublicId.localeCompare(b.referentielPublicId))
      expect(await getConfigurationsReferentiels(indId)).toEqual(configurationsTriees)
    }),
  )

  it(
    'accepte un tableau vide (supprime toutes les configurations)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refEmptyA = testReferentielId()
      await fixtures.referentiel({ publicId: refEmptyA })
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [{ referentielPublicId: refEmptyA, fonctionAgregation: 'SUM' }],
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, { nom: 'I', visibilite: 'PRIVE', unite: null, referentiels: [] }),
      )

      expect(await getConfigurationsReferentiels(indId)).toEqual([])
    }),
  )

  it(
    'dédoublonne silencieusement les referentielPublicId en double',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refDedupA = testReferentielId()
      await fixtures.referentiel({ publicId: refDedupA })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: refDedupA, fonctionAgregation: 'SUM' },
            { referentielPublicId: refDedupA, fonctionAgregation: 'SUM' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: refDedupA, fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'rejette quand un referentielPublicId est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refKnownA = testReferentielId()
      const refUnknownX = testReferentielId()
      const refUnknownY = testReferentielId()
      await fixtures.referentiel({ publicId: refKnownA })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur(indId, {
            nom: 'I',
            visibilite: 'PRIVE',
            unite: null,
            referentiels: [
              { referentielPublicId: refKnownA, fonctionAgregation: 'SUM' },
              { referentielPublicId: refUnknownX, fonctionAgregation: 'SUM' },
              { referentielPublicId: refUnknownY, fonctionAgregation: 'SUM' },
            ],
          }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownReferentielIds: [refUnknownX, refUnknownY].sort() },
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
          upsertIndicateur(indId, { nom: 'X', visibilite: 'PRIVE', unite: null, referentiels: [] }),
        ),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'met à jour la fonctionAgregation pour une configuration existante',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refUpdateA = testReferentielId()
      await fixtures.referentiel({ publicId: refUpdateA })
      const apiKey = await fixtures.apiKey()

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [{ referentielPublicId: refUpdateA, fonctionAgregation: 'SUM' }],
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [{ referentielPublicId: refUpdateA, fonctionAgregation: 'NONE' }],
        }),
      )

      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: refUpdateA, fonctionAgregation: 'NONE' },
      ])
    }),
  )

  it(
    "dédoublonne sur referentielPublicId : en cas de fonctions différentes, la dernière l'emporte",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refDedupFn = testReferentielId()
      await fixtures.referentiel({ publicId: refDedupFn })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: refDedupFn, fonctionAgregation: 'SUM' },
            { referentielPublicId: refDedupFn, fonctionAgregation: 'NONE' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: refDedupFn, fonctionAgregation: 'NONE' },
      ])
    }),
  )
})
