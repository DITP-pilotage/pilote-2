import { PermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { grantCollectionPermission } from '@/permission/commands/grantCollectionPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('grantCollectionPermission', () => {
  it(
    'accorde une action sur une collection et propage READ aux indicateurs hérités',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Contenu' })
      const dos = await fixtures.collection({
        nom: 'Mon collection',
        indicateurs: [{ publicId: ind.publicId }],
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        grantCollectionPermission({
          principalId: target.id,
          collectionPublicId: dos.publicId,
          action: PermissionAction.READ,
        }),
      )
      const model = result._unsafeUnwrap()

      expect(model.collections).toEqual([
        { publicId: dos.publicId, nom: 'Mon collection', actions: [PermissionAction.READ] },
      ])
      expect(model.indicateursHerites).toEqual([
        {
          publicId: ind.publicId,
          nom: 'Contenu',
          viaCollectionPublicId: dos.publicId,
          viaCollectionNom: 'Mon collection',
        },
      ])
    }),
  )

  it(
    'rejette une collection inconnu',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      await expect(
        runAsAdmin(CALLER_ID, () =>
          grantCollectionPermission({
            principalId: target.id,
            collectionPublicId: 'COL-INEXISTANT',
            action: PermissionAction.READ,
          }),
        ),
      ).rejects.toThrow()
    }),
  )
})
