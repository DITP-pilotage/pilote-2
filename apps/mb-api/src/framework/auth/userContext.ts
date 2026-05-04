import { AsyncLocalStorage } from 'node:async_hooks'

import type { AuthenticatedUser } from '@/authentication/jwks'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'

type UserStore = { user: AuthenticatedUser | undefined }

const storage = new AsyncLocalStorage<UserStore>()

export const runWithUser = <T>(user: AuthenticatedUser | undefined, fn: () => T): T =>
  storage.run({ user }, fn)

export const getCurrentUser = (): AuthenticatedUser | undefined => storage.getStore()?.user

export const requireUser = (): AuthenticatedUser => {
  const user = getCurrentUser()
  if (!user) {
    throw new UnauthorizedError('Authentification requise')
  }
  return user
}
