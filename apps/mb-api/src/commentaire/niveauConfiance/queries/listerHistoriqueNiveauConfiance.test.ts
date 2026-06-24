import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { listerHistoriqueNiveauConfiance } from '@/commentaire/niveauConfiance/queries/listerHistoriqueNiveauConfiance'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerHistoriqueNiveauConfiance', () => {
  it(
    'liste les niveaux de confiance publiés en antichronologique',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      for (const indice of ['OBJECTIF_COMPROMIS', 'OBJECTIF_ATTEIGNABLE'] as const) {
        await runAsPrincipal(apiKey.id, () =>
          creerNiveauConfiance(indicateurIndividuConfig, {
            params,
            body: { indice, contenu: '', statut: 'PUBLIE' },
          }),
        )
      }

      const result = await runAsPrincipal(apiKey.id, () =>
        listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query: {} }),
      )

      expect(result._unsafeUnwrap().total).toBe(2)
      expect(result._unsafeUnwrap().items[0]?.indice).toBe('OBJECTIF_ATTEIGNABLE') // plus récent d'abord
    }),
  )
})
