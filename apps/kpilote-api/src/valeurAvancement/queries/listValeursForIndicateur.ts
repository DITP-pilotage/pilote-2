import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type ContributionApiModel,
  type ListValeursForIndicateurQuery,
  type ValeurAvancementApiModel,
  type ValeurAvancementListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { type Selection } from '@/axe/modalites'
import { type ResolveSelectionError, resolveSelection } from '@/axe/resolveSelection'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { compareBuckets, formatBucket, parseBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import { type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'

// Cap par défaut à la granularité mensuelle : sans troncature, une série France
// avec saisies quotidiennes par département explose (cf. design doc D11).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

const performList = async (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): Promise<Result<ValeurAvancementListApiModel, ResolveSelectionError>> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true },
  })
  const selection = await resolveSelection({
    indicateurId: indicateur.id,
    modalitePublicIds: params.modalites ?? [],
  })
  if (selection.isErr()) return err(selection.error)
  return ok(
    await buildSeries({
      indicateurId: indicateur.id,
      indicateurPublicId,
      params,
      selection: selection.value,
    }),
  )
}

export const listValeursForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): ResultAsync<ValeurAvancementListApiModel, ResolveSelectionError> =>
  new ResultAsync(performList(indicateurPublicId, params))

// Orchestration en 3 phases : (1) résoudre les cibles publicId→id, (2) résoudre
// leurs séries (`loadResolveSerieContext` charge et calcule fratrie par
// fratrie), (3) convertir les points. Filtrage dateDebut/dateFin appliqué en
// sortie. Cf. doc d'archi `indicateur-derives.md`.
const buildSeries = async ({
  indicateurId,
  indicateurPublicId,
  params,
  selection,
}: {
  indicateurId: string
  indicateurPublicId: string
  params: ListValeursForIndicateurQuery
  selection: Selection
}): Promise<ValeurAvancementListApiModel> => {
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { serieDe, allNodes } = await loadResolveSerieContext({
    indicateurId,
    individusCibles,
    dateTrunc,
    selection,
  })

  const dateDebut = params.dateDebut ? parseBucket(params.dateDebut) : null
  const dateFin = params.dateFin ? parseBucket(params.dateFin) : null
  const items: ValeurAvancementApiModel[] = []
  for (const individuCible of individusCibles) {
    for (const point of serieDe(individuCible)) {
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
    // Champ absent sans axe : la réponse des indicateurs sans axe ne change pas.
    ...(c.modalites.length > 0 ? { modalites: [...c.modalites] } : {}),
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
