import { ResultAsync } from 'neverthrow'

import type { VerifiedTokenInfo } from '@/authentication/jwks'
import { logger } from '@/framework/logger/logger'
import { prisma } from '@/framework/persistence/prisma'

export type UtilisateurEnregistre = {
  id: string
  email: string
}

export const getUtilisateurByProvider = (
  token: VerifiedTokenInfo,
): ResultAsync<UtilisateurEnregistre | null, never> =>
  ResultAsync.fromSafePromise(resolveUtilisateur(token))

const resolveUtilisateur = async (
  token: VerifiedTokenInfo,
): Promise<UtilisateurEnregistre | null> => {
  const bySub = await prisma.utilisateur.findUnique({
    where: { providerSub: token.providerSub },
    select: { id: true, email: true },
  })
  if (bySub) return bySub

  const byEmail = await prisma.utilisateur.findUnique({
    where: { email: token.email },
    select: { id: true, email: true, providerSub: true },
  })
  if (!byEmail) return null

  if (byEmail.providerSub !== token.providerSub) {
    logger.info(
      {
        event: 'auth.sub.rotated',
        utilisateurId: byEmail.id,
        previousProviderSub: byEmail.providerSub,
        nextProviderSub: token.providerSub,
      },
      'Linked verified email to a new provider sub',
    )
    await prisma.utilisateur.update({
      where: { id: byEmail.id },
      data: { providerSub: token.providerSub },
    })
  }

  return { id: byEmail.id, email: byEmail.email }
}
