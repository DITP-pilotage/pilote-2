import { type DateTrunc } from '@pilote/mb-shared/dates'
import {
  type ListTauxProgressionQuery,
  type TauxProgressionListApiModel,
  type TauxProgressionPointApiModel,
} from '@pilote/mb-shared/tauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type BucketKey, compareBuckets, formatBucket, parseBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import {
  type ObjectifBrut,
  resolveTauxProgression,
  type ValeurBrute,
} from '@/tauxProgression/resolveTauxProgression'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'

// Défauts compromis lisibilité × coût : mensuel des deux côtés (cf. doc archi
// `taux-progression.md`). Surchargeable par requête, avec la contrainte
// `dateTruncObjectif >= dateTruncValeur` (validée côté schema mb-shared) — un
// objectif qui change plus souvent que les mesures n'a pas de sens.
const DEFAULT_DATE_TRUNC_VALEUR: DateTrunc = 'month'
const DEFAULT_DATE_TRUNC_OBJECTIF: DateTrunc = 'month'

export const listTauxProgressionForIndicateur = (
  indicateurPublicId: string,
  params: ListTauxProgressionQuery,
): ResultAsync<TauxProgressionListApiModel, never> => {
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
  params: ListTauxProgressionQuery
}): Promise<TauxProgressionListApiModel> => {
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTruncValeur = params.dateTruncValeur ?? DEFAULT_DATE_TRUNC_VALEUR
  const dateTruncObjectif = params.dateTruncObjectif ?? DEFAULT_DATE_TRUNC_OBJECTIF
  const startedAt = performance.now()
  const [{ ctx: serieCtx, allNodes }, { ctx: objectifCtx }] = await Promise.all([
    loadResolveSerieContext({
      indicateurId: indicateur.id,
      cibles: individusCibles,
      dateTrunc: dateTruncValeur,
    }),
    loadResolveObjectifContext({
      indicateurId: indicateur.id,
      cibles: individusCibles,
      dateTrunc: dateTruncObjectif,
    }),
  ])
  const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
  const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()

  const valeurs: ValeurBrute[] = []
  const objectifsParIndividu = new Map<string, ObjectifBrut[]>()

  for (const cible of individusCibles) {
    const serie = await resolveSerieIndividu(cible.id, serieCtx, serieCache)
    for (const point of serie) {
      valeurs.push(toValeurBrute({ cible, point }))
    }

    const objectifsMap = resolveObjectifIndividu(cible.id, objectifCtx, objectifCache)
    const objectifsList = toObjectifBruts(objectifsMap)
    if (objectifsList.length > 0) {
      objectifsParIndividu.set(cible.id, objectifsList)
    }
  }

  const points = resolveTauxProgression({ valeurs, objectifsParIndividu })

  // Filtres dateDebut/dateFin appliqués en sortie pour ne pas perturber le
  // carry-forward des séries dérivées (cf. design doc indicateur-derives.md).
  const dateDebut = params.dateDebut ? parseBucket(params.dateDebut) : null
  const dateFin = params.dateFin ? parseBucket(params.dateFin) : null
  const filtered = points.filter((p) => {
    if (dateDebut && compareBuckets(p.date, dateDebut) < 0) return false
    if (dateFin && compareBuckets(p.date, dateFin) > 0) return false
    return true
  })

  filtered.sort((a, b) =>
    a.individuPublicId !== b.individuPublicId
      ? a.individuPublicId.localeCompare(b.individuPublicId)
      : compareBuckets(a.date, b.date),
  )

  const items: TauxProgressionPointApiModel[] = filtered.map((p) => ({
    indicateur: indicateur.publicId,
    individu: p.individuPublicId,
    date: formatBucket(p.date),
    valeur: p.valeur.toNumber(),
    valeurCible: p.valeurCible.toNumber(),
    dateCible: formatBucket(p.dateCible),
    tauxProgression: p.tauxProgression,
  }))

  logger.info(
    {
      event: 'tauxProgression.listTauxProgressionForIndicateur.timing',
      indicateurId: indicateur.id,
      dateTruncValeur,
      dateTruncObjectif,
      nbCibles: individusCibles.length,
      nbNodes: allNodes.size,
      nbPoints: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listTauxProgressionForIndicateur computed',
  )
  return { items }
}

const toValeurBrute = ({
  cible,
  point,
}: {
  cible: IndividuRef
  point: PointInterne
}): ValeurBrute => ({
  individuId: cible.id,
  individuPublicId: cible.publicId,
  date: point.bucket,
  valeur: point.valeur,
})

const toObjectifBruts = (
  objectifsMap: ReadonlyMap<BucketKey, PointObjectifInterne>,
): ObjectifBrut[] =>
  [...objectifsMap.values()]
    .map((point) => ({ dateCible: point.bucket, valeurCible: point.valeur }))
    .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
