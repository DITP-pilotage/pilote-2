import { type NiveauConfianceListApiModel } from '@pilote/mb-shared/niveauConfiance'
import { type PaginateQuery } from '@pilote/mb-shared/pagination'
import { ResultAsync } from 'neverthrow'

import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

export const listerHistoriqueNiveauConfiance = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, query }: { params: P; query: PaginateQuery },
): ResultAsync<NiveauConfianceListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where: Prisma.NiveauConfianceWhereInput = {
    commentaire: {
      AND: [config.whereLecture(params, principalId), { statut: 'PUBLIE' }],
    },
  }
  const fetchPage = db().niveauConfiance.findMany({
    where,
    orderBy: { id: 'desc' },
    include: niveauConfianceInclude,
    ...buildPaginationArgs(query.cursor, query.pageSize),
  })
  const fetchTotal = db().niveauConfiance.count({ where })
  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toNiveauConfianceApiModel, query.pageSize),
  )
}
