import {
  type ListObjectifsForIndicateurQuery,
  type ObjectifIndicateurIndividuApiModel,
  type ObjectifIndicateurIndividuListApiModel,
} from '@pilote/mb-shared/objectifIndicateurIndividu'
import { type DateTrunc } from '@pilote/mb-shared/dates'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Bucket, type BucketKey, compareBuckets, formatBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
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
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const { ctx } = await loadResolveObjectifContext({
    indicateurId: indicateur.id,
    individusCibles: individusCibles,
    dateTrunc,
  })

  const cache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()
  // Buckets sortie API : on stocke le `Bucket` (PlainDate) pour le tri puis on
  // sérialise en ISO string juste avant le push.
  type ItemWithBucket = { bucket: Bucket; item: ObjectifIndicateurIndividuApiModel }
  const withBuckets: ItemWithBucket[] = []

  for (const individuCible of individusCibles) {
    const objectifs = resolveObjectifIndividu(individuCible.id, ctx, cache)
    for (const point of objectifs.values()) {
      withBuckets.push({
        bucket: point.bucket,
        item: toApiModel({ indicateurPublicId: indicateur.publicId, individuCible, point }),
      })
    }
  }

  withBuckets.sort((a, b) =>
    a.item.individu !== b.item.individu
      ? a.item.individu.localeCompare(b.item.individu)
      : compareBuckets(a.bucket, b.bucket),
  )

  return { items: withBuckets.map(({ item }) => item) }
}

const toApiModel = ({
  indicateurPublicId,
  individuCible,
  point,
}: {
  indicateurPublicId: string
  individuCible: { id: string; publicId: string }
  point: PointObjectifInterne
}): ObjectifIndicateurIndividuApiModel => {
  if (point.type === 'saisie') {
    return {
      indicateur: indicateurPublicId,
      individu: individuCible.publicId,
      dateCible: formatBucket(point.bucket),
      valeurCible: point.valeur.toNumber(),
      type: 'saisie',
    }
  }
  return {
    indicateur: indicateurPublicId,
    individu: individuCible.publicId,
    dateCible: formatBucket(point.bucket),
    valeurCible: point.valeur.toNumber(),
    type: 'derivee',
    fonctionAgregation: point.fonctionAgregation,
    contributions: point.contributions.map((c) => ({
      individu: c.individuPublicId,
      valeurCible: c.valeur.toNumber(),
      dateCible: formatBucket(c.bucketCible),
      source: c.estAgregee ? ('derivee' as const) : ('saisie' as const),
    })),
  }
}
