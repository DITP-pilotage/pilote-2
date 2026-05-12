import {
  type ListValeursForIndicateurQuery,
  type ValeurAvancementListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { toValeurAvancementApiModel } from '@/valeurAvancement/utils'

const READ_ACTIONS: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

export const listValeursForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): ResultAsync<ValeurAvancementListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: {
        publicId: indicateurPublicId,
        permissions: { some: { principalId, action: { in: READ_ACTIONS } } },
      },
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
}
