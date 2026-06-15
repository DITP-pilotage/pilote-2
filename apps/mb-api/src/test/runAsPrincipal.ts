import { runWithPrincipal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

// Défaut CONTRIBUTOR : reflète le défaut de la colonne `role` en base (moindre
// privilège). Utiliser runAsAdmin pour les opérations de gestion réservées aux
// clés ADMIN, afin que chaque test déclare explicitement son niveau de droit.
export const runAsPrincipal = <T>(
  principalId: string,
  fn: () => T,
  role: ApiKeyRole = ApiKeyRole.CONTRIBUTOR,
): T => runWithPrincipal({ kind: 'apiKey', apiKey: { id: principalId, label: 'test', role } }, fn)

export const runAsAdmin = <T>(principalId: string, fn: () => T): T =>
  runAsPrincipal(principalId, fn, ApiKeyRole.ADMIN)

export const runAsContributor = <T>(principalId: string, fn: () => T): T =>
  runAsPrincipal(principalId, fn, ApiKeyRole.CONTRIBUTOR)

export const runAsUser = <T>(userId: string, fn: () => T): T =>
  runWithPrincipal(
    { kind: 'user', user: { id: userId, email: 'test@example.com', prenom: 'Test', nom: 'User' } },
    fn,
  )
