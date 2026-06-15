import { AsyncLocalStorage } from 'node:async_hooks'

import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import type { ApiKeyRole } from '@/generated/prisma/enums'

export type UtilisateurAuthentifie = {
  id: string
  email: string
  prenom: string
  nom: string
}

export type ApiKeyAuthentifiee = {
  id: string
  label: string
  role: ApiKeyRole
}

export type Principal =
  | { kind: 'user'; user: UtilisateurAuthentifie }
  | { kind: 'apiKey'; apiKey: ApiKeyAuthentifiee }

type Store = { principal: Principal | null }

const storage = new AsyncLocalStorage<Store>()

export const runWithPrincipal = <T>(principal: Principal | null, fn: () => T): T =>
  storage.run({ principal }, fn)

export const getCurrentPrincipal = (): Principal | null => storage.getStore()?.principal ?? null

export const requirePrincipal = (): Principal => {
  const principal = getCurrentPrincipal()
  if (!principal) throw new UnauthorizedError('Authentification requise')
  return principal
}

export const requireCurrentPrincipalId = (): string => {
  const principal = requirePrincipal()
  return principal.kind === 'user' ? principal.user.id : principal.apiKey.id
}

export const getCurrentUser = (): UtilisateurAuthentifie | null => {
  const principal = getCurrentPrincipal()
  return principal?.kind === 'user' ? principal.user : null
}

export const requireUser = (): UtilisateurAuthentifie => {
  const user = getCurrentUser()
  if (!user) throw new UnauthorizedError('Authentification requise')
  return user
}
