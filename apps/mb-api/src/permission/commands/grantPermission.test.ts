import { describe, expect, it } from 'vitest'

import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { grantPermission } from '@/permission/commands/grantPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('grantPermission', () => {
  it(
    'accorde une action et retourne l’état à jour',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Mon indic' })

      const result = await runAsAdmin(CALLER_ID, () =>
        grantPermission({
          principalId: target.id,
          resourceType: 'INDICATEUR',
          resourcePublicId: ind.publicId,
          action: 'READ',
        }),
      )
      const model = result._unsafeUnwrap()

      expect(model.indicateurs).toEqual([
        { publicId: ind.publicId, nom: 'Mon indic', actions: ['READ'] },
      ])
    }),
  )

  it(
    'est idempotent (deux grants identiques → une seule ligne)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Idempotent' })
      const body = {
        principalId: target.id,
        resourceType: 'INDICATEUR' as const,
        resourcePublicId: ind.publicId,
        action: 'READ' as const,
      }

      await runAsAdmin(CALLER_ID, () => grantPermission(body))
      const result = await runAsAdmin(CALLER_ID, () => grantPermission(body))
      const model = result._unsafeUnwrap()

      expect(model.indicateurs).toEqual([
        { publicId: ind.publicId, nom: 'Idempotent', actions: ['READ'] },
      ])
      const count = await db().indicateurPermission.count({ where: { principalId: target.id } })
      expect(count).toBe(1)
    }),
  )

  it(
    'rejette un préfixe incohérent avec le resourceType (ValidationError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})

      await expect(
        runAsAdmin(CALLER_ID, () =>
          grantPermission({
            principalId: target.id,
            resourceType: 'PANIER',
            resourcePublicId: ind.publicId,
            action: 'READ',
          }),
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    }),
  )

  it(
    'rejette une ressource inconnue',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})

      await expect(
        runAsAdmin(CALLER_ID, () =>
          grantPermission({
            principalId: target.id,
            resourceType: 'PANIER',
            resourcePublicId: 'PAN-INEXISTANT',
            action: 'READ',
          }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})

      await expect(
        runAsContributor(CALLER_ID, () =>
          grantPermission({
            principalId: target.id,
            resourceType: 'INDICATEUR',
            resourcePublicId: ind.publicId,
            action: 'READ',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
