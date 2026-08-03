import { describe, expect, it } from 'vitest'

import { getDernierBrouillon } from '@/commentaire/queries/getDernierBrouillon'
import { indicateurIndividuConfig } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getDernierBrouillon', () => {
  it(
    'renvoie mon brouillon du type, jamais celui des autres ni un publié',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })
      const autre = await fixtures.apiKey({ permissions: [] })
      const scope = { indicateur: { publicId: indId }, individu: { publicId: indivId } }
      await fixtures.commentaire({
        ...scope,
        createdBy: moi.id,
        type: 'DEFAUT',
        statut: 'BROUILLON',
        contenu: '<p>Mon brouillon</p>',
        contenuTexte: 'Mon brouillon',
      })
      await fixtures.commentaire({
        ...scope,
        createdBy: autre.id,
        type: 'DEFAUT',
        statut: 'BROUILLON',
      })
      await fixtures.commentaire({ ...scope, createdBy: moi.id, type: 'DEFAUT', statut: 'PUBLIE' })

      const result = await runAsPrincipal(moi.id, () =>
        getDernierBrouillon(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          query: { type: 'DEFAUT' },
        }),
      )

      expect(result._unsafeUnwrap()?.contenu).toBe('<p>Mon brouillon</p>')
    }),
  )

  it(
    'renvoie null quand je n’ai pas de brouillon',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: moi.id,
        type: 'DEFAUT',
        statut: 'PUBLIE',
      })

      const result = await runAsPrincipal(moi.id, () =>
        getDernierBrouillon(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          query: { type: 'DEFAUT' },
        }),
      )

      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )
})
