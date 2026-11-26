import { describe, expect, it } from 'vitest'

import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { pinIndicateur } from '@/indicateur/commands/pinIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal, runAsUser } from '@/test/runAsPrincipal'

const publicIdsEpingles = async (utilisateurId: string): Promise<string[]> => {
  const epingles = await db().indicateurEpingle.findMany({
    where: { utilisateurId },
    include: { indicateur: true },
  })
  return epingles.map((epingle) => epingle.indicateur.publicId).sort()
}

// Un utilisateur qui a déjà épinglé autant d'indicateurs publics que la limite le permet.
const utilisateurALaLimite = async () => {
  const publicIds = testIndicateurIds(20)
  const utilisateur = await fixtures.utilisateur()
  for (const publicId of publicIds) {
    await fixtures.indicateurEpingle({
      indicateur: { publicId, visibilite: 'PUBLIC' },
      utilisateur: { email: utilisateur.email },
    })
  }
  return { utilisateur, publicIds }
}

describe.concurrent('pinIndicateur', () => {
  it(
    'épingle un indicateur lisible pour l’utilisateur courant',
    integrationTest(async () => {
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: indicateurId, visibilite: 'PUBLIC' })
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () =>
        pinIndicateur({ publicId: indicateurId }),
      )

      expect(result.isOk()).toBe(true)
      expect(await publicIdsEpingles(utilisateur.id)).toEqual([indicateurId])
    }),
  )

  it(
    'accepte d’épingler à nouveau un indicateur déjà épinglé, même à la limite',
    integrationTest(async () => {
      const { utilisateur, publicIds } = await utilisateurALaLimite()

      const result = await runAsUser(utilisateur.id, () =>
        pinIndicateur({ publicId: publicIds[0] }),
      )

      expect(result.isOk()).toBe(true)
      expect(await publicIdsEpingles(utilisateur.id)).toHaveLength(20)
    }),
  )

  it(
    'rejette une épingle au-delà de la limite',
    integrationTest(async () => {
      const { utilisateur } = await utilisateurALaLimite()
      const [enTrop] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: enTrop, visibilite: 'PUBLIC' })

      const result = await runAsUser(utilisateur.id, () => pinIndicateur({ publicId: enTrop }))

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'LIMITE_EPINGLES_ATTEINTE', limite: 20 })
      expect(await publicIdsEpingles(utilisateur.id)).not.toContain(enTrop)
    }),
  )

  it(
    'ne compte pas les épingles sur des indicateurs devenus illisibles',
    integrationTest(async () => {
      const { utilisateur, publicIds } = await utilisateurALaLimite()
      await db().indicateur.update({
        where: { publicId: publicIds[0] },
        data: { visibilite: 'PRIVE' },
      })
      const [nouveau] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: nouveau, visibilite: 'PUBLIC' })

      const result = await runAsUser(utilisateur.id, () => pinIndicateur({ publicId: nouveau }))

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    'lève une 404 sur un indicateur que l’utilisateur ne peut pas lire',
    integrationTest(async () => {
      const [prive] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: prive, visibilite: 'PRIVE' })
      const utilisateur = await fixtures.utilisateur()

      await expect(
        runAsUser(utilisateur.id, () => pinIndicateur({ publicId: prive })),
      ).rejects.toMatchObject({ constructor: Prisma.PrismaClientKnownRequestError, code: 'P2025' })
    }),
  )

  it(
    'rejette une clé API, qui n’a pas d’épingle',
    integrationTest(async () => {
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.indicateur({ publicId: indicateurId, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => pinIndicateur({ publicId: indicateurId })),
      ).rejects.toBeInstanceOf(UnauthorizedError)
    }),
  )
})
