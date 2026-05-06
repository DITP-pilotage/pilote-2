import {
  type IndividuListApiModel,
  type ListIndividusForReferentielQuery,
} from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { toIndividuApiModel } from '@/individu/utils'

export const listIndividusForReferentiel = (
  referentielPublicId: string,
  params: ListIndividusForReferentielQuery,
): ResultAsync<IndividuListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().referentiel.findUniqueOrThrow({
      where: { publicId: referentielPublicId },
      select: { id: true },
    }),
  ).andThen((referentiel) => {
    const where = {
      referentiels: { some: { referentielId: referentiel.id } },
      ...(params.recherche
        ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
        : {}),
    }

    const fetchPage = db().individu.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { referentiels: { include: { referentiel: { select: { publicId: true } } } } },
      ...buildPaginationArgs(params.cursor, 'publicId'),
    })
    const fetchTotal = db().individu.count({ where })

    return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(
      ([rows, total]) => toPaginatedResponse(rows, total, toIndividuApiModel),
    )
  })
