import { type IndicateurApiModel } from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { dbStore } from '@/framework/persistence/dbStore'

export const getIndicateurByPublicId = (publicId: string): ResultAsync<IndicateurApiModel, never> =>
  ResultAsync.fromSafePromise(
    dbStore.get().indicateur.findUniqueOrThrow({
      where: { publicId },
      select: { publicId: true, nom: true, createdAt: true, updatedAt: true },
    }),
  ).map((row) => ({
    id: row.publicId,
    nom: row.nom,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
