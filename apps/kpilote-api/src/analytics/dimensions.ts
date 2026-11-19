import {
  type AnalyticsDimension,
  type UpsertAnalyticsDimensionBody,
} from '@pilote/kpilote-shared/analytics/dimensions'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'

const select = { cle: true, slot: true, nom: true } as const

export const listDimensions = (): Promise<AnalyticsDimension[]> =>
  db().analyticsDimension.findMany({ select, orderBy: { slot: 'asc' } })

// `cle` vaut null quand la clé qui a pris le numéro n'est pas connue (écriture concurrente).
export type UpsertDimensionError = {
  type: 'DIMENSION_DEJA_ASSOCIEE'
  slot: number
  cle: string | null
}

const performUpsert = async (
  cle: string,
  body: UpsertAnalyticsDimensionBody,
): Promise<Result<AnalyticsDimension, UpsertDimensionError>> => {
  const taken = await db().analyticsDimension.findFirst({
    where: { slot: body.slot, NOT: { cle } },
    select: { cle: true },
  })
  if (taken) return err({ type: 'DIMENSION_DEJA_ASSOCIEE', slot: body.slot, cle: taken.cle })
  try {
    const dimension = await db().analyticsDimension.upsert({
      where: { cle },
      update: body,
      create: { cle, ...body },
      select,
    })
    return ok(dimension)
  } catch (error) {
    // Une autre clé a pris le numéro entre la vérification et l'écriture.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return err({ type: 'DIMENSION_DEJA_ASSOCIEE', slot: body.slot, cle: null })
    }
    throw error
  }
}

export const upsertDimension = (
  cle: string,
  body: UpsertAnalyticsDimensionBody,
): ResultAsync<AnalyticsDimension, UpsertDimensionError> =>
  new ResultAsync(performUpsert(cle, body))

export const deleteDimension = async (cle: string): Promise<void> => {
  await db().analyticsDimension.delete({ where: { cle } })
}
