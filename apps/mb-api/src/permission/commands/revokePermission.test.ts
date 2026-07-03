import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { PermissionAction } from '@/generated/prisma/enums'
import { revokePermission } from '@/permission/commands/revokePermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('revokePermission', () => {
  it(
    'retire une action précise et conserve les autres',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Indic' })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: PermissionAction.READ,
      })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: PermissionAction.WRITE,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        revokePermission({
          principalId: target.id,
          resourceType: 'INDICATEUR',
          resourcePublicId: ind.publicId,
          action: 'WRITE',
        }),
      )
      const model = result._unsafeUnwrap()

      expect(model.indicateurs).toEqual([
        { publicId: ind.publicId, nom: 'Indic', actions: ['READ'] },
      ])
    }),
  )

  it(
    'retire toutes les actions de la ressource quand action est omise',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: PermissionAction.READ,
      })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: PermissionAction.WRITE,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        revokePermission({
          principalId: target.id,
          resourceType: 'INDICATEUR',
          resourcePublicId: ind.publicId,
        }),
      )
      const model = result._unsafeUnwrap()

      expect(model.indicateurs).toEqual([])
    }),
  )

  it(
    'est idempotent (rien à retirer → succès)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})

      const result = await runAsAdmin(CALLER_ID, () =>
        revokePermission({
          principalId: target.id,
          resourceType: 'INDICATEUR',
          resourcePublicId: ind.publicId,
          action: 'READ',
        }),
      )
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().indicateurs).toEqual([])
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})

      await expect(
        runAsContributor(CALLER_ID, () =>
          revokePermission({
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
