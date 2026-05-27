import {
  type ListObjectifsForIndicateurQuery,
  type ObjectifIndicateurIndividuListApiModel,
} from '@pilote/mb-shared/objectifIndicateurIndividu'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toObjectifIndicateurIndividuApiModel } from '@/objectifIndicateurIndividu/utils'

export const listObjectifsForIndicateur = (
  indicateurPublicId: string,
  params: ListObjectifsForIndicateurQuery,
): ResultAsync<ObjectifIndicateurIndividuListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  ).andThen((indicateur) => ResultAsync.fromSafePromise(buildList({ indicateur, params })))
}

const buildList = async ({
  indicateur,
  params,
}: {
  indicateur: { id: string; publicId: string }
  params: ListObjectifsForIndicateurQuery
}): Promise<ObjectifIndicateurIndividuListApiModel> => {
  const individus = await db().individu.findMany({
    where: { publicId: { in: params.individus } },
    select: { id: true },
  })
  if (individus.length === 0) return { items: [] }

  const individuIds = individus.map((i) => i.id)

  const rows = await db().objectifIndicateurIndividu.findMany({
    where: {
      indicateurId: indicateur.id,
      individuId: { in: individuIds },
    },
    include: {
      indicateur: { select: { publicId: true } },
      individu: { select: { publicId: true } },
    },
    orderBy: [{ individu: { publicId: 'asc' } }, { date: 'asc' }],
  })

  return { items: rows.map(toObjectifIndicateurIndividuApiModel) }
}
