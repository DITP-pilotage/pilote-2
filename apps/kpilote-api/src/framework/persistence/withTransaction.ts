import { err, ok, ResultAsync } from 'neverthrow'

import { db, runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'

// Porte l'erreur d'un `Result` jusqu'à `$transaction`, qui n'annule que sur une exception.
class RollbackSignal extends Error {
  constructor(readonly error: unknown) {
    super('Transaction annulée : le Result est en erreur')
  }
}

/**
 * Transaction pour du code qui ne passe pas par un `Result` (tests, assistant) : elle
 * n'est annulée que si `fn` lève une exception.
 */
export const runInTransaction = <T>(fn: () => Promise<T>): Promise<T> =>
  prisma.$transaction(async (tx) => runWithDb(tx, fn) as Promise<T>, { timeout: 30_000 })

/**
 * Exécute `fn` dans une transaction : commit sur `ok`, rollback sur `err` comme sur une
 * exception. L'erreur du `Result` est rendue telle quelle à l'appelant ; une exception
 * continue jusqu'au gestionnaire d'erreurs global.
 */
export const withTransaction = <T, E>(fn: () => ResultAsync<T, E>): ResultAsync<T, E> =>
  new ResultAsync(
    runInTransaction(async () => {
      const result = await fn()
      if (result.isErr()) throw new RollbackSignal(result.error)
      return result.value
    }).then(
      (value) => ok<T, E>(value),
      (error: unknown) => {
        if (error instanceof RollbackSignal) return err<T, E>(error.error as E)
        throw error
      },
    ),
  )

/**
 * Comme `runInTransaction`, mais rejoint la transaction en cours s'il y en a une (un client
 * de transaction n'a pas de `$transaction`) : les tests en rollback voient alors l'écriture.
 */
export const withinTransaction = <T>(fn: () => Promise<T>): Promise<T> =>
  '$transaction' in db() ? runInTransaction(fn) : fn()
