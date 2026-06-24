import { type NiveauConfianceListApiModel } from '@pilote/mb-shared/commentaire'
import { type PaginateQuery } from '@pilote/mb-shared/pagination'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/commentaire/utils'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

const CONFIANCE_PUBLIE: Prisma.CommentaireWhereInput = {
  statut: 'PUBLIE',
  OR: [
    { indicateurIndividu: { type: 'CONFIANCE' } },
    { panierIndividu: { type: 'CONFIANCE' } },
    { panier: { type: 'CONFIANCE' } },
  ],
}

export const listerHistoriqueNiveauConfiance = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, query }: { params: P; query: PaginateQuery },
): ResultAsync<NiveauConfianceListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where: Prisma.CommentaireWhereInput = {
    AND: [config.whereLecture(params, principalId), CONFIANCE_PUBLIE],
  }
  const fetchPage = db().commentaire.findMany({
    where,
    orderBy: { id: 'desc' },
    include: niveauConfianceInclude,
    ...buildPaginationArgs(query.cursor, query.pageSize),
  })
  const fetchTotal = db().commentaire.count({ where })
  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toNiveauConfianceApiModel, query.pageSize),
  )
}
