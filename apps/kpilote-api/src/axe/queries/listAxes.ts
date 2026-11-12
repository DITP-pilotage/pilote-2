import { type AxeListApiModel, type ListAxesQuery } from '@pilote/kpilote-shared/axe'
import { ResultAsync } from 'neverthrow'

import { axeInclude, toAxeApiModel } from '@/axe/utils'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

export const listAxes = ({
  recherche,
  cursor,
  pageSize,
}: ListAxesQuery): ResultAsync<AxeListApiModel, never> => {
  const where: Prisma.AxeWhereInput = recherche
    ? { nom: { contains: recherche, mode: 'insensitive' } }
    : {}

  const fetchPage = db().axe.findMany({
    where,
    orderBy: { id: 'asc' },
    include: axeInclude,
    ...buildPaginationArgs(cursor, pageSize),
  })
  const fetchTotal = db().axe.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toAxeApiModel, pageSize),
  )
}
