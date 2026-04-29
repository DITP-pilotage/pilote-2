import { ResultAsync } from 'neverthrow'

import { prisma } from '@/framework/persistence/prisma.js'

export type HealthStatus = { status: 'ok'; database: 'ok' }
export type HealthError = { status: 'error'; database: 'error'; cause: unknown }

export const getHealth = (): ResultAsync<HealthStatus, HealthError> =>
  ResultAsync.fromPromise(prisma.$queryRaw`SELECT 1`, (cause) => ({
    status: 'error' as const,
    database: 'error' as const,
    cause,
  })).map(() => ({ status: 'ok' as const, database: 'ok' as const }))
