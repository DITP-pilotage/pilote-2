import { runWithPrincipal } from '@/framework/auth/userContext'

export const runAsPrincipal = <T>(principalId: string, fn: () => T): T =>
  runWithPrincipal({ kind: 'apiKey', apiKey: { id: principalId, label: 'test' } }, fn)
