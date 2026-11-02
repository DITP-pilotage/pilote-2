import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { unique } from '@/framework/array'
import { parseCelluleId } from '@pilote/kpilote-shared/cellule'

import { loadContexteSerie } from '@/dimension/queries/loadContexteResolution'
import { loadIndicateurDimensions } from '@/dimension/queries/loadIndicateurDimensions'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeVariation } from '@/valeurAvancement/computeVariation'
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

  const dimensions = await loadIndicateurDimensions(indicateur.id)
  if (dimensions.length > 1) {
    return buildSyntheseMultiDimension({
      indicateurId: indicateur.id,
      cellules: params.individus,
      dateTrunc: params.dateTrunc ?? DEFAULT_DATE_TRUNC,
      ordreDimensions: dimensions.map((d) => d.dimensionId),
    })
  }

  const individusDemandes = await loadIndividus({ publicIds: params.individus })
  if (individusDemandes.length === 0) return { items: [] }

  // Population des référentiels concernés : nécessaire pour calculer la
  // médiane des pairs. Elle contient déjà les individus demandés (mêmes
  // référentiels), donc on s'en sert directement comme cibles unique.
  const referentielIds = unique(individusDemandes.map((i) => i.referentielId))
  const population = await loadPopulation({ referentielIds })

  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const startedAt = performance.now()
  const { ctx } = await loadContexteSerie({
    indicateurId: indicateur.id,
    cellules: population.map((individu) => individu.publicId),
    dateTrunc,
    dimensions,
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
      nbNodes: ctx.referentielParIndividu.size,
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
  ctx: Awaited<ReturnType<typeof loadContexteSerie>>['ctx']
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

// Multi-dimension (cf. dimensions-design.md « Tranches ») : les pairs d'une cellule
// font varier la coordonnée de la **première dimension présente** (dans l'ordre)
// sur tous les membres de son niveau, les autres coordonnées restant fixées.
const buildSyntheseMultiDimension = async ({
  indicateurId,
  cellules,
  dateTrunc,
  ordreDimensions,
}: {
  indicateurId: string
  cellules: ReadonlyArray<string>
  dateTrunc: DateTrunc
  ordreDimensions: ReadonlyArray<string>
}): Promise<SyntheseIndividusListApiModel> => {
  const membres = await db().individu.findMany({
    where: { publicId: { in: [...new Set(cellules.flatMap(parseCelluleId))] } },
    select: { publicId: true, referentielId: true, referentiel: { select: { dimensionId: true } } },
  })
  const membreParPublicId = new Map(membres.map((m) => [m.publicId, m]))
  const groupes: Array<{ cellule: string; pairs: string[] }> = []
  const populationsParReferentiel = new Map<string, string[]>()
  for (const cellule of [...cellules].sort()) {
    const coordonnees = parseCelluleId(cellule)
      .map((publicId) => membreParPublicId.get(publicId))
      .filter((m) => m !== undefined)
    const varie = [...coordonnees].sort(
      (a, b) =>
        ordreDimensions.indexOf(a.referentiel.dimensionId) -
        ordreDimensions.indexOf(b.referentiel.dimensionId),
    )[0]
    if (!varie) continue
    let population = populationsParReferentiel.get(varie.referentielId)
    if (!population) {
      const rows = await db().individu.findMany({
        where: { referentielId: varie.referentielId },
        orderBy: { publicId: 'asc' },
        select: { publicId: true },
      })
      population = rows.map((row) => row.publicId)
      populationsParReferentiel.set(varie.referentielId, population)
    }
    const autres = coordonnees.filter((m) => m !== varie).map((m) => m.publicId)
    groupes.push({
      cellule,
      pairs: population.map((publicId) => [publicId, ...autres].join('~')),
    })
  }
  if (groupes.length === 0) return { items: [] }

  const { ctx, cibles } = await loadContexteSerie({
    indicateurId,
    cellules: [...new Set(groupes.flatMap((g) => [g.cellule, ...g.pairs]))],
    dateTrunc,
  })
  // Indexés par membres triés : le chargeur dédoublonne les cellules de même clé
  // canonique et ne garde que la première chaîne demandée (ex. `OP-X~DEPT-84`
  // demandée, pair `DEPT-84~OP-X` construit) — la recherche doit ignorer l'ordre.
  const cleMembres = (cellule: string) => parseCelluleId(cellule).sort().join('~')
  const noeudParCellule = new Map(cibles.map((cible) => [cleMembres(cible.publicId), cible]))
  const cache = new Map<string, ReadonlyArray<PointInterne>>()
  const items: SyntheseIndividusListApiModel['items'] = []
  for (const { cellule, pairs } of groupes) {
    const noeud = noeudParCellule.get(cleMembres(cellule))
    if (!noeud) continue
    const valeursPairs: Decimal[] = []
    for (const pair of pairs) {
      const noeudPair = noeudParCellule.get(cleMembres(pair))
      const dernier = noeudPair && (await resolveSerieIndividu(noeudPair.id, ctx, cache)).at(-1)
      if (dernier) valeursPairs.push(dernier.valeur)
    }
    const serie = await resolveSerieIndividu(noeud.id, ctx, cache)
    items.push({
      individu: cellule,
      variation: computeVariation(extractDeuxDerniers(serie)),
      ecartMediane: computeEcartMediane(serie.at(-1)?.valeur, computeMediane(valeursPairs)),
    })
  }
  return { items }
}
