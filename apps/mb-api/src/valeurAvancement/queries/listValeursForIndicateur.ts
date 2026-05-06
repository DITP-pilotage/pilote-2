import {
  type ListValeursForIndicateurQuery,
  type ValeurAvancementListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
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
            date: {
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
        orderBy: [{ individuId: 'asc' }, { date: 'asc' }],
        include: {
          indicateur: { select: { publicId: true } },
          individu: { select: { publicId: true } },
        },
      }),
    ).map((rows) => ({
      items: rows.map(toValeurAvancementApiModel),
    }))
  })
