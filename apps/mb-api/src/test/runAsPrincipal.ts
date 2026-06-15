import { runWithPrincipal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

export const runAsPrincipal = <T>(
  principalId: string,
  fn: () => T,
  role: ApiKeyRole = ApiKeyRole.CONTRIBUTOR,
): T => runWithPrincipal({ kind: 'apiKey', apiKey: { id: principalId, label: 'test', role } }, fn)

export const runAsUser = <T>(userId: string, fn: () => T): T =>
  runWithPrincipal(
    { kind: 'user', user: { id: userId, email: 'test@example.com', prenom: 'Test', nom: 'User' } },
    fn,
  )
