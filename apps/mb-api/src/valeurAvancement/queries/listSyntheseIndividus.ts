import { type DateTrunc } from '@pilote/mb-shared/dates'
import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { unique } from '@/framework/array'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeVariation } from '@/valeurAvancement/computeVariation'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'

// Aligné sur listValeursForIndicateur : on raisonne sur les buckets mensuels
// pour les agrégés (cf. doc d'archi `indicateur-derives.md`).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

export const listSyntheseIndividus = (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): ResultAsync<SyntheseIndividusListApiModel, never> =>
  ResultAsync.fromSafePromise(buildSynthese(indicateurPublicId, params))

// Pour chaque individu demandé : variation (derniers 2 buckets de sa série) et
// écart à la médiane des dernières valeurs des pairs de son référentiel.
// Saisie pour les feuilles, dérivée pour les agrégés — on réutilise le moteur
// de séries : un seul `loadResolveSerieContext` couvre la population complète
// des référentiels concernés, puis la mémoïsation du functional core évite
// tout recalcul. Comme pour les valeurs remarquables, la "dernière valeur" est
// le dernier bucket de la série calculée (pas d'alignement sur une date pivot).
const buildSynthese = async (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): Promise<SyntheseIndividusListApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true },
  })

  const individusDemandes = await loadIndividus({ publicIds: params.individus })
  if (individusDemandes.length === 0) return { items: [] }

  // Population des référentiels concernés : nécessaire pour calculer la
  // médiane des pairs. Elle contient déjà les individus demandés (mêmes
  // référentiels), donc on s'en sert directement comme cibles unique.
  const referentielIds = unique(individusDemandes.map((i) => i.referentielId))
  const population = await loadPopulation({ referentielIds })

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { ctx, allNodes } = await loadResolveSerieContext({
    indicateurId: indicateur.id,
    individusCibles: population,
    dateTrunc,
  })
  const cache = new Map<string, ReadonlyArray<PointInterne>>()

  const medianeParReferentiel = await computeMedianeParReferentiel({ population, ctx, cache })

  const items: SyntheseIndividusListApiModel['items'] = []
  for (const individu of individusDemandes) {
    const serie = await resolveSerieIndividu(individu.id, ctx, cache)
    items.push({
      individu: individu.publicId,
      variation: computeVariation(extractDeuxDerniers(serie)),
      ecartMediane: computeEcartMediane(
        serie.at(-1)?.valeur,
        medianeParReferentiel.get(individu.referentielId) ?? null,
      ),
    })
  }

  logger.info(
    {
      event: 'valeurAvancement.listSyntheseIndividus.timing',
      indicateurId: indicateur.id,
      dateTrunc,
      nbDemandes: individusDemandes.length,
      nbPopulation: population.length,
      nbNodes: allNodes.size,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listSyntheseIndividus computed',
  )
  return { items }
}

// computeVariation attend [recente, precedente] ; nos séries sont ASC par
// bucket → on inverse les deux derniers points.
const extractDeuxDerniers = (
  serie: ReadonlyArray<PointInterne>,
): ReadonlyArray<{ valeur: Decimal }> => {
  const dernier = serie.at(-1)
  if (!dernier) return []
  const precedent = serie.at(-2)
  return precedent
    ? [{ valeur: dernier.valeur }, { valeur: precedent.valeur }]
    : [{ valeur: dernier.valeur }]
}

const computeMedianeParReferentiel = async ({
  population,
  ctx,
  cache,
}: {
  population: ReadonlyArray<IndividuRef>
  ctx: Awaited<ReturnType<typeof loadResolveSerieContext>>['ctx']
  cache: Map<string, ReadonlyArray<PointInterne>>
}): Promise<Map<string, number | null>> => {
  const valeursParReferentiel = new Map<string, Decimal[]>()
  for (const individu of population) {
    const dernier = (await resolveSerieIndividu(individu.id, ctx, cache)).at(-1)
    if (!dernier) continue
    const liste = valeursParReferentiel.get(individu.referentielId) ?? []
    liste.push(dernier.valeur)
    valeursParReferentiel.set(individu.referentielId, liste)
  }
  const result = new Map<string, number | null>()
  for (const [referentielId, valeurs] of valeursParReferentiel) {
    result.set(referentielId, computeMediane(valeurs))
  }
  return result
}

const loadIndividus = async ({
  publicIds,
}: {
  publicIds: ReadonlyArray<string>
}): Promise<IndividuRef[]> => {
  const rows = await db().individu.findMany({
    where: { publicId: { in: [...publicIds] } },
    orderBy: { publicId: 'asc' },
  })
  return rows.map(({ id, publicId, referentielId }) => ({ id, publicId, referentielId }))
}

const loadPopulation = async ({
  referentielIds,
}: {
  referentielIds: ReadonlyArray<string>
}): Promise<IndividuRef[]> => {
  if (referentielIds.length === 0) return []
  const rows = await db().individu.findMany({
    where: { referentielId: { in: [...referentielIds] } },
    orderBy: { publicId: 'asc' },
  })
  return rows.map(({ id, publicId, referentielId }) => ({ id, publicId, referentielId }))
}
