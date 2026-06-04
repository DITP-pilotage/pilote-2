import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
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
      const apiKey = await fixtures.apiKey()
      const refA = await fixtures.referentiel({ publicId: 'REF-CREATE-A' })
      const refB = await fixtures.referentiel({ publicId: 'REF-CREATE-B' })

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
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: 'REF-CREATE-A', fonctionAgregation: 'SUM' },
        { referentielPublicId: 'REF-CREATE-B', fonctionAgregation: 'NONE' },
      ])
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
      await fixtures.referentiel(
        { publicId: 'REF-REPLACE-A' },
        { publicId: 'REF-REPLACE-B' },
        { publicId: 'REF-REPLACE-C' },
      )
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: 'REF-REPLACE-A', fonctionAgregation: 'SUM' },
            { referentielPublicId: 'REF-REPLACE-B', fonctionAgregation: 'SUM' },
          ],
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: 'REF-REPLACE-B', fonctionAgregation: 'SUM' },
            { referentielPublicId: 'REF-REPLACE-C', fonctionAgregation: 'SUM' },
          ],
        }),
      )

      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: 'REF-REPLACE-B', fonctionAgregation: 'SUM' },
        { referentielPublicId: 'REF-REPLACE-C', fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'accepte un tableau vide (supprime toutes les configurations)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-EMPTY-A' })
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [{ referentielPublicId: 'REF-EMPTY-A', fonctionAgregation: 'SUM' }],
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
      await fixtures.referentiel({ publicId: 'REF-DEDUP-A' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: 'REF-DEDUP-A', fonctionAgregation: 'SUM' },
            { referentielPublicId: 'REF-DEDUP-A', fonctionAgregation: 'SUM' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: 'REF-DEDUP-A', fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'rejette quand un referentielPublicId est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-UNKNOWN-A' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur(indId, {
            nom: 'I',
            visibilite: 'PRIVE',
            unite: null,
            referentiels: [
              { referentielPublicId: 'REF-UNKNOWN-A', fonctionAgregation: 'SUM' },
              { referentielPublicId: 'REF-UNKNOWN-X', fonctionAgregation: 'SUM' },
              { referentielPublicId: 'REF-UNKNOWN-Y', fonctionAgregation: 'SUM' },
            ],
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
          upsertIndicateur(indId, { nom: 'X', visibilite: 'PRIVE', unite: null, referentiels: [] }),
        ),
      ).rejects.toThrow(/permission/i)
    }),
  )

  it(
    'met à jour la fonctionAgregation pour une configuration existante',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-UPDATE-A' })
      const apiKey = await fixtures.apiKey()

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [{ referentielPublicId: 'REF-UPDATE-A', fonctionAgregation: 'SUM' }],
        }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [{ referentielPublicId: 'REF-UPDATE-A', fonctionAgregation: 'NONE' }],
        }),
      )

      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: 'REF-UPDATE-A', fonctionAgregation: 'NONE' },
      ])
    }),
  )

  it(
    "dédoublonne sur referentielPublicId : en cas de fonctions différentes, la dernière l'emporte",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-DEDUP-FN' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          referentiels: [
            { referentielPublicId: 'REF-DEDUP-FN', fonctionAgregation: 'SUM' },
            { referentielPublicId: 'REF-DEDUP-FN', fonctionAgregation: 'NONE' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { referentielPublicId: 'REF-DEDUP-FN', fonctionAgregation: 'NONE' },
      ])
    }),
  )
})
