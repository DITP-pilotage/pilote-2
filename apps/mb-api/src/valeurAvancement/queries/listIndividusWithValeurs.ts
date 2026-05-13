import {
  type IndividusWithValeursListApiModel,
  type ListIndividusWithValeursQuery,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndividuAvecValeursApiModel } from '@/valeurAvancement/utils'

export const listIndividusWithValeurs = (
  indicateurPublicId: string,
  params: ListIndividusWithValeursQuery,
): ResultAsync<IndividusWithValeursListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const indicateurFilter = {
    indicateur: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
  }
  const where = {
    valeurs: { some: indicateurFilter },
    ...(params.referentiel ? { referentiel: { publicId: params.referentiel } } : {}),
  }

  const fetchPage = db().individu.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      referentiel: true,
      valeurs: {
        where: indicateurFilter,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
      },
      _count: { select: { valeurs: { where: indicateurFilter } } },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuAvecValeursApiModel, params.pageSize),
  )
}
