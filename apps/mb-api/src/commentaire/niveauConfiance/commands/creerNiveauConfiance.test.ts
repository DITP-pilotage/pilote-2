import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { indicateurIndividuConfig } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('creerNiveauConfiance', () => {
  it(
    'crée un commentaire CONFIANCE + son indice',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { indice: 'OBJECTIF_SECURISE', contenu: '<p>OK</p>', statut: 'PUBLIE' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const model = result._unsafeUnwrap()
      expect(model.type).toBe('CONFIANCE')
      expect(model.indice).toBe('OBJECTIF_SECURISE')
      expect(model.contenu).toBe('<p>OK</p>')
    }),
  )

  it(
    'autorise un brouillon de confiance même si un brouillon libre existe (sections séparées)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      // un brouillon LIBRE existant
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        statut: 'BROUILLON',
        type: 'DEFAUT',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { indice: 'OBJECTIF_COMPROMIS', contenu: '', statut: 'BROUILLON' },
        }),
      )

      expect(result.isOk()).toBe(true)
    }),
  )
})
