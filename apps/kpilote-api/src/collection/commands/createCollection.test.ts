import { describe, expect, it } from 'vitest'

import { createCollection } from '@/collection/commands/createCollection'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const body = { nom: 'Santé de proximité', description: null, visibilite: 'PUBLIC' as const }

// Non concurrent : le verrou consultatif sérialise les créations, deux tests
// simultanés s'attendraient mutuellement.
describe('createCollection', () => {
  it(
    'attribue l’identifiant suivant le plus grand identifiant numérique existant',
    integrationTest(async () => {
      const existant = testCollectionNumericId()
      await fixtures.collection({ publicId: existant })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })
      const suivant = `COL-${Number(existant.slice(4)) + 1}`

      const result = await runAsAdmin(apiKey.id, () => createCollection(body))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: suivant,
        nom: 'Santé de proximité',
        description: null,
        visibilite: 'PUBLIC',
        indicateurs: [],
        responsables: [],
      })
    }),
  )

  it(
    'ignore les trous dans la suite et repart du maximum',
    integrationTest(async () => {
      const base = Number(testCollectionNumericId().slice(4))
      await fixtures.collection({ publicId: `COL-${base}` }, { publicId: `COL-${base + 5}` })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => createCollection(body))

      expect(result._unsafeUnwrap().id).toBe(`COL-${base + 6}`)
    }),
  )

  it(
    'ignore les identifiants non numériques',
    integrationTest(async () => {
      const numerique = testCollectionNumericId()
      await fixtures.collection({ publicId: numerique }, { publicId: `COL-zzzz${Date.now()}` })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => createCollection(body))

      expect(result._unsafeUnwrap().id).toBe(`COL-${Number(numerique.slice(4)) + 1}`)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      await expect(runAsContributor(apiKey.id, () => createCollection(body))).rejects.toThrow(
        'Cette opération requiert une clé API de rôle ADMIN',
      )
    }),
  )
})
