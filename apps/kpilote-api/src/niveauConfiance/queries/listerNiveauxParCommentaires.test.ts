import { type IndiceConfiance } from '@pilote/kpilote-shared/niveauConfiance'
import { describe, expect, it } from 'vitest'

import {
  creerIndicateurIndividuCommentaire,
  indicateurIndividuConfig,
} from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { listerNiveauxParCommentaires } from '@/niveauConfiance/queries/listerNiveauxParCommentaires'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const creerCommentaireAvecNiveau = async (
  apiKeyId: string,
  params: { indicateurId: string; individuId: string },
  indice: IndiceConfiance,
  statut: 'BROUILLON' | 'PUBLIE' = 'PUBLIE',
): Promise<string> => {
  const commentaire = await runAsPrincipal(apiKeyId, () =>
    creerIndicateurIndividuCommentaire({
      params,
      body: { type: 'CONFIANCE', contenu: '', statut },
    }),
  )
  const commentaireId = commentaire._unsafeUnwrap().id
  await runAsPrincipal(apiKeyId, () => creerNiveauConfiance({ commentaireId, indice }))
  return commentaireId
}

describe.concurrent('listerNiveauxParCommentaires', () => {
  it(
    'renvoie uniquement les niveaux des commentaires demandés',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const params = { indicateurId: indId, individuId: indivId }
      const idA = await creerCommentaireAvecNiveau(moi.id, params, 'OBJECTIF_SECURISE')
      await creerCommentaireAvecNiveau(moi.id, params, 'OBJECTIF_COMPROMIS')

      const result = await runAsPrincipal(moi.id, () =>
        listerNiveauxParCommentaires(indicateurIndividuConfig, {
          params,
          query: { commentaires: [idA] },
        }),
      )

      const page = result._unsafeUnwrap()
      expect(page.total).toBe(1)
      expect(page.items[0]?.commentaire.id).toBe(idA)
    }),
  )

  it(
    "n'expose pas le niveau du brouillon d'un autre auteur, même si l'id est passé",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const autre = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_COMMENT },
        ],
      })
      const params = { indicateurId: indId, individuId: indivId }
      const idAutre = await creerCommentaireAvecNiveau(
        autre.id,
        params,
        'OBJECTIF_COMPROMIS',
        'BROUILLON',
      )

      const result = await runAsPrincipal(moi.id, () =>
        listerNiveauxParCommentaires(indicateurIndividuConfig, {
          params,
          query: { commentaires: [idAutre] },
        }),
      )

      expect(result._unsafeUnwrap().total).toBe(0)
    }),
  )

  it(
    'renvoie une liste vide si aucun commentaire n’est demandé',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const moi = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })

      const result = await runAsPrincipal(moi.id, () =>
        listerNiveauxParCommentaires(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          query: { commentaires: [] },
        }),
      )

      expect(result._unsafeUnwrap().total).toBe(0)
    }),
  )
})
