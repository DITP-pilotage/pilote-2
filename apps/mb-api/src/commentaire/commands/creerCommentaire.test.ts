import { describe, expect, it } from 'vitest'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { indicateurIndividuConfig } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('creerCommentaire', () => {
  it(
    'crée un commentaire DEFAUT rattaché à (indicateur, individu) avec auteur = principal courant',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        creerCommentaire(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { type: 'DEFAUT', contenu: '<p>Hello</p>', statut: 'PUBLIE' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const model = result._unsafeUnwrap()
      expect(model.type).toBe('DEFAUT')
      expect(model.individuId).toBe(indivId)
      expect(model.contenu).toBe('<p>Hello</p>')
      expect(model.auteurCreation.id).toBe(apiKey.id)
      const count = await db().commentaire.count({
        where: { indicateurIndividu: { indicateurId: indicateur.id } },
      })
      expect(count).toBe(1)
    }),
  )

  it(
    'throw ForbiddenError sans permission WRITE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId, visibilite: 'PUBLIC' })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey() // pas de WRITE

      await expect(
        runAsPrincipal(apiKey.id, () =>
          creerCommentaire(indicateurIndividuConfig, {
            params: { indicateurId: indId, individuId: indivId },
            body: { type: 'DEFAUT', contenu: '', statut: 'BROUILLON' },
          }),
        ),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }),
  )

  it(
    'refuse un second brouillon pour le même (scope, auteur) — ConflictError (PIL-1585/1592)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const creerBrouillon = () =>
        runAsPrincipal(apiKey.id, () =>
          creerCommentaire(indicateurIndividuConfig, {
            params: { indicateurId: indId, individuId: indivId },
            body: { type: 'DEFAUT', contenu: '', statut: 'BROUILLON' },
          }),
        )

      const premier = await creerBrouillon()
      expect(premier.isOk()).toBe(true)
      await expect(creerBrouillon()).rejects.toMatchObject({ code: 'CONFLICT' })

      // Un PUBLIE supplémentaire reste autorisé (la contrainte ne vise que les brouillons).
      const publie = await runAsPrincipal(apiKey.id, () =>
        creerCommentaire(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { type: 'DEFAUT', contenu: '<p>ok</p>', statut: 'PUBLIE' },
        }),
      )
      expect(publie.isOk()).toBe(true)
    }),
  )
})
