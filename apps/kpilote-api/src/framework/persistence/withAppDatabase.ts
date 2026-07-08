import { runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'

export const withAppDatabase = <T>(fn: () => Promise<T> | T): Promise<T> | T =>
  runWithDb(prisma, fn)
