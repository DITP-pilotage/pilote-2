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
    where: {
      utilisateur_provider_sub_type_unique: {
        providerSub: token.providerSub,
        providerType: token.providerType,
      },
    },
    select: { id: true, email: true },
  })
  if (bySub) return bySub

  const byEmail = await prisma.utilisateur.findUnique({
    where: { email: token.email },
    select: { id: true, email: true, providerSub: true, providerType: true },
  })
  if (!byEmail) return null

  if (byEmail.providerSub !== token.providerSub || byEmail.providerType !== token.providerType) {
    logger.info(
      {
        event: 'auth.sub.rotated',
        utilisateurId: byEmail.id,
        previousProviderSub: byEmail.providerSub,
        previousProviderType: byEmail.providerType,
        nextProviderSub: token.providerSub,
        nextProviderType: token.providerType,
      },
      'Linked verified email to a new provider sub',
    )
    await prisma.utilisateur.update({
      where: { id: byEmail.id },
      data: { providerSub: token.providerSub, providerType: token.providerType },
    })
  }

  return { id: byEmail.id, email: byEmail.email }
}
