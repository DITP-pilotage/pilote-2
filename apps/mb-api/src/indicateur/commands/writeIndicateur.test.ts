import { describe, expect, it } from 'vitest'

import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { createIndicateur, updateIndicateur } from '@/indicateur/commands/writeIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testReferentielId } from '@/test/randomIds'
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

describe.concurrent('createIndicateur', () => {
  it(
    'crée un indicateur avec ses référentiels configurés et auto-grant READ+WRITE au créateur',
    integrationTest(async () => {
      const refCreateA = testReferentielId()
      const refCreateB = testReferentielId()
      const apiKey = await fixtures.apiKey()
      const refA = await fixtures.referentiel({ publicId: refCreateA })
      const refB = await fixtures.referentiel({ publicId: refCreateB })

      const result = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
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
      const publicId = result._unsafeUnwrap()
      expect(publicId).toMatch(/^IND-\d+$/)

      const configurationsTriees = [
        { id: refCreateA, fonctionAgregation: 'SUM' as const },
        { id: refCreateB, fonctionAgregation: 'NONE' as const },
      ].sort((a, b) => a.id.localeCompare(b.id))
      expect(await getConfigurationsReferentiels(publicId)).toEqual(configurationsTriees)

      const created = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      const perms = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateurId: created.id },
      })
      expect(perms.map((p) => p.action).sort()).toEqual(['READ', 'WRITE'])
    }),
  )

  it(
    'génère un publicId IND-<max+1>',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
          nom: 'Indicateur numéroté',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )

      expect(result._unsafeUnwrap()).toBe('IND-900002')
    }),
  )

  it(
    'persiste la visibilité fournie à la création',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
          nom: 'I',
          visibilite: 'PUBLIC',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )

      const publicId = result._unsafeUnwrap()
      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(row.visibilite).toBe('PUBLIC')
    }),
  )

  it(
    "persiste l'unité fournie à la création et la met à jour via PUT",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const createResult = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
          nom: 'I',
          visibilite: 'PRIVE',
          unite: 'POURCENTAGE',
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )
      const publicId = createResult._unsafeUnwrap()
      const apresCreation = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(apresCreation.unite).toBe('POURCENTAGE')

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: 'ANNEES',
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )
      const apresMaj = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(apresMaj.unite).toBe('ANNEES')

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )
      const apresRemise = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(apresRemise.unite).toBeNull()
    }),
  )

  it(
    'persiste les métadonnées (description, méthode, sources, période/jour) à la création et au PUT',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const createResult = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
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
      const publicId = createResult._unsafeUnwrap()

      const apresCreation = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(apresCreation.description).toBe('Description initiale')
      expect(apresCreation.methodeCalcul).toBe('Moyenne')
      expect(apresCreation.sourceDonnees).toBe('INSEE')
      expect(apresCreation.sourceUrl).toBe('https://insee.fr')
      expect(apresCreation.periodeMiseAJour).toBe('MENSUELLE')
      expect(apresCreation.jourMiseAJour).toBe(5)

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, {
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

      const apresMaj = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(apresMaj.description).toBeNull()
      expect(apresMaj.methodeCalcul).toBeNull()
      expect(apresMaj.sourceDonnees).toBeNull()
      expect(apresMaj.sourceUrl).toBeNull()
      expect(apresMaj.periodeMiseAJour).toBe('ANNUELLE')
      expect(apresMaj.jourMiseAJour).toBeNull()
    }),
  )

  it(
    "remplace l'ensemble des configurations à chaque PUT (ajout + suppression)",
    integrationTest(async () => {
      const refReplaceA = testReferentielId()
      const refReplaceB = testReferentielId()
      const refReplaceC = testReferentielId()
      await fixtures.referentiel(
        { publicId: refReplaceA },
        { publicId: refReplaceB },
        { publicId: refReplaceC },
      )
      const apiKey = await fixtures.apiKey()
      const createResult = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
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
      const publicId = createResult._unsafeUnwrap()

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, {
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
      expect(await getConfigurationsReferentiels(publicId)).toEqual(configurationsTriees)
    }),
  )

  it(
    'accepte un tableau vide (supprime toutes les configurations)',
    integrationTest(async () => {
      const refEmptyA = testReferentielId()
      await fixtures.referentiel({ publicId: refEmptyA })
      const apiKey = await fixtures.apiKey()
      const createResult = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [{ id: refEmptyA, fonctionAgregation: 'SUM' }],
        }),
      )
      const publicId = createResult._unsafeUnwrap()

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )

      expect(await getConfigurationsReferentiels(publicId)).toEqual([])
    }),
  )

  it(
    'dédoublonne silencieusement les id en double',
    integrationTest(async () => {
      const refDedupA = testReferentielId()
      await fixtures.referentiel({ publicId: refDedupA })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
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
      const publicId = result._unsafeUnwrap()
      expect(await getConfigurationsReferentiels(publicId)).toEqual([
        { id: refDedupA, fonctionAgregation: 'SUM' },
      ])
    }),
  )

  it(
    'rejette quand un id est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const refKnownA = testReferentielId()
      const refUnknownX = testReferentielId()
      const refUnknownY = testReferentielId()
      await fixtures.referentiel({ publicId: refKnownA })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsAdmin(apiKey.id, () =>
          createIndicateur({
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
    }),
  )

  it(
    'met à jour la fonctionAgregation pour une configuration existante',
    integrationTest(async () => {
      const refUpdateA = testReferentielId()
      await fixtures.referentiel({ publicId: refUpdateA })
      const apiKey = await fixtures.apiKey()

      const createResult = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [{ id: refUpdateA, fonctionAgregation: 'SUM' }],
        }),
      )
      const publicId = createResult._unsafeUnwrap()

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, {
          nom: 'I',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [{ id: refUpdateA, fonctionAgregation: 'NONE' }],
        }),
      )

      expect(await getConfigurationsReferentiels(publicId)).toEqual([
        { id: refUpdateA, fonctionAgregation: 'NONE' },
      ])
    }),
  )

  it(
    "dédoublonne sur id : en cas de fonctions différentes, la dernière l'emporte",
    integrationTest(async () => {
      const refDedupFn = testReferentielId()
      await fixtures.referentiel({ publicId: refDedupFn })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        createIndicateur({
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
      const publicId = result._unsafeUnwrap()
      expect(await getConfigurationsReferentiels(publicId)).toEqual([
        { id: refDedupFn, fonctionAgregation: 'NONE' },
      ])
    }),
  )
})

