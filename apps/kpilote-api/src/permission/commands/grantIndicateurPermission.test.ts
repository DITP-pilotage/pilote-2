import { PermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { grantIndicateurPermission } from '@/permission/commands/grantIndicateurPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('grantIndicateurPermission', () => {
  it(
    'accorde une action et retourne l’état à jour',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Mon indic' })

      const result = await runAsAdmin(CALLER_ID, () =>
        grantIndicateurPermission({
          principalId: target.id,
          indicateurPublicId: ind.publicId,
          action: PermissionAction.READ,
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        { publicId: ind.publicId, nom: 'Mon indic', actions: [PermissionAction.READ] },
      ])
    }),
  )

  it(
    'est idempotent (deux grants identiques → une seule ligne)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({})
      const body = {
        principalId: target.id,
        indicateurPublicId: ind.publicId,
        action: PermissionAction.READ,
      }

      await runAsAdmin(CALLER_ID, () => grantIndicateurPermission(body))
      await runAsAdmin(CALLER_ID, () => grantIndicateurPermission(body))

      const count = await db().indicateurPermission.count({ where: { principalId: target.id } })
      expect(count).toBe(1)
    }),
  )

  it(
    'rejette un indicateur inconnu',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      await expect(
        runAsAdmin(CALLER_ID, () =>
          grantIndicateurPermission({
            principalId: target.id,
            indicateurPublicId: 'IND-INEXISTANT',
            action: PermissionAction.READ,
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
          grantIndicateurPermission({
            principalId: target.id,
            indicateurPublicId: ind.publicId,
            action: PermissionAction.READ,
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
