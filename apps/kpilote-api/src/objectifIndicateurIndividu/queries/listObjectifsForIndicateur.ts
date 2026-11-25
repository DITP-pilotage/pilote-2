import {
  type ListObjectifsForIndicateurQuery,
  type ObjectifIndicateurIndividuApiModel,
  type ObjectifIndicateurIndividuListApiModel,
} from '@pilote/kpilote-shared/objectifIndicateurIndividu'
import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Bucket, type BucketKey, compareBuckets, formatBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusByPublicId } from '@/indicateur/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'

const DEFAULT_DATE_TRUNC: DateTrunc = 'year'

type ListObjectifsForIndicateurParams = {
  indicateurPublicId: string
  query: ListObjectifsForIndicateurQuery
}

const performList = async ({
  indicateurPublicId,
  query,
}: ListObjectifsForIndicateurParams): Promise<ObjectifIndicateurIndividuListApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true, publicId: true },
  })
  return buildList({ indicateur, query })
}

export const listObjectifsForIndicateur = (
  params: ListObjectifsForIndicateurParams,
): ResultAsync<ObjectifIndicateurIndividuListApiModel, never> =>
  ResultAsync.fromSafePromise(performList(params))

const buildList = async ({
  indicateur,
  query,
}: {
  indicateur: { id: string; publicId: string }
  query: ListObjectifsForIndicateurQuery
}): Promise<ObjectifIndicateurIndividuListApiModel> => {
  const individusCibles = await loadIndividusByPublicId(query.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTrunc: DateTrunc = query.dateTrunc ?? DEFAULT_DATE_TRUNC
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
    const objectifs = resolveObjectifIndividu({ individuId: individuCible.id, ctx, cache })
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
    contributions: point.contributions.map((contribution) => ({
      individu: contribution.individuPublicId,
      valeurCible: contribution.valeur.toNumber(),
      dateCible: formatBucket(contribution.bucketCible),
      source: contribution.isAgregee ? ('derivee' as const) : ('saisie' as const),
    })),
  }
}
