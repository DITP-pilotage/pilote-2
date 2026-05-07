import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { upsertReferentiel } from '@/referentiel/commands/upsertReferentiel'
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
      expect(result._unsafeUnwrap()).toMatchObject({
        id: 'REF-NEW',
        nom: 'Nouveau référentiel',
        description: 'Description initiale',
        nombreIndividus: 0,
      })
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
      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: 'REF-UPD',
        nom: 'Nouveau nom',
        description: null,
        createdAt: original.createdAt.toISOString(),
      })
      expect(value.updatedAt >= original.updatedAt.toISOString()).toBe(true)
    }),
  )

  it(
    'crée et lie de nouveaux individus',
    integrationTest(async () => {
      // Given
      const [dept1, dept2] = testDeptIds(2)

      // When
      const result = await upsertReferentiel('REF-INDS', {
        nom: 'Avec individus',
        description: null,
        individus: [
          { publicId: dept1, nom: 'Premier' },
          { publicId: dept2, nom: 'Second' },
        ],
      })

      // Then
      expect(result._unsafeUnwrap().nombreIndividus).toBe(2)
      const persistedDept1 = await db().individu.findUniqueOrThrow({ where: { publicId: dept1 } })
      expect(persistedDept1.nom).toBe('Premier')
      const liaisons = await db().referentielIndividu.findMany({
        where: { referentiel: { publicId: 'REF-INDS' } },
      })
      expect(liaisons).toHaveLength(2)
    }),
  )

  it(
    "met à jour le nom d'un individu existant et ajoute la liaison",
    integrationTest(async () => {
      // Given
      const [dept1] = testDeptIds(1)
      await fixtures.individu({ publicId: dept1, nom: 'Ancien nom individu' })

      // When
      const result = await upsertReferentiel('REF-LINK', {
        nom: 'Référentiel',
        description: null,
        individus: [{ publicId: dept1, nom: 'Nouveau nom individu' }],
      })

      // Then
      expect(result._unsafeUnwrap().nombreIndividus).toBe(1)
      const persisted = await db().individu.findUniqueOrThrow({ where: { publicId: dept1 } })
      expect(persisted.nom).toBe('Nouveau nom individu')
      const liaison = await db().referentielIndividu.findFirstOrThrow({
        where: {
          referentiel: { publicId: 'REF-LINK' },
          individu: { publicId: dept1 },
        },
      })
      expect(liaison).toBeDefined()
    }),
  )

  it(
    'ne retire pas les individus déjà liés mais absents du body (merge)',
    integrationTest(async () => {
      // Given
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.referentielIndividu(
        { referentiel: { publicId: 'REF-MERGE' }, individu: { publicId: dept1 } },
        { referentiel: { publicId: 'REF-MERGE' }, individu: { publicId: dept2 } },
      )

      // When
      const result = await upsertReferentiel('REF-MERGE', {
        nom: 'Référentiel de test',
        description: null,
        individus: [{ publicId: dept1, nom: 'Individu de test' }],
      })

      // Then : les deux liaisons sont toujours là
      expect(result._unsafeUnwrap().nombreIndividus).toBe(2)
    }),
  )

  it(
    "préserve les liaisons d'un individu vers d'autres référentiels",
    integrationTest(async () => {
      // Given
      const [dept1] = testDeptIds(1)
      await fixtures.referentielIndividu({
        referentiel: { publicId: 'REF-OTHER' },
        individu: { publicId: dept1 },
      })

      // When
      await upsertReferentiel('REF-NEW2', {
        nom: 'Nouveau référentiel',
        description: null,
        individus: [{ publicId: dept1, nom: 'Individu de test' }],
      })

      // Then : l'individu reste lié à REF-OTHER ET REF-NEW2
      const liaisons = await db().referentielIndividu.findMany({
        where: { individu: { publicId: dept1 } },
        include: { referentiel: true },
      })
      const refIds = liaisons.map((l) => l.referentiel.publicId).sort()
      expect(refIds).toEqual(['REF-NEW2', 'REF-OTHER'])
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
      expect(result._unsafeUnwrap().nombreIndividus).toBe(0)
    }),
  )
})
