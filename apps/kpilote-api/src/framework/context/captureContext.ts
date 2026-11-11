import { getCurrentPrincipal, runWithPrincipal } from '@/framework/auth/userContext'
import { db, runWithDb } from '@/framework/persistence/dbStore'

export type RunInContext = <T>(fn: () => Promise<T>) => Promise<T>

/**
 * Capture la base et le principal courants pour les rétablir plus tard. Les outils et les
 * callbacks d'un flux s'exécutent après le dénouement des middlewares : la propagation de
 * l'AsyncLocalStorage n'y est pas garantie. En test, c'est le client transactionnel qui est
 * capturé, ce qui garde ces exécutions dans la transaction du test.
 */
export const captureContext = (): RunInContext => {
  const client = db()
  const principal = getCurrentPrincipal()
  return <T>(fn: () => Promise<T>) =>
    runWithDb(client, () => runWithPrincipal(principal, fn)) as Promise<T>
}
