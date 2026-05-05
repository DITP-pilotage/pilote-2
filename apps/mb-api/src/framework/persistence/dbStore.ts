import { AsyncLocalStorage } from 'node:async_hooks'

import { type prisma } from '@/framework/persistence/prisma'

export type DbClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

const storage = new AsyncLocalStorage<DbClient>()

export const db = (): DbClient => {
  const client = storage.getStore()
  if (!client) {
    throw new Error(
      'dbStore is empty — wrap the call site with withAppDatabase or withTransaction',
    )
  }
  return client
}

export const runWithDb = <T>(client: DbClient, fn: () => Promise<T> | T): Promise<T> | T =>
  storage.run(client, fn)
