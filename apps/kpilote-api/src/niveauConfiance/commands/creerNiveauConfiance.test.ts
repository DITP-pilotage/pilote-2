import { describe, expect, it } from 'vitest'

import { creerIndicateurIndividuCommentaire } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('creerNiveauConfiance', () => {
  it(
    'crée un niveau de confiance attaché à un commentaire CONFIANCE existant',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const params = { indicateurId: indId, individuId: indivId }
      const commentaire = await runAsPrincipal(apiKey.id, () =>
        creerIndicateurIndividuCommentaire({
          params,
          body: { type: 'CONFIANCE', contenu: '<p>OK</p>', statut: 'PUBLIE' },
        }),
      )

      const result = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance({
          commentaireId: commentaire._unsafeUnwrap().id,
          indice: 'OBJECTIF_SECURISE',
        }),
      )

      expect(result.isOk()).toBe(true)
      const model = result._unsafeUnwrap()
      expect(model.indice).toBe('OBJECTIF_SECURISE')
      expect(model.commentaire.type).toBe('CONFIANCE')
      expect(model.commentaire.contenu).toBe('<p>OK</p>')
    }),
  )

  it(
    'refuse si le commentaire n’est pas de type CONFIANCE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const commentaire = await runAsPrincipal(apiKey.id, () =>
        creerIndicateurIndividuCommentaire({
          params: { indicateurId: indId, individuId: indivId },
          body: { type: 'DEFAUT', contenu: '', statut: 'PUBLIE' },
        }),
      )

      await expect(
        runAsPrincipal(apiKey.id, () =>
          creerNiveauConfiance({
            commentaireId: commentaire._unsafeUnwrap().id,
            indice: 'OBJECTIF_COMPROMIS',
          }),
        ),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    }),
  )

  it(
    'autorise plusieurs niveaux de confiance sur le même commentaire (historique d’indices)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const commentaire = await runAsPrincipal(apiKey.id, () =>
        creerIndicateurIndividuCommentaire({
          params: { indicateurId: indId, individuId: indivId },
          body: { type: 'CONFIANCE', contenu: '', statut: 'PUBLIE' },
        }),
      )
      const commentaireId = commentaire._unsafeUnwrap().id
      const premier = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance({ commentaireId, indice: 'OBJECTIF_COMPROMIS' }),
      )
      const second = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance({ commentaireId, indice: 'OBJECTIF_SECURISE' }),
      )

      expect(premier._unsafeUnwrap().id).not.toBe(second._unsafeUnwrap().id)
      expect(second._unsafeUnwrap().indice).toBe('OBJECTIF_SECURISE')
    }),
  )
})
