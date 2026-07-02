import { requirePrincipal, type Principal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { ApiKeyRole } from '@/generated/prisma/enums'

export const isOidcUser = (principal: Principal): boolean => principal.kind === 'user'

export const isApiKey = (principal: Principal): boolean => principal.kind === 'apiKey'

export const isApiKeyAdmin = (principal: Principal): boolean =>
  principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.ADMIN

export const isApiKeyContributor = (principal: Principal): boolean =>
  principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.CONTRIBUTOR

// Transforme un prédicat sur le principal courant en garde d'autorisation.
// Lève UnauthorizedError si aucun principal, ForbiddenError si le prédicat est faux.
export const ensurePrincipal = (
  predicate: (principal: Principal) => boolean,
  message: string,
): void => {
  const principal = requirePrincipal()
  if (!predicate(principal)) throw new ForbiddenError(message)
}
