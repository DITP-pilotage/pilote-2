import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type ListValeursRemarquablesForIndicateurQuery,
  type ValeursRemarquablesContributionApiModel,
  type ValeursRemarquablesListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { type Selection } from '@/axe/modalites'
import { type ResolveSelectionError, resolveSelection } from '@/axe/resolveSelection'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { type Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeMax } from '@/valeurAvancement/computeMax'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeMin } from '@/valeurAvancement/computeMin'
import { loadReferentielsWithIndividus } from '@/valeurAvancement/loadReferentielsWithIndividus'
import { loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

// Aligné sur listValeursForIndicateur : on raisonne sur les buckets mensuels
// pour les agrégés (cf. doc d'archi `indicateur-derives.md`).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

type ListValeursRemarquablesForIndicateurParams = {
  indicateurPublicId: string
  query: ListValeursRemarquablesForIndicateurQuery
}

const performList = async ({
  indicateurPublicId,
  query,
}: ListValeursRemarquablesForIndicateurParams): Promise<
  Result<ValeursRemarquablesListApiModel, ResolveSelectionError>
> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true },
  })
  const selection = await resolveSelection({
    indicateurId: indicateur.id,
    modalitePublicIds: query.modalites ?? [],
  })
  if (selection.isErr()) return err(selection.error)
  return ok(await buildStats({ indicateurId: indicateur.id, query, selection: selection.value }))
}

export const listValeursRemarquablesForIndicateur = (
  params: ListValeursRemarquablesForIndicateurParams,
): ResultAsync<ValeursRemarquablesListApiModel, ResolveSelectionError> =>
  new ResultAsync(performList(params))

// Pour chaque référentiel demandé, on calcule min/max/médiane sur la dernière
// valeur connue de chaque individu — saisie pour les feuilles, dérivée pour les
// agrégés. On réutilise le moteur de séries de listValeursForIndicateur :
// `loadResolveSerieContext` résout la population fratrie par fratrie, en ne
// chargeant que la dernière saisie de chaque cellule. La "dernière valeur" est
// le dernier bucket de la série calculée — sans alignement sur une date pivot,
// donc des individus peuvent contribuer à partir de dates différentes.
//
// Avec une sélection de modalités, la population est « individus du
// référentiel × modalités fixées » : un individu où la modalité n'a jamais été
// observée n'a pas de valeur et sort des statistiques.
const buildStats = async ({
  indicateurId,
  query,
  selection,
}: {
  indicateurId: string
  query: ListValeursRemarquablesForIndicateurQuery
  selection: Selection
}): Promise<ValeursRemarquablesListApiModel> => {
  const referentiels = await loadReferentielsWithIndividus({
    referentielPublicIds: query.referentiels,
  })
  if (referentiels.length === 0) return { items: [] }

  const cibles: IndividuRef[] = referentiels.flatMap((referentiel) => referentiel.individus)
  const dateTrunc: DateTrunc = query.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { serieOf, allNodes } = await loadResolveSerieContext({
    indicateurId,
    individusCibles: cibles,
    dateTrunc,
    selection,
    lastPointCount: 1,
  })

  const items: ValeursRemarquablesListApiModel['items'] = []
  for (const referentiel of referentiels) {
    const contributions: ValeursRemarquablesContributionApiModel[] = []
    const valeurs: Decimal[] = []
    for (const individu of referentiel.individus) {
      const lastPoint = serieOf(individu).at(-1)
      if (!lastPoint) continue
      valeurs.push(lastPoint.valeur)
      contributions.push({
        individu: individu.publicId,
        valeur: lastPoint.valeur.toNumber(),
        date: formatBucket(lastPoint.bucket),
        source: lastPoint.type === 'saisie' ? 'saisie' : 'derivee',
      })
    }
    items.push({
      referentiel: referentiel.publicId,
      min: computeMin(valeurs),
      max: computeMax(valeurs),
      mediane: computeMediane(valeurs)?.toNumber() ?? null,
      contributions,
    })
  }

  logger.info(
    {
      event: 'valeurAvancement.listValeursRemarquablesForIndicateur.timing',
      indicateurId,
      dateTrunc,
      nbReferentiels: referentiels.length,
      nbCibles: cibles.length,
      nbNodes: allNodes.size,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listValeursRemarquablesForIndicateur computed',
  )
  return { items }
}
