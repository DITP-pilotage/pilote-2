import { db, runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'

export const withTransaction = <T>(fn: () => Promise<T>): Promise<T> =>
  prisma.$transaction(async (tx) => runWithDb(tx, fn) as Promise<T>, { timeout: 30_000 })

/**
 * Comme `withTransaction`, mais rejoint la transaction en cours s'il y en a une (un client
 * de transaction n'a pas de `$transaction`) : les tests en rollback voient alors l'écriture.
 */
export const withinTransaction = <T>(fn: () => Promise<T>): Promise<T> =>
  '$transaction' in db() ? withTransaction(fn) : fn()
