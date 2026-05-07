import { AsyncLocalStorage } from 'node:async_hooks'

import type { UtilisateurEnregistre } from '@/authentication/queries/getUtilisateurByProvider'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'

export type UtilisateurAuthentifie = UtilisateurEnregistre & {
  prenom: string | undefined
  nom: string | undefined
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
