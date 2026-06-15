import { requirePrincipal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { ApiKeyRole } from '@/generated/prisma/enums'

// Réserve l'opération aux clés API de rôle ADMIN.
// Les principals utilisateur (OIDC) ne sont pas concernés par ce durcissement.
export const ensureApiKeyAdmin = (): void => {
  const principal = requirePrincipal()
  if (principal.kind === 'user') return
  if (principal.apiKey.role !== ApiKeyRole.ADMIN) {
    throw new ForbiddenError('Cette opération requiert une clé API de rôle ADMIN')
  }
}
