import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import {
  IndividuAlreadyAttachedError,
  upsertReferentiel,
} from '@/referentiel/commands/upsertReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds } from '@/test/randomIds'

describe.concurrent('upsertReferentiel', () => {
  it(
    'crée un référentiel quand le publicId est libre',
    integrationTest(async () => {
      // When
      const result = await upsertReferentiel('REF-NEW', {
        nom: 'Nouveau référentiel',
        description: 'Description initiale',
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().referentiel.findUniqueOrThrow({ where: { publicId: 'REF-NEW' } })
      expect(persisted.nom).toBe('Nouveau référentiel')
      expect(persisted.description).toBe('Description initiale')
    }),
  )

  it(
    'met à jour nom, description et updatedAt quand le référentiel existe déjà',
    integrationTest(async () => {
      // Given
      const original = await fixtures.referentiel({
        publicId: 'REF-UPD',
        nom: 'Ancien nom',
        description: 'Ancienne description',
      })

      // When
      const result = await upsertReferentiel('REF-UPD', {
        nom: 'Nouveau nom',
        description: null,
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().referentiel.findUniqueOrThrow({ where: { publicId: 'REF-UPD' } })
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

      // When
      await upsertReferentiel('REF-INDS', {
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
      expect(persistedDept1.referentiel.publicId).toBe('REF-INDS')
      const individusForRef = await db().individu.findMany({
        where: { referentiel: { publicId: 'REF-INDS' } },
      })
      expect(individusForRef).toHaveLength(2)
    }),
  )

  it(
    "met à jour le nom d'un individu existant déjà rattaché au référentiel cible",
    integrationTest(async () => {
      // Given
      const [dept1] = testDeptIds(1)
      await fixtures.individu({
        publicId: dept1,
        nom: 'Ancien nom individu',
        referentiel: { publicId: 'REF-LINK' },
      })

      // When
      const result = await upsertReferentiel('REF-LINK', {
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
      expect(persisted.referentiel.publicId).toBe('REF-LINK')
    }),
  )

  it(
    'rejette quand un individu listé est déjà rattaché à un autre référentiel',
    integrationTest(async () => {
      // Given
      const [dept1] = testDeptIds(1)
      await fixtures.individu({
        publicId: dept1,
        referentiel: { publicId: 'REF-OTHER' },
      })

      // When / Then
      await expect(
        upsertReferentiel('REF-NEW2', {
          nom: 'Nouveau référentiel',
          description: null,
          individus: [{ publicId: dept1, nom: 'Individu de test' }],
        }),
      ).rejects.toBeInstanceOf(IndividuAlreadyAttachedError)
    }),
  )

  it(
    'fonctionne sans individus (champ omis)',
    integrationTest(async () => {
      // When
      const result = await upsertReferentiel('REF-EMPTY', {
        nom: 'Sans individus',
        description: null,
      })

      // Then
      expect(result.isOk()).toBe(true)
      const persisted = await db().referentiel.findUniqueOrThrow({
        where: { publicId: 'REF-EMPTY' },
      })
      expect(persisted.nom).toBe('Sans individus')
    }),
  )
})
