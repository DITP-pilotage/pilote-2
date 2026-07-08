import { describe, expect, it } from 'vitest'

import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const METADONNEES_VIDES = {
  description: null,
  methodeCalcul: null,
  sourceDonnees: null,
  sourceUrl: null,
  periodeMiseAJour: null,
  jourMiseAJour: null,
} as const

const getConfigurationsReferentiels = async (publicId: string) => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: { referentiels: { include: { referentiel: true } } },
  })
  return indicateur.referentiels
    .map((configuration) => ({
      id: configuration.referentiel.publicId,
      fonctionAgregation: configuration.fonctionAgregation,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
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

      const result = await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'Nouvel indicateur',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [
            { id: refA.publicId, fonctionAgregation: 'SUM' },
            { id: refB.publicId, fonctionAgregation: 'NONE' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      const configurationsTriees = [
        { id: refCreateA, fonctionAgregation: 'SUM' as const },
        { id: refCreateB, fonctionAgregation: 'NONE' as const },
      ].sort((a, b) => a.id.localeCompare(b.id))
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

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PUBLIC',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
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

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: 'POURCENTAGE',
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )
      const apresCreation = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresCreation.unite).toBe('POURCENTAGE')

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: 'ANNEES',
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )
      const apresMaj = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresMaj.unite).toBe('ANNEES')

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )
      const apresRemise = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresRemise.unite).toBeNull()
    }),
  )

  it(
    'persiste les métadonnées (description, méthode, sources, période/jour) à la création et au PUT',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          description: 'Description initiale',
          methodeCalcul: 'Moyenne',
          sourceDonnees: 'INSEE',
          sourceUrl: 'https://insee.fr',
          periodeMiseAJour: 'MENSUELLE',
          jourMiseAJour: 5,
          referentiels: [],
        }),
      )

      const apresCreation = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresCreation.description).toBe('Description initiale')
      expect(apresCreation.methodeCalcul).toBe('Moyenne')
      expect(apresCreation.sourceDonnees).toBe('INSEE')
      expect(apresCreation.sourceUrl).toBe('https://insee.fr')
      expect(apresCreation.periodeMiseAJour).toBe('MENSUELLE')
      expect(apresCreation.jourMiseAJour).toBe(5)

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          description: null,
          methodeCalcul: null,
          sourceDonnees: null,
          sourceUrl: null,
          periodeMiseAJour: 'ANNUELLE',
          jourMiseAJour: null,
          referentiels: [],
        }),
      )

      const apresMaj = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(apresMaj.description).toBeNull()
      expect(apresMaj.methodeCalcul).toBeNull()
      expect(apresMaj.sourceDonnees).toBeNull()
      expect(apresMaj.sourceUrl).toBeNull()
      expect(apresMaj.periodeMiseAJour).toBe('ANNUELLE')
      expect(apresMaj.jourMiseAJour).toBeNull()
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

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PUBLIC',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
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
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [
            { id: refReplaceA, fonctionAgregation: 'SUM' },
            { id: refReplaceB, fonctionAgregation: 'SUM' },
          ],
        }),
      )

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [
            { id: refReplaceB, fonctionAgregation: 'SUM' },
            { id: refReplaceC, fonctionAgregation: 'SUM' },
          ],
        }),
      )

      const configurationsTriees = [
        { id: refReplaceB, fonctionAgregation: 'SUM' as const },
        { id: refReplaceC, fonctionAgregation: 'SUM' as const },
      ].sort((a, b) => a.id.localeCompare(b.id))
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
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [{ id: refEmptyA, fonctionAgregation: 'SUM' }],
        }),
      )

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )

      expect(await getConfigurationsReferentiels(indId)).toEqual([])
    }),
  )

  it(
    'dédoublonne silencieusement les id en double',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refDedupA = testReferentielId()
      await fixtures.referentiel({ publicId: refDedupA })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [
            { id: refDedupA, fonctionAgregation: 'SUM' },
            { id: refDedupA, fonctionAgregation: 'SUM' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { id: refDedupA, fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'rejette quand un id est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refKnownA = testReferentielId()
      const refUnknownX = testReferentielId()
      const refUnknownY = testReferentielId()
      await fixtures.referentiel({ publicId: refKnownA })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(indId, {
            nom: 'I',
            visibilite: 'PRIVE',
            unite: null,
            ...METADONNEES_VIDES,
            referentiels: [
              { id: refKnownA, fonctionAgregation: 'SUM' },
              { id: refUnknownX, fonctionAgregation: 'SUM' },
              { id: refUnknownY, fonctionAgregation: 'SUM' },
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
        runAsAdmin(apiKey.id, () =>
          upsertIndicateur(indId, {
            nom: 'X',
            visibilite: 'PRIVE',
            unite: null,
            ...METADONNEES_VIDES,
            referentiels: [],
          }),
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

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [{ id: refUpdateA, fonctionAgregation: 'SUM' }],
        }),
      )

      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [{ id: refUpdateA, fonctionAgregation: 'NONE' }],
        }),
      )

      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { id: refUpdateA, fonctionAgregation: 'NONE' },
      ])
    }),
  )

  it(
    "dédoublonne sur id : en cas de fonctions différentes, la dernière l'emporte",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refDedupFn = testReferentielId()
      await fixtures.referentiel({ publicId: refDedupFn })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [
            { id: refDedupFn, fonctionAgregation: 'SUM' },
            { id: refDedupFn, fonctionAgregation: 'NONE' },
          ],
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getConfigurationsReferentiels(indId)).toEqual([
        { id: refDedupFn, fonctionAgregation: 'NONE' },
      ])
    }),
  )
})

describe.concurrent('upsertIndicateur — garde ADMIN', () => {
  const body = {
    nom: 'Nouveau nom',
    visibilite: 'PRIVE' as const,
    unite: null,
    ...METADONNEES_VIDES,
    referentiels: [],
  }

  it(
    'refuse une clé CONTRIBUTOR (403)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      await expect(
        runAsContributor(apiKey.id, () => upsertIndicateur(indId, body)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'autorise une clé ADMIN à créer un indicateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () => upsertIndicateur(indId, body))

      expect(result.isOk()).toBe(true)
      const row = await db().indicateur.findUnique({ where: { publicId: indId } })
      expect(row?.nom).toBe('Nouveau nom')
    }),
  )

  it(
    'autorise un utilisateur OIDC à créer un indicateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () => upsertIndicateur(indId, body))

      expect(result.isOk()).toBe(true)
    }),
  )
})
