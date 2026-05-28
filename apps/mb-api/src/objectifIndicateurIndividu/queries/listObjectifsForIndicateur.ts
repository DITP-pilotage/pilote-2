import {
  type ListObjectifsForIndicateurQuery,
  type ObjectifIndicateurIndividuApiModel,
  type ObjectifIndicateurIndividuListApiModel,
} from '@pilote/mb-shared/objectifIndicateurIndividu'
import { type DateTrunc } from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  getFonctionAgregationActive,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'

const DEFAULT_DATE_TRUNC: DateTrunc = 'year'

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
  const cibles = await loadIndividusParPublicId(params.individus)
  if (cibles.length === 0) return { items: [] }

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const { ctx } = await loadResolveObjectifContext({
    indicateurId: indicateur.id,
    cibles,
    dateTrunc,
  })

  const cache = new Map<string, ReadonlyMap<string, Decimal>>()
  const items: ObjectifIndicateurIndividuApiModel[] = []

  for (const cible of cibles) {
    const fonctionActive = getFonctionAgregationActive(cible.id, ctx)
    const objectifs = resolveObjectifIndividu(cible.id, ctx, cache)
    for (const [bucket, valeurCible] of objectifs) {
      items.push({
        indicateur: indicateur.publicId,
        individu: cible.publicId,
        dateCible: bucket,
        valeurCible: valeurCible.toNumber(),
        type: fonctionActive !== null ? 'derivee' : 'saisie',
      })
    }
  }

  items.sort((a, b) =>
    a.individu !== b.individu
      ? a.individu.localeCompare(b.individu)
      : a.dateCible.localeCompare(b.dateCible),
  )

  return { items }
}

