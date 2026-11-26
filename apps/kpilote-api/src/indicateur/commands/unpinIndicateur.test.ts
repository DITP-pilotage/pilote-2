import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { unpinIndicateur } from '@/indicateur/commands/unpinIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'
import { runAsUser } from '@/test/runAsPrincipal'

describe.concurrent('unpinIndicateur', () => {
  it(
    'retire l’épingle de l’utilisateur courant et garde celles des autres',
    integrationTest(async () => {
      const [indicateurId] = testIndicateurIds(1)
      const utilisateur = await fixtures.utilisateur()
      const autreUtilisateur = await fixtures.utilisateur()
      await fixtures.indicateurEpingle(
        { indicateur: { publicId: indicateurId }, utilisateur: { email: utilisateur.email } },
        { indicateur: { publicId: indicateurId }, utilisateur: { email: autreUtilisateur.email } },
      )

      const result = await runAsUser(utilisateur.id, () =>
        unpinIndicateur({ publicId: indicateurId }),
      )

      expect(result.isOk()).toBe(true)
      const restantes = await db().indicateurEpingle.findMany({
        where: { indicateur: { publicId: indicateurId } },
      })
      expect(restantes.map((epingle) => epingle.utilisateurId)).toEqual([autreUtilisateur.id])
    }),
  )

  it(
    'retire l’épingle d’un indicateur devenu illisible',
    integrationTest(async () => {
      const [prive] = testIndicateurIds(1)
      const utilisateur = await fixtures.utilisateur()
      await fixtures.indicateurEpingle({
        indicateur: { publicId: prive, visibilite: 'PRIVE' },
        utilisateur: { email: utilisateur.email },
      })

      await runAsUser(utilisateur.id, () => unpinIndicateur({ publicId: prive }))

      expect(await db().indicateurEpingle.count({ where: { utilisateurId: utilisateur.id } })).toBe(
        0,
      )
    }),
  )

  it(
    'ne fait rien sur un indicateur inconnu',
    integrationTest(async () => {
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () =>
        unpinIndicateur({ publicId: 'IND-INCONNU' }),
      )

      expect(result.isOk()).toBe(true)
    }),
  )
})
