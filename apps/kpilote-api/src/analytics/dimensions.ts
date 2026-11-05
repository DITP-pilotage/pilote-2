import {
  type AnalyticsDimension,
  type UpsertAnalyticsDimensionBody,
} from '@pilote/kpilote-shared/analytics/dimensions'

import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

const select = { cle: true, slot: true, nom: true } as const

export const listDimensions = (): Promise<AnalyticsDimension[]> =>
  db().analyticsDimension.findMany({ select, orderBy: { slot: 'asc' } })

export const upsertDimension = async (
  cle: string,
  body: UpsertAnalyticsDimensionBody,
): Promise<AnalyticsDimension> => {
  const taken = await db().analyticsDimension.findFirst({
    where: { slot: body.slot, NOT: { cle } },
    select: { cle: true },
  })
  if (taken) {
    throw new ConflictError(`La dimension ${body.slot} est déjà associée à « ${taken.cle} ».`)
  }
  return db().analyticsDimension.upsert({
    where: { cle },
    update: body,
    create: { cle, ...body },
    select,
  })
}

// Clé inconnue : Prisma lève P2025, rendu en 404.
export const deleteDimension = async (cle: string): Promise<void> => {
  await db().analyticsDimension.delete({ where: { cle } })
}
