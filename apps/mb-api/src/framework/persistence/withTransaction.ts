import { runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'

export const withTransaction = <T>(fn: () => Promise<T>): Promise<T> =>
  prisma.$transaction(async (tx) => runWithDb(tx, fn) as Promise<T>, { timeout: 30_000 })
