import {
  type ListObjectifsForIndicateurQuery,
  type ObjectifIndicateurIndividuApiModel,
  type ObjectifIndicateurIndividuListApiModel,
} from '@pilote/mb-shared/objectifIndicateurIndividu'
import { type DateTrunc } from '@pilote/mb-shared/dates'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'

// Granularité annuelle par défaut : reproduit le comportement de pilote-ppg
// où les objectifs sont saisis à l'année.
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
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const { ctx } = await loadResolveObjectifContext({
    indicateurId: indicateur.id,
    cibles: individusCibles,
    dateTrunc,
  })

  const cache = new Map<string, ReadonlyMap<string, PointObjectifInterne>>()
  const items: ObjectifIndicateurIndividuApiModel[] = []

  for (const individuCible of individusCibles) {
    const objectifs = resolveObjectifIndividu(individuCible.id, ctx, cache)
    for (const [bucket, point] of objectifs) {
      items.push(
        toApiModel({ indicateurPublicId: indicateur.publicId, individuCible, bucket, point }),
      )
    }
  }

  items.sort((a, b) =>
    a.individu !== b.individu
      ? a.individu.localeCompare(b.individu)
      : a.dateCible.localeCompare(b.dateCible),
  )

  return { items }
}

const toApiModel = ({
  indicateurPublicId,
  individuCible,
  bucket,
  point,
}: {
  indicateurPublicId: string
  individuCible: { id: string; publicId: string }
  bucket: string
  point: PointObjectifInterne
}): ObjectifIndicateurIndividuApiModel => {
  if (point.type === 'saisie') {
    return {
      indicateur: indicateurPublicId,
      individu: individuCible.publicId,
      dateCible: bucket,
      valeurCible: point.valeur.toNumber(),
      type: 'saisie',
    }
  }
  return {
    indicateur: indicateurPublicId,
    individu: individuCible.publicId,
    dateCible: bucket,
    valeurCible: point.valeur.toNumber(),
    type: 'derivee',
    fonctionAgregation: point.fonctionAgregation,
    contributions: point.contributions.map((c) => ({
      individu: c.individuPublicId,
      valeurCible: c.valeur.toNumber(),
      dateCible: c.dateCible,
      source: c.estAgregee ? ('derivee' as const) : ('saisie' as const),
    })),
  }
}
