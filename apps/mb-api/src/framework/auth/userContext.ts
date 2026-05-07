import { AsyncLocalStorage } from 'node:async_hooks'

import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'

export type UtilisateurAuthentifie = {
  id: string
  providerSub: string
  providerType: 'keycloak'
  prenom: string
  nom: string
}

type UserStore = { user: UtilisateurAuthentifie | null }

const storage = new AsyncLocalStorage<UserStore>()

export const runWithUser = <T>(user: UtilisateurAuthentifie | null, fn: () => T): T =>
  storage.run({ user }, fn)

export const getCurrentUser = (): UtilisateurAuthentifie | null =>
  storage.getStore()?.user ?? null

export const requireUser = (): UtilisateurAuthentifie => {
  const user = getCurrentUser()
  if (!user) throw new UnauthorizedError('Authentification requise')
  return user
}
