import {
  type ListValeursForIndicateurQuery,
  type ValeurAvancementListApiModel,
} from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toValeurAvancementApiModel } from '@/valeurAvancement/utils'

export const listValeursForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): ResultAsync<ValeurAvancementListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.findUniqueOrThrow({
      where: { publicId: indicateurPublicId },
      select: { id: true },
    }),
  ).andThen((indicateur) => {
    const dateRange =
      params.dateDebut || params.dateFin
        ? {
            dateObservation: {
              ...(params.dateDebut ? { gte: params.dateDebut } : {}),
              ...(params.dateFin ? { lte: params.dateFin } : {}),
            },
          }
        : {}

    return ResultAsync.fromSafePromise(
      db().valeurAvancement.findMany({
        where: {
          indicateurId: indicateur.id,
          individu: { publicId: { in: params.individus } },
          ...dateRange,
        },
        orderBy: [{ individuId: 'asc' }, { dateObservation: 'asc' }],
        include: {
          indicateur: { select: { publicId: true } },
          individu: { select: { publicId: true } },
        },
      }),
    ).map((rows) => ({
      items: rows.map(toValeurAvancementApiModel),
    }))
  })
