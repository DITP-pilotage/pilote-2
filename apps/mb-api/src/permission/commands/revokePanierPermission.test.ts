import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { PermissionAction } from '@/generated/prisma/enums'
import { revokePanierPermission } from '@/permission/commands/revokePanierPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('revokePanierPermission', () => {
  it(
    'retire toutes les actions du panier quand action est omise',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const pan = await fixtures.panier({})
      await fixtures.panierPermission({
        principalId: target.id,
        panier: { publicId: pan.publicId },
        action: PermissionAction.READ,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        revokePanierPermission({ principalId: target.id, panierPublicId: pan.publicId }),
      )

      expect(result._unsafeUnwrap().paniers).toEqual([])
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const pan = await fixtures.panier({})
      await expect(
        runAsContributor(CALLER_ID, () =>
          revokePanierPermission({
            principalId: target.id,
            panierPublicId: pan.publicId,
            action: 'READ',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
