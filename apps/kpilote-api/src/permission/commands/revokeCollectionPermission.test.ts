import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { PermissionAction } from '@/generated/prisma/enums'
import { revokeCollectionPermission } from '@/permission/commands/revokeCollectionPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('revokeCollectionPermission', () => {
  it(
    'retire toutes les actions du collection quand action est omise',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const dos = await fixtures.collection({})
      await fixtures.collectionPermission({
        principalId: target.id,
        collection: { publicId: dos.publicId },
        action: PermissionAction.READ,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        revokeCollectionPermission({ principalId: target.id, collectionPublicId: dos.publicId }),
      )

      expect(result._unsafeUnwrap().collections).toEqual([])
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const dos = await fixtures.collection({})
      await expect(
        runAsContributor(CALLER_ID, () =>
          revokeCollectionPermission({
            principalId: target.id,
            collectionPublicId: dos.publicId,
            action: 'READ',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
