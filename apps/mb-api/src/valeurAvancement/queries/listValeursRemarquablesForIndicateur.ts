import {
  type DateTrunc,
  type ListValeursRemarquablesForIndicateurQuery,
  type ValeursRemarquablesContributionApiModel,
  type ValeursRemarquablesListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeMax } from '@/valeurAvancement/computeMax'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeMin } from '@/valeurAvancement/computeMin'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'

// Aligné sur listValeursForIndicateur : on raisonne sur les buckets mensuels
// pour les agrégés (cf. doc d'archi `indicateur-derives.md`).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

export const listValeursRemarquablesForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): ResultAsync<ValeursRemarquablesListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(buildStats({ indicateurId: indicateur.id, params })),
  )
}

// Pour chaque référentiel demandé, on calcule min/max/médiane sur la dernière
// valeur connue de chaque individu — saisie pour les feuilles, dérivée pour les
// agrégés. On réutilise le moteur de séries de listValeursForIndicateur : un
// seul chargement DB (arbre + saisies + fonctions d'agrégation), puis la
// mémoïsation du functional core évite tout recalcul. La "dernière valeur" est
// le dernier bucket de la série calculée — sans alignement sur une date pivot,
// donc des individus peuvent contribuer à partir de dates différentes.
const buildStats = async ({
  indicateurId,
  params,
}: {
  indicateurId: string
  params: ListValeursRemarquablesForIndicateurQuery
}): Promise<ValeursRemarquablesListApiModel> => {
  const referentiels = await loadReferentielsAvecIndividus(params.referentiels)
  if (referentiels.length === 0) return { items: [] }

  const cibles: IndividuRef[] = referentiels.flatMap((r) => r.individus)
  const dateTrunc = DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { ctx, allNodes } = await loadResolveSerieContext({ indicateurId, cibles, dateTrunc })
  const cache = new Map<string, ReadonlyArray<PointInterne>>()

  const items: ValeursRemarquablesListApiModel['items'] = []
  for (const referentiel of referentiels) {
    const contributions: ValeursRemarquablesContributionApiModel[] = []
    const valeurs: Decimal[] = []
    for (const individu of referentiel.individus) {
      const dernierPoint = (await resolveSerieIndividu(individu.id, ctx, cache)).at(-1)
      if (!dernierPoint) continue
      valeurs.push(dernierPoint.valeur)
      contributions.push({
        individu: individu.publicId,
        valeur: dernierPoint.valeur.toNumber(),
        date: dernierPoint.bucket,
        source: dernierPoint.type === 'saisie' ? 'saisie' : 'derivee',
      })
    }
    items.push({
      referentiel: referentiel.publicId,
      min: computeMin(valeurs),
      max: computeMax(valeurs),
      mediane: computeMediane(valeurs),
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
