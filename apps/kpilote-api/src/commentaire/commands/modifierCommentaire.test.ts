import { describe, expect, it } from 'vitest'

import { modifierCommentaire } from '@/commentaire/commands/modifierCommentaire'
import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('modifierCommentaire', () => {
  it(
    'met à jour contenu + statut + contenuTexte par l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const c = await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: testIndividuId() },
        createdBy: apiKey.id,
        statut: 'BROUILLON',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        modifierCommentaire(c.id, { contenu: '<p>MAJ</p>', statut: 'PUBLIE' }),
      )

      expect(result.isOk()).toBe(true)
      const row = await db().commentaire.findUniqueOrThrow({ where: { id: c.id } })
      expect(row.contenuTexte).toBe('MAJ')
      expect(row.statut).toBe('PUBLIE')
    }),
  )

  it(
    'throw ForbiddenError si le principal n’est pas l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const auteur = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const autre = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const c = await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: testIndividuId() },
        createdBy: auteur.id,
      })

      await expect(
        runAsPrincipal(autre.id, () => modifierCommentaire(c.id, { statut: 'PUBLIE' })),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }),
  )
})
