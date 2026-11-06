import {
  type DimensionListApiModel,
  type ListDimensionsQuery,
} from '@pilote/kpilote-shared/dimension'
import { ResultAsync } from 'neverthrow'

import { dimensionInclude, toDimensionApiModel } from '@/dimension/utils'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

export const listDimensions = (
  params: ListDimensionsQuery,
): ResultAsync<DimensionListApiModel, never> => {
  const where: Prisma.DimensionWhereInput = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' } }
    : {}
  const fetchPage = db().dimension.findMany({
    where,
    orderBy: { id: 'asc' },
    include: dimensionInclude,
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().dimension.count({ where })
  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toDimensionApiModel, params.pageSize),
  )
}
