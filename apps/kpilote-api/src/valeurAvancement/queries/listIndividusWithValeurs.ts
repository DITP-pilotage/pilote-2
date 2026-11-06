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

export const listIndividusWithValeurs = (
  indicateurPublicId: string,
  params: ListIndividusWithValeursQuery,
): ResultAsync<IndividusWithValeursListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const indicateurFilter = {
    indicateur: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
  }
  // Les valeurs sont portées par des cellules : un individu « a des valeurs » s'il
  // est coordonnée d'au moins une cellule valorisée (en mono-dimension, sa
  // cellule est lui-même : comportement identique). En multi-dimension, le
  // décompte est brut sur toutes les cellules qui le contiennent.
  const valeursDeLIndividu = (individuId: string) => ({
    ...indicateurFilter,
    cellule: { coordonnees: { some: { individuId } } },
  })
  const where = {
    coordonnees: { some: { cellule: { valeurs: { some: indicateurFilter } } } },
    ...(params.referentiel ? { referentiel: { publicId: params.referentiel } } : {}),
  }

  const fetchPage = db()
    .individu.findMany({
      where,
      orderBy: { id: 'asc' },
      include: individuInclude,
      ...buildPaginationArgs(params.cursor, params.pageSize),
    })
    .then((rows) =>
      Promise.all(
        rows.map(async (row) => {
          const [valeurs, nombre] = await Promise.all([
            db().valeurAvancement.findMany({
              where: valeursDeLIndividu(row.id),
              orderBy: [{ date: 'desc' }, { id: 'desc' }],
              take: 1,
            }),
            db().valeurAvancement.count({ where: valeursDeLIndividu(row.id) }),
          ])
          return { ...row, valeurs, _count: { valeurs: nombre } }
        }),
      ),
    )
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuAvecValeursApiModel, params.pageSize),
  )
}
