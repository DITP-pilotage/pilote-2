import { slugify } from '@pilote/kpilote-shared/slug'
import { describe, expect, it } from 'vitest'

import { createCollection } from '@/collection/commands/createCollection'
import { ValidationError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const body = { nom: 'Santé de proximité', description: null, visibilite: 'PUBLIC' as const }

// Non concurrent : le verrou consultatif sérialise les créations, deux tests
// simultanés s'attendraient mutuellement.
describe('createCollection', () => {
  it(
    'dérive l’identifiant public du nom',
    integrationTest(async () => {
      const nom = `Santé de proximité ${testCollectionId()}`
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => createCollection({ ...body, nom }))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: slugify(nom),
        nom,
        description: null,
        visibilite: 'PUBLIC',
        indicateurs: [],
        responsables: [],
      })
    }),
  )

  it(
    'suffixe l’identifiant quand le slug dérivé est déjà pris',
    integrationTest(async () => {
      const nom = `Santé de proximité ${testCollectionId()}`
      await fixtures.collection({ publicId: slugify(nom) })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => createCollection({ ...body, nom }))

      expect(result._unsafeUnwrap().id).toBe(`${slugify(nom)}-2`)
    }),
  )

  it(
    'refuse un nom dont aucun caractère ne peut composer un slug',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsAdmin(apiKey.id, () => createCollection({ ...body, nom: '??? !!!' })),
      ).rejects.toBeInstanceOf(ValidationError)
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
