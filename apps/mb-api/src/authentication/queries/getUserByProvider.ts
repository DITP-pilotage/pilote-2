import { ResultAsync } from 'neverthrow'

import { prisma } from '@/framework/persistence/prisma'

export type AuthenticatedUser = {
  id: string
  providerSub: string
  providerType: 'keycloak'
}

export const getUserByProvider = (params: {
  providerSub: string
  providerType: 'keycloak'
}): ResultAsync<AuthenticatedUser | null, never> =>
  ResultAsync.fromSafePromise(
    prisma.user.findUnique({
      where: {
        user_provider_sub_type_unique: {
          providerSub: params.providerSub,
          providerType: params.providerType,
        },
      },
      select: { id: true, providerSub: true, providerType: true },
    }),
  )
