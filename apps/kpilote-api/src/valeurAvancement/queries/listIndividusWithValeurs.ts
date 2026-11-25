import {
  type IndividusWithValeursListApiModel,
  type ListIndividusWithValeursQuery,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { individuInclude } from '@/individu/utils'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndividuAvecValeursApiModel } from '@/valeurAvancement/utils'

type ListIndividusWithValeursParams = {
  indicateurPublicId: string
  query: ListIndividusWithValeursQuery
}

export const listIndividusWithValeurs = ({
  indicateurPublicId,
  query,
}: ListIndividusWithValeursParams): ResultAsync<IndividusWithValeursListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const indicateurFilter = {
    indicateur: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
  }
  const where = {
    valeurs: { some: indicateurFilter },
    ...(query.referentiel ? { referentiel: { publicId: query.referentiel } } : {}),
  }

  const fetchPage = db().individu.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      ...individuInclude,
      valeurs: {
        where: indicateurFilter,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
      },
      _count: { select: { valeurs: { where: indicateurFilter } } },
    },
    ...buildPaginationArgs(query.cursor, query.pageSize),
  })
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuAvecValeursApiModel, query.pageSize),
  )
}
