import {
  type IndividusWithValeursListApiModel,
  type ListIndividusWithValeursQuery,
} from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, encodeCursor, PAGE_SIZE } from '@/framework/persistence/paginate'
import { toIndividuAvecValeursApiModel } from '@/valeurAvancement/utils'

const resolveReferentielId = (
  referentielPublicId: string | undefined,
): ResultAsync<string | null, never> => {
  if (!referentielPublicId) return ResultAsync.fromSafePromise(Promise.resolve(null))
  return ResultAsync.fromSafePromise(
    db().referentiel.findUniqueOrThrow({
      where: { publicId: referentielPublicId },
      select: { id: true },
    }),
  ).map((row) => row.id)
}

export const listIndividusWithValeurs = (
  indicateurPublicId: string,
  params: ListIndividusWithValeursQuery,
): ResultAsync<IndividusWithValeursListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.findUniqueOrThrow({
      where: { publicId: indicateurPublicId },
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    resolveReferentielId(params.referentiel).andThen((referentielId) => {
      const where = {
        valeurs: { some: { indicateurId: indicateur.id } },
        ...(referentielId ? { referentiels: { some: { referentielId } } } : {}),
      }

      const fetchPage = db().individu.findMany({
        where,
        orderBy: { id: 'asc' },
        include: {
          referentiels: {
            include: { referentiel: { select: { publicId: true } } },
          },
          valeurs: {
            where: { indicateurId: indicateur.id },
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
            take: 1,
          },
          _count: {
            select: {
              valeurs: { where: { indicateurId: indicateur.id } },
            },
          },
        },
        ...buildPaginationArgs(params.cursor, 'publicId'),
      })
      const fetchTotal = db().individu.count({ where })

      return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(
        ([rows, total]) => {
          const hasMore = rows.length > PAGE_SIZE
          const trimmedRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows
          const lastRow = trimmedRows[trimmedRows.length - 1]
          const nextCursor = hasMore && lastRow ? encodeCursor(lastRow.publicId) : null
          return {
            items: trimmedRows.map(toIndividuAvecValeursApiModel),
            pagination: { cursor: nextCursor, hasMore },
            total,
          }
        },
      )
    }),
  )
