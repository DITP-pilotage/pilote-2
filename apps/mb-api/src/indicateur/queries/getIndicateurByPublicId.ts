import { type IndicateurApiModel } from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { prisma } from '@/framework/persistence/prisma'

export const getIndicateurByPublicId = (publicId: string): ResultAsync<IndicateurApiModel, never> =>
  ResultAsync.fromSafePromise(
    prisma.indicateur.findUniqueOrThrow({
      where: { publicId },
      select: { publicId: true, nom: true, createdAt: true, updatedAt: true },
    }),
  ).map((row) => ({
    id: row.publicId,
    nom: row.nom,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
