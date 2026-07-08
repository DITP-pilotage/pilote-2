import { type DateTrunc } from '@pilote/kpilot-shared/dates'
import {
  type ContributionApiModel,
  type ListValeursForIndicateurQuery,
  type ValeurAvancementApiModel,
  type ValeurAvancementListApiModel,
} from '@pilote/kpilot-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { compareBuckets, formatBucket, parseBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import { type PointInterne, resolveSerieIndividu } from '@/valeurAvancement/resolveSerieIndividu'

// Cap par défaut à la granularité mensuelle : sans troncature, une série France
// avec saisies quotidiennes par département explose (cf. design doc D11).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

export const listValeursForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): ResultAsync<ValeurAvancementListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      buildSeries({ indicateurId: indicateur.id, indicateurPublicId, params }),
    ),
  )
}

// Orchestration en 3 phases : (1) résoudre les cibles publicId→id, (2) charger
// en bulk le contexte de résolution (sous-arbre + saisies tronquées + fonctions
// d'agrégation), (3) calculer les séries en mémoire via le functional core
// mémoïsé. Filtrage dateDebut/dateFin appliqué en sortie. Cf. doc d'archi
// `indicateur-derives.md`.
const buildSeries = async ({
  indicateurId,
  indicateurPublicId,
  params,
}: {
  indicateurId: string
  indicateurPublicId: string
  params: ListValeursForIndicateurQuery
}): Promise<ValeurAvancementListApiModel> => {
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { ctx, allNodes } = await loadResolveSerieContext({
    indicateurId,
    individusCibles: individusCibles,
    dateTrunc,
  })
  const cache = new Map<string, ReadonlyArray<PointInterne>>()

  const dateDebut = params.dateDebut ? parseBucket(params.dateDebut) : null
  const dateFin = params.dateFin ? parseBucket(params.dateFin) : null
  const items: ValeurAvancementApiModel[] = []
  for (const individuCible of individusCibles) {
    const serie = await resolveSerieIndividu(individuCible.id, ctx, cache)
    for (const point of serie) {
      if (dateDebut && compareBuckets(point.bucket, dateDebut) < 0) continue
      if (dateFin && compareBuckets(point.bucket, dateFin) > 0) continue
      items.push(
        toApiModel({ indicateurPublicId, individuPublicId: individuCible.publicId, point }),
      )
    }
  }
  logger.info(
    {
      event: 'valeurAvancement.listValeursForIndicateur.timing',
      indicateurId,
      dateTrunc,
      nbCibles: individusCibles.length,
      nbNodes: allNodes.size,
      nbPoints: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listValeursForIndicateur computed',
  )
  return { items }
}

const toApiModel = ({
  indicateurPublicId,
  individuPublicId,
  point,
}: {
  indicateurPublicId: string
  individuPublicId: string
  point: PointInterne
}): ValeurAvancementApiModel => {
  if (point.type === 'saisie') {
    return {
      indicateur: indicateurPublicId,
      individu: individuPublicId,
      date: formatBucket(point.bucket),
      valeur: point.valeur.toNumber(),
      type: 'saisie',
    }
  }
  const contributions: ContributionApiModel[] = point.contributions.map((c) => ({
    individu: c.individuPublicId,
    valeur: c.valeur === null ? null : c.valeur.toNumber(),
    date: c.dateOrigine === null ? null : formatBucket(c.dateOrigine),
    source: c.source,
  }))
  return {
    indicateur: indicateurPublicId,
    individu: individuPublicId,
    date: formatBucket(point.bucket),
    valeur: point.valeur.toNumber(),
    type: 'derivee',
    fonctionAgregation: point.fonctionAgregation,
    contributions,
    couverture: point.couverture,
  }
}
