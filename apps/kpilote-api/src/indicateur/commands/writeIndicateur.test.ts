import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'

import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { createIndicateur, updateIndicateur } from '@/indicateur/commands/writeIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const getResponsableUtilisateurIds = async (publicId: string): Promise<string[]> => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: { responsables: { orderBy: { createdAt: 'asc' } } },
  })
  return indicateur.responsables.map((responsable) => responsable.utilisateurId)
}

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

const BODY_BASE = {
  nom: 'Données fiscales',
  visibilite: 'PRIVE' as const,
  unite: null,
  ...METADONNEES_VIDES,
  referentiels: [],
}

describe.concurrent('createIndicateur', () => {
  it(
    'persiste le délai de mise à disposition à la création',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({
            ...BODY_BASE,
            delaiMiseADisposition: { nombre: 6, unite: 'MOIS' },
          }),
        )
      )._unsafeUnwrap()

      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(row.delaiMiseADispositionNombre).toBe(6)
      expect(row.delaiMiseADispositionUnite).toBe('MOIS')
    }),
  )

  it(
    'efface le délai quand on envoie null',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({
            ...BODY_BASE,
            delaiMiseADisposition: { nombre: 6, unite: 'MOIS' },
          }),
        )
      )._unsafeUnwrap()
      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, { ...BODY_BASE, delaiMiseADisposition: null }),
      )

      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
      expect(row.delaiMiseADispositionNombre).toBeNull()
      expect(row.delaiMiseADispositionUnite).toBeNull()
    }),
  )

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
      const grants = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateur: { publicId } },
        orderBy: { action: 'asc' },
      })
      expect(grants.map((g) => g.action)).toEqual([
        IndicateurPermissionAction.READ,
        IndicateurPermissionAction.WRITE_DATA,
        IndicateurPermissionAction.WRITE_COMMENT,
      ])
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
      const nom = `Rejet ${refUnknownX}`

      await expect(
        runAsAdmin(apiKey.id, () =>
          createIndicateur({
            nom,
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

      expect(await db().indicateur.findFirst({ where: { nom } })).toBeNull()
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

  it(
    'assigne des responsables à la création',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })
      const userB = await fixtures.utilisateur({ email: `b-${indId}@example.com` })

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, responsables: [userA.id, userB.id] }),
        )
      )._unsafeUnwrap()

      const ids = await getResponsableUtilisateurIds(publicId)
      expect(new Set(ids)).toEqual(new Set([userA.id, userB.id]))
    }),
  )

  it(
    'remplace intégralement la liste des responsables (replace-all)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })
      const userB = await fixtures.utilisateur({ email: `b-${indId}@example.com` })
      const userC = await fixtures.utilisateur({ email: `c-${indId}@example.com` })

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, responsables: [userA.id, userB.id] }),
        )
      )._unsafeUnwrap()
      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, { ...BODY_BASE, responsables: [userB.id, userC.id] }),
      )

      const ids = await getResponsableUtilisateurIds(publicId)
      expect(new Set(ids)).toEqual(new Set([userB.id, userC.id]))
    }),
  )

  it(
    'laisse les responsables inchangés quand le champ est absent',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, responsables: [userA.id] }),
        )
      )._unsafeUnwrap()
      // Pas de clé `responsables` → ne pas toucher.
      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, { ...BODY_BASE, nom: 'Renommé' }),
      )

      const ids = await getResponsableUtilisateurIds(publicId)
      expect(ids).toEqual([userA.id])
    }),
  )

  it(
    'vide les responsables quand le champ vaut []',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, responsables: [userA.id] }),
        )
      )._unsafeUnwrap()
      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, { ...BODY_BASE, responsables: [] }),
      )

      const ids = await getResponsableUtilisateurIds(publicId)
      expect(ids).toEqual([])
    }),
  )

  it(
    'déduplique les responsables en doublon',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, responsables: [userA.id, userA.id] }),
        )
      )._unsafeUnwrap()

      const ids = await getResponsableUtilisateurIds(publicId)
      expect(ids).toEqual([userA.id])
    }),
  )

  it(
    'échoue avec VALIDATION_ERROR quand un utilisateur est inconnu (aucun indicateur créé)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const inconnu = uuidv7()
      const nom = `Responsable inconnu ${indId}`

      await expect(
        runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, nom, responsables: [inconnu] }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownUtilisateurIds: [inconnu] },
      })

      expect(await db().indicateur.findFirst({ where: { nom } })).toBeNull()
    }),
  )

  it(
    "préserve le createdAt des responsables conservés lors d'un remplacement",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const userA = await fixtures.utilisateur({ email: `keep-a-${indId}@example.com` })
      const userB = await fixtures.utilisateur({ email: `keep-b-${indId}@example.com` })

      const publicId = (
        await runAsAdmin(apiKey.id, () =>
          createIndicateur({ ...BODY_BASE, responsables: [userA.id] }),
        )
      )._unsafeUnwrap()
      const avant = await db().indicateurResponsable.findFirstOrThrow({
        where: { utilisateurId: userA.id, indicateur: { publicId } },
      })

      await runAsAdmin(apiKey.id, () =>
        updateIndicateur(publicId, { ...BODY_BASE, responsables: [userA.id, userB.id] }),
      )
      const apres = await db().indicateurResponsable.findFirstOrThrow({
        where: { utilisateurId: userA.id, indicateur: { publicId } },
      })

      expect(apres.createdAt).toEqual(avant.createdAt)
      // userA (inséré en 1er, createdAt préservé) précède userB (inséré ensuite).
      const ids = await getResponsableUtilisateurIds(publicId)
      expect(ids).toEqual([userA.id, userB.id])
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
          { principalId, indicateurId: existant.id, action: IndicateurPermissionAction.WRITE_DATA },
          { principalId, indicateurId: existant.id, action: IndicateurPermissionAction.READ },
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
        permissions: [
          { indicateur: { publicId: 'IND-900501' }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
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
        permissions: [
          { indicateur: { publicId: 'IND-900502' }, action: IndicateurPermissionAction.READ },
        ],
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