describe.concurrent('updateIndicateur', () => {
  it(
    'met à jour un indicateur existant',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const principalId = apiKey.id
      const existant = await fixtures.indicateur({ publicId: 'IND-900500', nom: 'Ancien nom' })
      await db().indicateurPermission.createMany({
        data: [
          { principalId, indicateurId: existant.id, action: 'WRITE' },
          { principalId, indicateurId: existant.id, action: 'READ' },
        ],
      })

      const result = await runAsAdmin(apiKey.id, () =>
        updateIndicateur('IND-900500', {
          nom: 'Nouveau nom',
          visibilite: 'PUBLIC',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )

      expect(result.isOk()).toBe(true)
      const maj = await db().indicateur.findUniqueOrThrow({ where: { publicId: 'IND-900500' } })
      expect(maj.nom).toBe('Nouveau nom')
    }),
  )

  it(
    "échoue en 404 (P2025) si l'indicateur à mettre à jour n'existe pas",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsAdmin(apiKey.id, () =>
          updateIndicateur('IND-909090', {
            nom: 'Peu importe',
            visibilite: 'PRIVE',
            unite: null,
            ...METADONNEES_VIDES,
            referentiels: [],
          }),
        ),
      ).rejects.toMatchObject({ code: 'P2025' })
    }),
  )

  it(
    "permet à un principal disposant de WRITE de modifier la visibilité d'un indicateur existant",
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900501', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: 'IND-900501' }, action: 'WRITE' }],
      })

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur('IND-900501', {
          nom: 'I',
          visibilite: 'PUBLIC',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      )

      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId: 'IND-900501' } })
      expect(row.visibilite).toBe('PUBLIC')
    }),
  )

  it(
    "rejette la mise à jour quand le principal n'a pas la permission WRITE",
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900502', nom: 'Ancien' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: 'IND-900502' }, action: 'READ' }],
      })

      await expect(
        runAsAdmin(apiKey.id, () =>
          updateIndicateur('IND-900502', {
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
})

describe.concurrent('writeIndicateur — garde ADMIN', () => {
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
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () => createIndicateur(body)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'autorise une clé ADMIN à créer un indicateur',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () => createIndicateur(body))

      expect(result.isOk()).toBe(true)
      const publicId = result._unsafeUnwrap()
      const row = await db().indicateur.findUnique({ where: { publicId } })
      expect(row?.nom).toBe('Nouveau nom')
    }),
  )

  it(
    'autorise un utilisateur OIDC à créer un indicateur',
    integrationTest(async () => {
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () => createIndicateur(body))

      expect(result.isOk()).toBe(true)
    }),
  )
})
