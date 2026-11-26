import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import { chunk, partition, uniq } from 'es-toolkit'

import { getEmptyCombinaisonId } from '@/axe/combinaison'
import { type AxeCalcul, type ModaliteCalcul, type Selection } from '@/axe/modalites'
import { type Bucket, parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesForIndividus } from '@/generated/prisma/sql'
import { loadFonctionsAgregation, loadSousArbre } from '@/indicateur/loadIndicateurIndividuContext'
import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { buildGrapheSerie } from '@/valeurAvancement/buildGrapheSerie'
import { celluleKey, type SaisiesCellule } from '@/valeurAvancement/cellule'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieNoeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieNoeud'

export type SerieContext = {
  // Série d'un individu cible sur la sélection demandée ; vide s'il n'a aucune valeur.
  serieOf: (individu: IndividuRef) => ReadonlyArray<PointInterne>
  allNodes: Map<string, IndividuRef>
}

// Des cibles saisies demandées sans leur parent se chargent par lots : la
// conversion des lignes d'un lot est le plus long calcul sans rendre la main.
const CIBLE_BATCH_SIZE = 50

// Ce qui se charge une fois (hiérarchie, axes), et ce qui s'accumule au fil des lots.
type Resolution = {
  indicateurId: string
  dateTrunc: DateTrunc
  selection: Selection
  lastPointCount: number | null
  cibleIds: ReadonlySet<string>
  hierarchy: {
    enfantsByParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
    fonctionAgregationByReferentiel: ReadonlyMap<string, FonctionAgregation>
    referentielByIndividu: ReadonlyMap<string, string>
  }
  // Dans l'ordre de déclaration ; vide pour un indicateur sans axe.
  axes: ReadonlyArray<AxeCalcul>
  modalites: ReadonlyArray<ModaliteCalcul>
  // La combinaison vide seule pour un indicateur sans axe, null pour toutes.
  combinaisonIds: ReadonlyArray<string> | null
  // combinaisonId → (axeId → modaliteId), complété à chaque lot chargé.
  modalitesByCombinaison: Map<string, Map<string, string>>
  // Une seule instance par date distincte : un `PlainDate` pèse plus que la
  // valeur qu'il date, et un historique n'a que quelques dizaines de dates.
  dateByIso: Map<string, Bucket>
  // Séries résolues : celles des cibles, et celles des individus agrégés tant
  // que leur parent ne les a pas lues.
  serieByIndividu: Map<string, ReadonlyArray<PointInterne>>
}

