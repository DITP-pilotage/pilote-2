import { describe, expect, it } from 'vitest'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { indicateurIndividuConfig } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerCommentaires', () => {
  it(
    'liste les commentaires du scope en antichronologique, filtrés par type=DEFAUT',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        contenu: '<p>Premier</p>',
        contenuTexte: 'Premier',
        type: 'DEFAUT',
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        contenu: '<p>Confiance</p>',
        contenuTexte: 'Confiance',
        type: 'CONFIANCE',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listerCommentaires(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          query: { type: 'DEFAUT' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const page = result._unsafeUnwrap()
      expect(page.total).toBe(1)
      expect(page.items.map((c) => c.contenu)).toEqual(['<p>Premier</p>'])
    }),
  )

  it(
    'filtre explicitement par type=CONFIANCE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        type: 'DEFAUT',
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        contenuTexte: 'Conf',
        type: 'CONFIANCE',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listerCommentaires(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          query: { type: 'CONFIANCE' },
        }),
      )

      expect(result._unsafeUnwrap().total).toBe(1)
      expect(result._unsafeUnwrap().items[0]?.type).toBe('CONFIANCE')
    }),
  )

  it(
    'ne renvoie que les publiés (les brouillons sont exclus, même les miens)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })
      const scope = { indicateur: { publicId: indId }, individu: { publicId: indivId } }
      await fixtures.commentaire({ ...scope, createdBy: moi.id, type: 'DEFAUT', statut: 'PUBLIE' })
      await fixtures.commentaire({
        ...scope,
        createdBy: moi.id,
        type: 'DEFAUT',
        statut: 'BROUILLON',
      })

      const result = await runAsPrincipal(moi.id, () =>
        listerCommentaires(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          query: { type: 'DEFAUT' },
        }),
      )

      const page = result._unsafeUnwrap()
      expect(page.total).toBe(1)
      expect(page.items.every((c) => c.statut === 'PUBLIE')).toBe(true)
    }),
  )
})
