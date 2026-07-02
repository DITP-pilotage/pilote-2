import { requirePrincipal, type Principal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'

// Transforme un prédicat sur le principal courant en garde d'autorisation.
// Lève UnauthorizedError si aucun principal, ForbiddenError si le prédicat est faux.
export const ensurePrincipal = (
  predicate: (principal: Principal) => boolean,
  message: string,
): void => {
  const principal = requirePrincipal()
  if (!predicate(principal)) throw new ForbiddenError(message)
}
