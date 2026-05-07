import { ResultAsync } from 'neverthrow'

import { prisma } from '@/framework/persistence/prisma'

export type UtilisateurEnregistre = {
  id: string
  providerSub: string
  providerType: 'keycloak'
}

export const getUtilisateurByProvider = (params: {
  providerSub: string
  providerType: 'keycloak'
}): ResultAsync<UtilisateurEnregistre | null, never> =>
  ResultAsync.fromSafePromise(
    prisma.utilisateur.findUnique({
      where: {
        utilisateur_provider_sub_type_unique: {
          providerSub: params.providerSub,
          providerType: params.providerType,
        },
      },
      select: { id: true, providerSub: true, providerType: true },
    }),
  )
