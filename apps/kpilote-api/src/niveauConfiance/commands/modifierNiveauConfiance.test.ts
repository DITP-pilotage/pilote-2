import { describe, expect, it } from 'vitest'

import { creerIndicateurIndividuCommentaire } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { PermissionAction } from '@/generated/prisma/enums'
import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/niveauConfiance/commands/modifierNiveauConfiance'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const creerNcSur = async ({
  apiKeyId,
  indicateurId,
  individuId,
}: {
  apiKeyId: string
  indicateurId: string
  individuId: string
}) => {
  const commentaire = await runAsPrincipal(apiKeyId, () =>
    creerIndicateurIndividuCommentaire({
      params: { indicateurId, individuId },
      body: { type: 'CONFIANCE', contenu: '', statut: 'PUBLIE' },
    }),
  )
  return runAsPrincipal(apiKeyId, () =>
    creerNiveauConfiance({
      commentaireId: commentaire._unsafeUnwrap().id,
      indice: 'OBJECTIF_COMPROMIS',
    }),
  )
}

describe.concurrent('modifierNiveauConfiance', () => {
  it(
    'change l’indice, par l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE_COMMENT }],
      })
      const cree = await creerNcSur({
        apiKeyId: apiKey.id,
        indicateurId: indId,
        individuId: indivId,
      })
      const niveauConfianceId = cree._unsafeUnwrap().id

      const result = await runAsPrincipal(apiKey.id, () =>
        modifierNiveauConfiance(niveauConfianceId, { indice: 'OBJECTIF_SECURISE' }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().indice).toBe('OBJECTIF_SECURISE')
      expect(result._unsafeUnwrap().id).toBe(niveauConfianceId)
    }),
  )

  it(
    'throw ForbiddenError si le principal n’est pas l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const auteur = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE_COMMENT }],
      })
      const autre = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE_COMMENT }],
      })
      const cree = await creerNcSur({
        apiKeyId: auteur.id,
        indicateurId: indId,
        individuId: indivId,
      })

      await expect(
        runAsPrincipal(autre.id, () =>
          modifierNiveauConfiance(cree._unsafeUnwrap().id, { indice: 'OBJECTIF_SECURISE' }),
        ),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }),
  )
})
