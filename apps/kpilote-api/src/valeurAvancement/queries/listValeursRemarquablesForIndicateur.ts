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
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

// Aligné sur listValeursForIndicateur : on raisonne sur les buckets mensuels
// pour les agrégés (cf. doc d'archi `indicateur-derives.md`).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

const performList = async (
  indicateurPublicId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): Promise<Result<ValeursRemarquablesListApiModel, ResolveSelectionError>> => {
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
  return ok(await buildStats({ indicateurId: indicateur.id, params, selection: selection.value }))
}

export const listValeursRemarquablesForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): ResultAsync<ValeursRemarquablesListApiModel, ResolveSelectionError> =>
  new ResultAsync(performList(indicateurPublicId, params))

// Pour chaque référentiel demandé, on calcule min/max/médiane sur la dernière
// valeur connue de chaque individu — saisie pour les feuilles, dérivée pour les
// agrégés. On réutilise le moteur de séries de listValeursForIndicateur :
// `loadResolveSerieContext` résout la population fratrie par fratrie. La
// "dernière valeur" est
// le dernier bucket de la série calculée — sans alignement sur une date pivot,
// donc des individus peuvent contribuer à partir de dates différentes.
//
// Avec une sélection de modalités, la population est « individus du
// référentiel × modalités fixées » : un individu où la modalité n'a jamais été
// observée n'a pas de valeur et sort des statistiques.
const buildStats = async ({
  indicateurId,
  params,
  selection,
}: {
  indicateurId: string
  params: ListValeursRemarquablesForIndicateurQuery
  selection: Selection
}): Promise<ValeursRemarquablesListApiModel> => {
  const referentiels = await loadReferentielsAvecIndividus(params.referentiels)
  if (referentiels.length === 0) return { items: [] }

  const cibles: IndividuRef[] = referentiels.flatMap((r) => r.individus)
  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { serieDe, allNodes } = await loadResolveSerieContext({
    indicateurId,
    individusCibles: cibles,
    dateTrunc,
    selection,
  })

  const items: ValeursRemarquablesListApiModel['items'] = []
  for (const referentiel of referentiels) {
    const contributions: ValeursRemarquablesContributionApiModel[] = []
    const valeurs: Decimal[] = []
    for (const individu of referentiel.individus) {
      const dernierPoint = serieDe(individu).at(-1)
      if (!dernierPoint) continue
      valeurs.push(dernierPoint.valeur)
      contributions.push({
        individu: individu.publicId,
        valeur: dernierPoint.valeur.toNumber(),
        date: formatBucket(dernierPoint.bucket),
        source: dernierPoint.type === 'saisie' ? 'saisie' : 'derivee',
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

const loadReferentielsAvecIndividus = async (
  referentielPublicIds: ReadonlyArray<string>,
): Promise<ReadonlyArray<{ publicId: string; individus: IndividuRef[] }>> => {
  const rows = await db().referentiel.findMany({
    where: { publicId: { in: [...referentielPublicIds] } },
    orderBy: { publicId: 'asc' },
    include: { individus: { orderBy: { publicId: 'asc' } } },
  })
  return rows.map((r) => ({
    publicId: r.publicId,
    individus: r.individus.map(({ id, publicId, referentielId }) => ({
      id,
      publicId,
      referentielId,
    })),
  }))
}
