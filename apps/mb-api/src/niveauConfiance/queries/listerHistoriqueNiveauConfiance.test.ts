import { describe, expect, it } from 'vitest'

import {
  creerIndicateurIndividuCommentaire,
  indicateurIndividuConfig,
} from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { PermissionAction } from '@/generated/prisma/enums'
import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { listerHistoriqueNiveauConfiance } from '@/niveauConfiance/queries/listerHistoriqueNiveauConfiance'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

import type { IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

const creerNcSur = async (
  apiKeyId: string,
  params: { indicateurId: string; individuId: string },
  indice: IndiceConfiance,
  statut: 'BROUILLON' | 'PUBLIE' = 'PUBLIE',
) => {
  const commentaire = await runAsPrincipal(apiKeyId, () =>
    creerIndicateurIndividuCommentaire({
      params,
      body: { type: 'CONFIANCE', contenu: '', statut },
    }),
  )
  return runAsPrincipal(apiKeyId, () =>
    creerNiveauConfiance({
      commentaireId: commentaire._unsafeUnwrap().id,
      indice,
    }),
  )
}

describe.concurrent('listerHistoriqueNiveauConfiance', () => {
  it(
    'liste les niveaux de confiance en antichronologique',
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
        await creerNcSur(apiKey.id, params, indice)
      }

      const result = await runAsPrincipal(apiKey.id, () =>
        listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query: {} }),
      )

      expect(result._unsafeUnwrap().total).toBe(2)
      expect(result._unsafeUnwrap().items[0]?.indice).toBe('OBJECTIF_ATTEIGNABLE')
    }),
  )

  it(
    'liste aussi les niveaux des commentaires en brouillon',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      await creerNcSur(apiKey.id, params, 'OBJECTIF_SECURISE', 'PUBLIE')
      await creerNcSur(apiKey.id, params, 'OBJECTIF_COMPROMIS', 'BROUILLON')

      const result = await runAsPrincipal(apiKey.id, () =>
        listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query: {} }),
      )

      const indices = result._unsafeUnwrap().items.map((niveau) => niveau.indice)
      expect(indices).toContain('OBJECTIF_COMPROMIS')
      expect(indices).toContain('OBJECTIF_SECURISE')
    }),
  )

  it(
    "n'inclut pas les niveaux des brouillons d'autres auteurs",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const autre = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      await creerNcSur(moi.id, params, 'OBJECTIF_SECURISE', 'PUBLIE')
      await creerNcSur(autre.id, params, 'OBJECTIF_COMPROMIS', 'BROUILLON')

      const result = await runAsPrincipal(moi.id, () =>
        listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query: {} }),
      )

      const indices = result._unsafeUnwrap().items.map((niveau) => niveau.indice)
      expect(indices).toContain('OBJECTIF_SECURISE')
      expect(indices).not.toContain('OBJECTIF_COMPROMIS')
    }),
  )
})
