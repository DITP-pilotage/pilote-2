import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { PermissionAction } from '@/generated/prisma/enums'
import { revokeDossierPermission } from '@/permission/commands/revokeDossierPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('revokeDossierPermission', () => {
  it(
    'retire toutes les actions du panier quand action est omise',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const pan = await fixtures.dossier({})
      await fixtures.dossierPermission({
        principalId: target.id,
        dossier: { publicId: pan.publicId },
        action: PermissionAction.READ,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        revokeDossierPermission({ principalId: target.id, dossierPublicId: pan.publicId }),
      )

      expect(result._unsafeUnwrap().dossiers).toEqual([])
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const pan = await fixtures.dossier({})
      await expect(
        runAsContributor(CALLER_ID, () =>
          revokeDossierPermission({
            principalId: target.id,
            dossierPublicId: pan.publicId,
            action: 'READ',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
