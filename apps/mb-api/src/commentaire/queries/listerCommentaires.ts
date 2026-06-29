import {
  type CommentaireListApiModel,
  type ListerCommentairesQuery,
} from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { filtreParType } from '@/commentaire/queries/filtres'
import { filtreVisibiliteCommentaire } from '@/commentaire/visibilite'
import { commentaireInclude, toCommentaireApiModel } from '@/commentaire/utils'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

type ListerCommentairesParams<P extends Record<string, string>> = {
  params: P
  query: ListerCommentairesQuery
}

export const listerCommentaires = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, query }: ListerCommentairesParams<P>,
): ResultAsync<CommentaireListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where: Prisma.CommentaireWhereInput = {
    AND: [
      config.whereLecture(params, principalId),
      filtreParType(query.type),
      filtreVisibiliteCommentaire(principalId, 'PUBLIE'),
    ],
  }

  const fetchPage = db().commentaire.findMany({
    where,
    orderBy: { id: 'desc' }, // uuidv7 → antichronologique
    include: commentaireInclude,
    ...buildPaginationArgs(query.cursor, query.pageSize),
  })
  const fetchTotal = db().commentaire.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toCommentaireApiModel, query.pageSize),
  )
}