// Résout les séries d'un ensemble d'individus cibles, sur une sélection, avec
// le moteur (`buildGrapheSerie` + `resolveSerieNoeud`).
//
// Le chargement suit le calcul : on ne descend sous un individu que si son
// référentiel agrège, on charge les saisies d'une fratrie (les enfants directs
// d'un même parent) en une requête, on calcule le parent, puis on oublie ce
// qui n'est pas une cible. La mémoire d'une requête est celle d'une fratrie et
// des séries gardées, pas celle de tout le sous-arbre.
//
// `lastPointCount` : nombre de derniers points à rendre par cible, null pour
// la série entière. Les N derniers points d'un nœud dérivé ne dépendent que des
// N derniers points de ses enfants (le report prend la dernière valeur connue
// de chaque enfant), donc on ne charge que les N dernières saisies par cellule.
export const loadResolveSerieContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
  selection = new Map(),
  lastPointCount = null,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
  // Sans sélection, « Tous » sur chaque axe.
  selection?: Selection
  lastPointCount?: number | null
}): Promise<SerieContext> => {
  const [{ allNodes, enfantsByParent }, fonctionAgregationByReferentiel, declarations] =
    await Promise.all([
      loadSousArbre(individusCibles),
      loadFonctionsAgregation(indicateurId),
      db().indicateurAxe.findMany({ where: { indicateurId }, orderBy: { ordre: 'asc' } }),
    ])
  const axeIds = declarations.map((declaration) => declaration.axeId)
  const hasAxes = axeIds.length > 0

  const resolution: Resolution = {
    indicateurId,
    dateTrunc,
    selection,
    lastPointCount,
    cibleIds: new Set(individusCibles.map((cible) => cible.id)),
    hierarchy: {
      enfantsByParent,
      fonctionAgregationByReferentiel,
      referentielByIndividu: new Map(
        [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
      ),
    },
    axes: declarations.map((declaration) => ({
      id: declaration.axeId,
      fonction: declaration.fonction,
    })),
    modalites: hasAxes ? await db().modalite.findMany({ where: { axeId: { in: axeIds } } }) : [],
    combinaisonIds: hasAxes ? null : [await getEmptyCombinaisonId()],
    modalitesByCombinaison: new Map(),
    dateByIso: new Map(),
    serieByIndividu: new Map(),
  }

  const [ciblesAgregees, ciblesSaisies] = partition([...individusCibles], (cible) =>
    isAgrege({ resolution, individu: cible }),
  )
  // Les cibles agrégées d'abord : leurs enfants cibles sont résolus au passage.
  for (const cible of ciblesAgregees) {
    await resolveAgrege({ resolution, individu: cible })
  }
  const remainingCibles = ciblesSaisies.filter((cible) => !resolution.serieByIndividu.has(cible.id))
  for (const batch of chunk(remainingCibles, CIBLE_BATCH_SIZE)) {
    await resolveBatch({ resolution, individus: batch, saisis: batch, resolved: [], kept: batch })
  }

  return {
    serieOf: (individu) => resolution.serieByIndividu.get(individu.id) ?? [],
    allNodes,
  }
}

// Même décision que la règle 1 du graphe : l'individu se calcule à partir de
// ses enfants.
const isAgrege = ({
  resolution,
  individu,
}: {
  resolution: Resolution
  individu: IndividuRef
}): boolean =>
  getFonctionAgregationActive({
    individuId: individu.id,
    hierarchy: resolution.hierarchy,
  }) !== null

// Résout un individu agrégé : ses enfants agrégés d'abord (en profondeur), puis
// lui-même à partir de leurs séries et des saisies de ses enfants saisis.
const resolveAgrege = async ({
  resolution,
  individu,
}: {
  resolution: Resolution
  individu: IndividuRef
}): Promise<void> => {
  if (resolution.serieByIndividu.has(individu.id)) return

  const enfants = resolution.hierarchy.enfantsByParent.get(individu.id) ?? []
  const [agreges, saisis] = partition([...enfants], (enfant) =>
    isAgrege({ resolution, individu: enfant }),
  )
  for (const enfant of agreges) {
    await resolveAgrege({ resolution, individu: enfant })
  }

  const isCible = (enfant: IndividuRef): boolean => resolution.cibleIds.has(enfant.id)
  await resolveBatch({
    resolution,
    individus: [individu, ...enfants],
    saisis,
    resolved: agreges,
    kept: [individu, ...saisis.filter(isCible)],
  })
  // Un enfant agrégé a servi : sa série ne reste que s'il est demandé.
  for (const enfant of agreges) {
    if (!isCible(enfant)) resolution.serieByIndividu.delete(enfant.id)
  }
}

// Résout un lot avec le moteur : charge les saisies des individus saisis,
// construit le graphe du lot, et garde les séries demandées. Les saisies, le
// graphe et le cache du moteur partent avec le lot.
const resolveBatch = async ({
  resolution,
  individus,
  saisis,
  resolved,
  kept,
}: {
  resolution: Resolution
  // Les individus du lot : le graphe y lit leur référentiel.
  individus: ReadonlyArray<IndividuRef>
  // Ceux dont on charge les saisies.
  saisis: ReadonlyArray<IndividuRef>
  // Ceux dont la série est déjà connue.
  resolved: ReadonlyArray<IndividuRef>
  // Ceux dont on garde la série.
  kept: ReadonlyArray<IndividuRef>
}): Promise<void> => {
  const { selection, hierarchy } = resolution
  const cellules = await loadCellules({ resolution, individus: saisis })
  const { graphe, noeud } = buildGrapheSerie({
    individus,
    enfantsByParent: hierarchy.enfantsByParent,
    fonctionAgregationByReferentiel: hierarchy.fonctionAgregationByReferentiel,
    axes: resolution.axes,
    modalites: resolution.modalites,
    cellules,
    modalitesByCombinaison: resolution.modalitesByCombinaison,
  })

  // Le moteur ne redescend pas sous un nœud présent dans son cache : les
  // séries déjà résolues y entrent, et rien n'est chargé sous leurs individus.
  const cache = new Map<string, ReadonlyArray<PointInterne>>()
  for (const individu of resolved) {
    const serie = resolution.serieByIndividu.get(individu.id)
    if (serie) cache.set(noeud({ individu, selection }).key, serie)
  }

  for (const individu of kept) {
    const serie = await resolveSerieNoeud({ noeud: noeud({ individu, selection }), graphe, cache })
    resolution.serieByIndividu.set(
      individu.id,
      keepLastPoints({ serie, lastPointCount: resolution.lastPointCount }),
    )
  }
}

// Avec des saisies limitées aux N dernières par cellule, seuls les N derniers
// points d'une série sont justes : on ne rend que ceux-là.
export const keepLastPoints = ({
  serie,
  lastPointCount,
}: {
  serie: ReadonlyArray<PointInterne>
  lastPointCount: number | null
}): ReadonlyArray<PointInterne> =>
  lastPointCount === null ? serie : serie.slice(Math.max(serie.length - lastPointCount, 0))

// Saisies des individus, par cellule, et modalités des combinaisons qu'on
// découvre (indicateur à axes).
const loadCellules = async ({
  resolution,
  individus,
}: {
  resolution: Resolution
  individus: ReadonlyArray<IndividuRef>
}): Promise<SaisiesCellule[]> => {
  const cellules = await loadSaisiesTronquees({
    indicateurId: resolution.indicateurId,
    individuIds: individus.map((individu) => individu.id),
    dateTrunc: resolution.dateTrunc,
    combinaisonIds: resolution.combinaisonIds,
    lastPointCount: resolution.lastPointCount,
    dateByIso: resolution.dateByIso,
  })
  if (resolution.axes.length === 0) return cellules

  const { modalitesByCombinaison } = resolution
  const newCombinaisonIds = uniq(cellules.map((cellule) => cellule.combinaisonId)).filter(
    (combinaisonId) => !modalitesByCombinaison.has(combinaisonId),
  )
  if (newCombinaisonIds.length === 0) return cellules

  const rows = await db().combinaisonModalite.findMany({
    where: { combinaisonId: { in: newCombinaisonIds } },
  })
  for (const row of rows) {
    const modaliteByAxe = modalitesByCombinaison.get(row.combinaisonId) ?? new Map<string, string>()
    modaliteByAxe.set(row.axeId, row.modaliteId)
    modalitesByCombinaison.set(row.combinaisonId, modaliteByAxe)
  }
  return cellules
}

// Saisies tronquées, par cellule. `combinaisonIds` à null : toutes les
// combinaisons de l'indicateur. `lastPointCount` à null : tout l'historique.
const loadSaisiesTronquees = async ({
  indicateurId,
  individuIds,
  dateTrunc,
  combinaisonIds,
  lastPointCount,
  dateByIso,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
  combinaisonIds: ReadonlyArray<string> | null
  lastPointCount: number | null
  dateByIso: Map<string, Bucket>
}): Promise<SaisiesCellule[]> => {
  if (individuIds.length === 0) return []
  const rows = await db().$queryRawTyped(
    getValeursTronqueesForIndividus(
      indicateurId,
      [...individuIds],
      dateTrunc,
      combinaisonIds === null ? null : [...combinaisonIds],
      lastPointCount,
    ),
  )
  const cellules = new Map<string, SaisiesCellule & { saisies: SaisieTronquee[] }>()
  for (const row of rows) {
    if (!row.bucket) continue
    const cellule = { individuId: row.individuId, combinaisonId: row.combinaisonId }
    const key = celluleKey(cellule)
    const current = cellules.get(key) ?? { ...cellule, saisies: [] }
    current.saisies.push({
      bucket: sharedBucket({ dateByIso, iso: row.bucket }),
      dateOrigine: sharedBucket({ dateByIso, iso: row.dateOrigine }),
      valeur: row.valeur,
    })
    cellules.set(key, current)
  }
  return [...cellules.values()]
}

const sharedBucket = ({
  dateByIso,
  iso,
}: {
  dateByIso: Map<string, Bucket>
  iso: string
}): Bucket => {
  const known = dateByIso.get(iso)
  if (known) return known
  const bucket = parseBucket(iso)
  dateByIso.set(iso, bucket)
  return bucket
}
