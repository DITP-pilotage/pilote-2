import { describe, expect, it } from 'vitest'

import {
  creerIndicateurIndividuCommentaire,
  indicateurIndividuConfig,
} from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { PermissionAction } from '@/generated/prisma/enums'
import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { getNiveauConfianceCourant } from '@/niveauConfiance/queries/getNiveauConfianceCourant'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

import type { IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

const creerNcSur = async (
  apiKeyId: string,
  params: { indicateurId: string; individuId: string },
  indice: IndiceConfiance,
) => {
  const commentaire = await runAsPrincipal(apiKeyId, () =>
    creerIndicateurIndividuCommentaire({
      params,
      body: { type: 'CONFIANCE', contenu: '', statut: 'PUBLIE' },
    }),
  )
  return runAsPrincipal(apiKeyId, () =>
    creerNiveauConfiance({
      commentaireId: commentaire._unsafeUnwrap().id,
      indice,
    }),
  )
}

describe.concurrent('getNiveauConfianceCourant', () => {
  it(
    'retourne le dernier niveau de confiance publié du scope',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      for (const indice of ['OBJECTIF_COMPROMIS', 'OBJECTIF_SECURISE'] as const) {
        await creerNcSur(apiKey.id, params, indice)
      }

      const result = await runAsPrincipal(apiKey.id, () =>
        getNiveauConfianceCourant(indicateurIndividuConfig, { params }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().indice).toBe('OBJECTIF_SECURISE')
    }),
  )

  it(
    'throw 404 (ENTITY_NOT_FOUND) si aucun niveau publié',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          getNiveauConfianceCourant(indicateurIndividuConfig, {
            params: { indicateurId: indId, individuId: indivId },
          }),
        ),
      ).rejects.toMatchObject({ code: 'P2025' })
    }),
  )
})
