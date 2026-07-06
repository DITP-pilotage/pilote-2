import { describe, expect, it } from 'vitest'

import { PermissionAction } from '@/generated/prisma/enums'
import { revokeIndicateurPermission } from '@/permission/commands/revokeIndicateurPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

const grantReadWrite = async (principalId: string, indicateurPublicId: string) => {
  await fixtures.indicateurPermission({
    principalId,
    indicateur: { publicId: indicateurPublicId },
    action: PermissionAction.READ,
  })
  await fixtures.indicateurPermission({
    principalId,
    indicateur: { publicId: indicateurPublicId },
    action: PermissionAction.WRITE,
  })
}

describe.concurrent('revokeIndicateurPermission', () => {
  it(
    'retire une action précise et conserve les autres',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Indic' })
      await grantReadWrite(target.id, ind.publicId)

      const result = await runAsAdmin(CALLER_ID, () =>
        revokeIndicateurPermission({
          principalId: target.id,
          indicateurPublicId: ind.publicId,
          action: 'WRITE',
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        { publicId: ind.publicId, nom: 'Indic', actions: ['READ'] },
      ])
    }),
  )

  it(
    'retire toutes les actions quand action est omise',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})
      await grantReadWrite(target.id, ind.publicId)

      const result = await runAsAdmin(CALLER_ID, () =>
        revokeIndicateurPermission({ principalId: target.id, indicateurPublicId: ind.publicId }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([])
    }),
  )
})
