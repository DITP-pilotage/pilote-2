import { AsyncLocalStorage } from 'node:async_hooks'

import type { AuthenticatedUser } from '@/authentication/queries/getUserByProvider'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'

type UserStore = { user: AuthenticatedUser | null }

const storage = new AsyncLocalStorage<UserStore>()

export const runWithUser = <T>(user: AuthenticatedUser | null, fn: () => T): T =>
  storage.run({ user }, fn)

export const getCurrentUser = (): AuthenticatedUser | null =>
  storage.getStore()?.user ?? null

export const requireUser = (): AuthenticatedUser => {
  const user = getCurrentUser()
  if (!user) throw new UnauthorizedError('Authentification requise')
  return user
}
