import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertReferentiel } from '@/referentiel/commands/upsertReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testReferentielId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

// La gestion d'un référentiel est réservée aux clés ADMIN : les cas nominaux
// s'exécutent donc sous un principal ADMIN.
const ADMIN_PRINCIPAL_ID = '00000000-0000-0000-0000-0000000000aa'
const upsertReferentielAsAdmin: typeof upsertReferentiel = (publicId, body) =>
  runAsAdmin(ADMIN_PRINCIPAL_ID, () => upsertReferentiel(publicId, body))

describe.concurrent('upsertReferentiel', () => {
  it(
    'crée un référentiel quand le publicId est libre',
    integrationTest(async () => {
      // When
      const refNew = testReferentielId()
      const result = await upsertReferentielAsAdmin(refNew, {
        nom: 'Nouveau référentiel',
        description: 'Description initiale',
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().referentiel.findUniqueOrThrow({ where: { publicId: refNew } })
      expect(persisted.nom).toBe('Nouveau référentiel')
      expect(persisted.description).toBe('Description initiale')
    }),
  )

  it(
    'met à jour nom, description et updatedAt quand le référentiel existe déjà',
    integrationTest(async () => {
      // Given
      const refUpd = testReferentielId()
      const original = await fixtures.referentiel({
        publicId: refUpd,
        nom: 'Ancien nom',
        description: 'Ancienne description',
      })

      // When
      const result = await upsertReferentielAsAdmin(refUpd, {
        nom: 'Nouveau nom',
        description: null,
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().referentiel.findUniqueOrThrow({ where: { publicId: refUpd } })
      expect(persisted.nom).toBe('Nouveau nom')
      expect(persisted.description).toBeNull()
      expect(persisted.createdAt).toEqual(original.createdAt)
      expect(persisted.updatedAt >= original.updatedAt).toBe(true)
    }),
  )

  it(
    'crée et rattache de nouveaux individus',
    integrationTest(async () => {
      // Given
      const [dept1, dept2] = testDeptIds(2)
      const refInds = testReferentielId()

      // When
      await upsertReferentielAsAdmin(refInds, {
        nom: 'Avec individus',
        description: null,
        individus: [
          { publicId: dept1, nom: 'Premier' },
          { publicId: dept2, nom: 'Second' },
        ],
      })

      // Then
      const persistedDept1 = await db().individu.findUniqueOrThrow({
        where: { publicId: dept1 },
        include: { referentiel: { select: { publicId: true } } },
      })
      expect(persistedDept1.nom).toBe('Premier')
      expect(persistedDept1.referentiel.publicId).toBe(refInds)
      const individusForRef = await db().individu.findMany({
        where: { referentiel: { publicId: refInds } },
      })
      expect(individusForRef).toHaveLength(2)
    }),
  )

  it(
    "met à jour le nom d'un individu existant déjà rattaché au référentiel cible",
    integrationTest(async () => {
      // Given
      const [dept1] = testDeptIds(1)
      const refLink = testReferentielId()
      await fixtures.individu({
        publicId: dept1,
        nom: 'Ancien nom individu',
        referentiel: { publicId: refLink },
      })

      // When
      const result = await upsertReferentielAsAdmin(refLink, {
        nom: 'Référentiel',
        description: null,
        individus: [{ publicId: dept1, nom: 'Nouveau nom individu' }],
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().individu.findUniqueOrThrow({
        where: { publicId: dept1 },
        include: { referentiel: { select: { publicId: true } } },
      })
      expect(persisted.nom).toBe('Nouveau nom individu')
      expect(persisted.referentiel.publicId).toBe(refLink)
    }),
  )

  it(
    'retourne une erreur listant tous les individus déjà rattachés à un autre référentiel',
    integrationTest(async () => {
      // Given
      const [dept1, dept2, dept3] = testDeptIds(3)
      const refOtherA = testReferentielId()
      const refOtherB = testReferentielId()
      const refNew2 = testReferentielId()
      await fixtures.individu(
        { publicId: dept1, referentiel: { publicId: refOtherA } },
        { publicId: dept2, referentiel: { publicId: refOtherB } },
      )

      // When
      const result = await upsertReferentielAsAdmin(refNew2, {
        nom: 'Nouveau référentiel',
        description: null,
        individus: [
          { publicId: dept1, nom: 'Premier' },
          { publicId: dept2, nom: 'Second' },
          { publicId: dept3, nom: 'Troisième (libre)' },
        ],
      })

      // Then : dept1 et dept2 listés, dept3 ignoré (pas en conflit) ; aucune écriture
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'INDIVIDUS_ALREADY_ATTACHED',
        individuIds: [dept1, dept2].sort(),
      })
      const created = await db().referentiel.findUnique({ where: { publicId: refNew2 } })
      expect(created).toBeNull()
    }),
  )

  it(
    'fonctionne sans individus (champ omis)',
    integrationTest(async () => {
      // When
      const refEmpty = testReferentielId()
      const result = await upsertReferentielAsAdmin(refEmpty, {
        nom: 'Sans individus',
        description: null,
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().referentiel.findUniqueOrThrow({
        where: { publicId: refEmpty },
      })
      expect(persisted.nom).toBe('Sans individus')
    }),
  )
})

describe.concurrent('upsertReferentiel — garde ADMIN', () => {
  const body = { nom: 'Référentiel', description: null, individus: [] }

  it(
    'refuse une clé CONTRIBUTOR (403)',
    integrationTest(async () => {
      const refId = testReferentielId()
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () => upsertReferentiel(refId, body)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'autorise une clé ADMIN',
    integrationTest(async () => {
      const refId = testReferentielId()
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () => upsertReferentiel(refId, body))

      expect(result.isOk()).toBe(true)
      const row = await db().referentiel.findUnique({ where: { publicId: refId } })
      expect(row?.nom).toBe('Référentiel')
    }),
  )

  it(
    'autorise un utilisateur OIDC',
    integrationTest(async () => {
      const refId = testReferentielId()
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () => upsertReferentiel(refId, body))

      expect(result.isOk()).toBe(true)
    }),
  )
})
