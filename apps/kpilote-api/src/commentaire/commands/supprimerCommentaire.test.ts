import { describe, expect, it } from 'vitest'

import { supprimerCommentaire } from '@/commentaire/commands/supprimerCommentaire'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('supprimerCommentaire', () => {
  it(
    'supprime le commentaire de l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const c = await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: testIndividuId() },
        createdBy: apiKey.id,
      })

      const result = await runAsPrincipal(apiKey.id, () => supprimerCommentaire(c.id))

      expect(result.isOk()).toBe(true)
      expect(await db().commentaire.findUnique({ where: { id: c.id } })).toBeNull()
    }),
  )
})
