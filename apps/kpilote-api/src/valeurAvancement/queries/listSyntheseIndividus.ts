import { groupBy, mapValues, uniq } from 'es-toolkit'
import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { toMap } from '@pilote/kpilote-shared/record'
import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { type Selection } from '@/axe/modalites'
import { type ResolveSelectionError, resolveSelection } from '@/axe/resolveSelection'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeVariation } from '@/valeurAvancement/computeVariation'
import { loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { type IndividuRef, type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'

// Aligné sur listValeursForIndicateur : on raisonne sur les buckets mensuels
// pour les agrégés (cf. doc d'archi `indicateur-derives.md`).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

// La variation compare les deux derniers points ; la médiane ne lit que le dernier.
const LAST_POINT_COUNT = 2

type ListSyntheseIndividusParams = {
  indicateurPublicId: string
  query: ListSyntheseIndividusQuery
}

const performList = async ({
  indicateurPublicId,
  query,
}: ListSyntheseIndividusParams): Promise<
  Result<SyntheseIndividusListApiModel, ResolveSelectionError>
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
  return ok(await buildSynthese({ indicateurId: indicateur.id, query, selection: selection.value }))
}

export const listSyntheseIndividus = (
  params: ListSyntheseIndividusParams,
): ResultAsync<SyntheseIndividusListApiModel, ResolveSelectionError> =>
  new ResultAsync(performList(params))

// Pour chaque individu demandé : variation (derniers 2 buckets de sa série) et
// écart à la médiane des dernières valeurs des pairs de son référentiel.
// Saisie pour les feuilles, dérivée pour les agrégés — on réutilise le moteur
// de séries : un seul `loadResolveSerieContext` couvre la population complète
// des référentiels concernés, en ne chargeant que les deux dernières saisies
// de chaque cellule. Comme pour les valeurs remarquables, la "dernière valeur" est
// le dernier bucket de la série calculée (pas d'alignement sur une date pivot).
//
// Avec une sélection de modalités, chaque individu et ses pairs sont lus sur
// ces modalités (« individus du référentiel × modalités fixées »).
const buildSynthese = async ({
  indicateurId,
  query,
  selection,
}: {
  indicateurId: string
  query: ListSyntheseIndividusQuery
  selection: Selection
}): Promise<SyntheseIndividusListApiModel> => {
  const indicateur = { id: indicateurId }

  const individusDemandes = await loadIndividus({ publicIds: query.individus })
  if (individusDemandes.length === 0) return { items: [] }

  // Population des référentiels concernés : nécessaire pour calculer la
  // médiane des pairs. Elle contient déjà les individus demandés (mêmes
  // référentiels), donc on s'en sert directement comme cibles unique.
  const referentielIds = uniq(individusDemandes.map((individu) => individu.referentielId))
  const population = await loadPopulation({ referentielIds })

  const dateTrunc: DateTrunc = query.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { serieOf, allNodes } = await loadResolveSerieContext({
    indicateurId: indicateur.id,
    individusCibles: population,
    dateTrunc,
    selection,
    lastPointCount: LAST_POINT_COUNT,
  })

  const medianeByReferentiel = computeMedianeByReferentiel({ population, serieOf })

  const items: SyntheseIndividusListApiModel['items'] = []
  for (const individu of individusDemandes) {
    const serie = serieOf(individu)
    items.push({
      individu: individu.publicId,
      // computeVariation attend [recente, precedente] ; la série est ASC par bucket.
      variation: computeVariation(serie.slice(-2).reverse()),
      ecartMediane: computeEcartMediane(
        serie.at(-1)?.valeur,
        medianeByReferentiel.get(individu.referentielId) ?? null,
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

const computeMedianeByReferentiel = ({
  population,
  serieOf,
}: {
  population: ReadonlyArray<IndividuRef>
  serieOf: (individu: IndividuRef) => ReadonlyArray<PointInterne>
}): Map<string, Decimal | null> => {
  const lastValeurs = population.flatMap((individu) => {
    const lastPoint = serieOf(individu).at(-1)
    return lastPoint ? [{ referentielId: individu.referentielId, valeur: lastPoint.valeur }] : []
  })
  return toMap(
    mapValues(
      groupBy(lastValeurs, (lastValeur) => lastValeur.referentielId),
      (valeursReferentiel) => computeMediane(valeursReferentiel.map(({ valeur }) => valeur)),
    ),
  )
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
