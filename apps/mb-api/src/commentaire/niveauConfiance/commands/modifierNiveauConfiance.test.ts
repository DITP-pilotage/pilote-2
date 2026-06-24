import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/commentaire/niveauConfiance/commands/modifierNiveauConfiance'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('modifierNiveauConfiance', () => {
  it(
    'change l’indice (append) et le contenu, par l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const cree = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { indice: 'OBJECTIF_COMPROMIS', contenu: '', statut: 'PUBLIE' },
        }),
      )
      const commentaireId = cree._unsafeUnwrap().id

      const result = await runAsPrincipal(apiKey.id, () =>
        modifierNiveauConfiance(commentaireId, { indice: 'OBJECTIF_SECURISE', contenu: '<p>maj</p>' }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().indice).toBe('OBJECTIF_SECURISE')
      const count = await db().niveauConfiance.count({ where: { commentaireId } })
      expect(count).toBe(2) // historique d'indices : 2
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
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const autre = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const cree = await runAsPrincipal(auteur.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { indice: 'OBJECTIF_COMPROMIS', contenu: '', statut: 'PUBLIE' },
        }),
      )

      await expect(
        runAsPrincipal(autre.id, () =>
          modifierNiveauConfiance(cree._unsafeUnwrap().id, { indice: 'OBJECTIF_SECURISE' }),
        ),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }),
  )
})
