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
  const byIdentite = await prisma.identiteExterne.findUnique({
    where: {
      provider_providerSub: { provider: token.provider, providerSub: token.providerSub },
    },
    select: { utilisateur: { select: { id: true, email: true } } },
  })
  if (byIdentite) return byIdentite.utilisateur

  // Pre-provisioning : l'admin a créé le compte avec l'email uniquement.
  // On lie l'identité IdP au premier login.
  const byEmail = await prisma.utilisateur.findUnique({
    where: { email: token.email },
    select: { id: true, email: true },
  })
  if (!byEmail) return null

  logger.info(
    {
      event: 'auth.identite.linked',
      utilisateurId: byEmail.id,
      provider: token.provider,
    },
    'Linked IdP identity to pre-provisioned account',
  )
  await prisma.identiteExterne.create({
    data: { provider: token.provider, providerSub: token.providerSub, utilisateurId: byEmail.id },
  })

  return { id: byEmail.id, email: byEmail.email }
}
