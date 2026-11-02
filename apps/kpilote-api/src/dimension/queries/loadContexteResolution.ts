import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { parseCelluleId } from '@pilote/kpilote-shared/cellule'

import {
  buildGrapheCube,
  buildSupport,
  type Coordonnees,
  type DimensionCube,
  type MembreCube,
  type TopologieCube,
} from '@/dimension/buildGrapheCube'
import {
  type DimensionIndicateur,
  dimensionsObjectifs,
  loadIndicateurDimensions,
} from '@/dimension/queries/loadIndicateurDimensions'
import { type BucketKey, parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import {
  getClesCellulesSupport,
  getObjectifsTronquesPourCellules,
  getValeursTronqueesPourCellules,
} from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadIndividusParPublicId,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import {
  type ObjectifSaisieBucketise,
  type ResolveObjectifContext,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import {
  type IndividuRef,
  type ResolveSerieContext,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Point d'entrée unique du chargement des contextes de résolution (séries et
// objectifs) à partir d'identifiants de cellule demandés (`DEPT-84`,
// `DEPT-84~OP-ORANGE`). Aiguillage :
// - indicateur mono-dimension (cas historique) : chemin inchangé — BFS sur
//   `Relation` (`loadSousArbre`) et fonction par référentiel ; la sémantique est
//   gelée (cf. dimensions-design.md « Rétrocompatibilité ») ;
// - indicateur multi-dimension : graphe de cellules (`buildGrapheCube`).

export type ContexteSerie = { ctx: ResolveSerieContext; cibles: IndividuRef[] }
export type ContexteObjectif = { ctx: ResolveObjectifContext; cibles: IndividuRef[] }

export const loadTopologieCube = async (
  dimensions: ReadonlyArray<DimensionIndicateur>,
): Promise<TopologieCube> => {
  const dimensionIds = dimensions.map((dimension) => dimension.dimensionId)
  const niveauxDeclares = new Set(
    dimensions.flatMap((dimension) => dimension.niveaux.map((niveau) => niveau.referentielId)),
  )
  // Tous les membres des dimensions (niveaux déclarés ou non) : un niveau non
  // déclaré est « sauté » — les enfants d'un membre sont ses descendants
  // déclarés les plus proches (ex. NAT + DEPT déclarés sans REG).
  const individus = await db().individu.findMany({
    where: { referentiel: { dimensionId: { in: dimensionIds } } },
    select: {
      id: true,
      publicId: true,
      referentielId: true,
      referentiel: { select: { dimensionId: true } },
    },
  })
  const dimensionParIndividu = new Map(individus.map((i) => [i.id, i.referentiel.dimensionId]))
  const ids = [...dimensionParIndividu.keys()]
  const relations = await db().relation.findMany({
    where: { parentId: { in: ids }, childId: { in: ids } },
    select: { parentId: true, childId: true },
  })
  const parentsBruts = new Map<string, string[]>()
  for (const { parentId, childId } of relations) {
    // Une Relation ne traverse jamais deux dimensions (garde à l'écriture) ; on
    // l'ignore défensivement si une donnée historique le fait.
    if (dimensionParIndividu.get(parentId) !== dimensionParIndividu.get(childId)) continue
    parentsBruts.set(childId, [...(parentsBruts.get(childId) ?? []), parentId])
  }

  const membres = new Map<string, MembreCube>()
  for (const individu of individus) {
    if (!niveauxDeclares.has(individu.referentielId)) continue
    membres.set(individu.id, {
      id: individu.id,
      publicId: individu.publicId,
      referentielId: individu.referentielId,
      dimensionId: individu.referentiel.dimensionId,
    })
  }
  const ancetresDeclaresLesPlusProches = (individuId: string): string[] => {
    const result = new Set<string>()
    const visites = new Set<string>()
    const pile = [...(parentsBruts.get(individuId) ?? [])]
    while (pile.length > 0) {
      const courant = pile.pop()!
      if (visites.has(courant)) continue
      visites.add(courant)
      if (membres.has(courant)) result.add(courant)
      else pile.push(...(parentsBruts.get(courant) ?? []))
    }
    return [...result]
  }
  const enfantsParMembre = new Map<string, string[]>()
  const parentsParMembre = new Map<string, string[]>()
  const racinesParDimension = new Map<string, string[]>()
  for (const membre of membres.values()) {
    const parents = ancetresDeclaresLesPlusProches(membre.id)
    if (parents.length === 0) {
      racinesParDimension.set(membre.dimensionId, [
        ...(racinesParDimension.get(membre.dimensionId) ?? []),
        membre.id,
      ])
      continue
    }
    parentsParMembre.set(membre.id, parents)
    for (const parent of parents) {
      enfantsParMembre.set(parent, [...(enfantsParMembre.get(parent) ?? []), membre.id])
    }
  }
  const dimensionsCube: DimensionCube[] = dimensions.map((dimension) => ({
    dimensionId: dimension.dimensionId,
    fonctionMarginale: dimension.fonctionAgregation,
    fonctionParNiveau: new Map(
      dimension.niveaux.map((niveau) => [niveau.referentielId, niveau.fonctionAgregation]),
    ),
  }))
  return {
    dimensions: dimensionsCube,
    membres,
    enfantsParMembre,
    parentsParMembre,
    racinesParDimension,
  }
}

// Cellule demandée → coordonnées. Une cellule invalide pour l'indicateur (membre
// inconnu ou hors de ses niveaux, deux membres d'une même dimension) est ignorée,
// comme l'est aujourd'hui un individu inconnu en lecture.
type CoordonneesDemandees = { demandee: string; coordonnees: Coordonnees }

const resoudreCoordonnees = (
  topologie: TopologieCube,
  cellules: ReadonlyArray<string>,
): CoordonneesDemandees[] => {
  const membreParPublicId = new Map(
    [...topologie.membres.values()].map((membre) => [membre.publicId, membre]),
  )
  const result: CoordonneesDemandees[] = []
  const vues = new Set<string>()
  for (const cellule of cellules) {
    const coordonnees = new Map<string, string>()
    let valide = true
    for (const publicId of parseCelluleId(cellule)) {
      const membre = membreParPublicId.get(publicId)
      if (!membre || coordonnees.has(membre.dimensionId)) {
        valide = false
        break
      }
      coordonnees.set(membre.dimensionId, membre.id)
    }
    const cle = [...coordonnees.values()].sort().join(',')
    if (!valide || vues.has(cle)) continue
    vues.add(cle)
    result.push({ demandee: cellule, coordonnees })
  }
  return result
}

const loadSaisiesTronquees = async ({
  indicateurId,
  cles,
  dateTrunc,
}: {
  indicateurId: string
  cles: ReadonlyArray<string>
  dateTrunc: DateTrunc
}): Promise<Map<string, SaisieTronquee[]>> => {
  const result = new Map<string, SaisieTronquee[]>()
  if (cles.length === 0) return result
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourCellules(indicateurId, [...cles], dateTrunc),
  )
  for (const row of rows) {
    if (!row.bucket) continue
    const liste = result.get(row.cle) ?? []
    liste.push({
      bucket: parseBucket(row.bucket),
      dateOrigine: parseBucket(row.dateOrigine),
      valeur: row.valeur,
    })
    result.set(row.cle, liste)
  }
  return result
}

const loadObjectifsBucketises = async ({
  indicateurId,
  cles,
  dateTrunc,
}: {
  indicateurId: string
  cles: ReadonlyArray<string>
  dateTrunc: DateTrunc
}): Promise<Map<string, Map<BucketKey, ObjectifSaisieBucketise>>> => {
  const result = new Map<string, Map<BucketKey, ObjectifSaisieBucketise>>()
  if (cles.length === 0) return result
  const rows = await db().$queryRawTyped(
    getObjectifsTronquesPourCellules(indicateurId, [...cles], dateTrunc),
  )
  for (const row of rows) {
    if (!row.bucket) continue
    const buckets = result.get(row.cle) ?? new Map<BucketKey, ObjectifSaisieBucketise>()
    buckets.set(row.bucket, { bucket: parseBucket(row.bucket), valeur: row.valeurCible })
    result.set(row.cle, buckets)
  }
  return result
}

const loadSupport = async ({
  indicateurId,
  topologie,
  typeFait,
}: {
  indicateurId: string
  topologie: TopologieCube
  typeFait: 'valeurs' | 'objectifs'
}) => {
  const rows = await db().$queryRawTyped(getClesCellulesSupport(indicateurId, typeFait))
  return buildSupport({ topologie, clesAvecValeurs: rows.map((row) => row.cle) })
}

const celluleMonoCoordonnee = (cellule: string): string | null => {
  const membres = parseCelluleId(cellule)
  return membres.length === 1 ? membres[0]! : null
}

// Chemin mono-dimension (historique) : cibles = individus, triés par publicId.
const loadCiblesMono = (cellules: ReadonlyArray<string>) =>
  loadIndividusParPublicId(
    cellules.map(celluleMonoCoordonnee).filter((id): id is string => id !== null),
  )

export const loadContexteSerie = async ({
  indicateurId,
  cellules,
  dateTrunc,
  dimensions: dimensionsConnues,
}: {
  indicateurId: string
  cellules: ReadonlyArray<string>
  dateTrunc: DateTrunc
  dimensions?: ReadonlyArray<DimensionIndicateur>
}): Promise<ContexteSerie> => {
  const dimensions = dimensionsConnues ?? (await loadIndicateurDimensions(indicateurId))
  if (dimensions.length <= 1) {
    const cibles = await loadCiblesMono(cellules)
    if (cibles.length === 0) return { ctx: ctxSerieVide(), cibles }
    const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
      loadSousArbre(cibles),
      loadFonctionsAgregation(indicateurId),
    ])
    const serieFeuilleParIndividu = await loadSaisiesTronquees({
      indicateurId,
      cles: [...allNodes.keys()],
      dateTrunc,
    })
    return {
      cibles,
      ctx: {
        enfantsParParent,
        fonctionAgregationParReferentiel,
        serieFeuilleParIndividu,
        referentielParIndividu: new Map(
          [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
        ),
      },
    }
  }

  const topologie = await loadTopologieCube(dimensions)
  const coordonnees = resoudreCoordonnees(topologie, cellules)
  if (coordonnees.length === 0) return { ctx: ctxSerieVide(), cibles: [] }
  const support = await loadSupport({ indicateurId, topologie, typeFait: 'valeurs' })
  const graphe = buildGrapheCube({
    topologie,
    support,
    cibles: coordonnees.map((c) => c.coordonnees),
  })
  const serieFeuilleParIndividu = await loadSaisiesTronquees({
    indicateurId,
    cles: [...graphe.noeuds.keys()],
    dateTrunc,
  })
  return {
    cibles: ciblesDemandees(graphe.cibles, coordonnees),
    ctx: {
      enfantsParParent: graphe.enfantsParParent,
      fonctionAgregationParReferentiel: graphe.fonctionAgregationParReferentiel,
      serieFeuilleParIndividu,
      referentielParIndividu: graphe.referentielParIndividu,
    },
  }
}

export const loadContexteObjectif = async ({
  indicateurId,
  cellules,
  dateTrunc,
  dimensions: dimensionsConnues,
}: {
  indicateurId: string
  cellules: ReadonlyArray<string>
  dateTrunc: DateTrunc
  dimensions?: ReadonlyArray<DimensionIndicateur>
}): Promise<ContexteObjectif> => {
  const toutes = dimensionsConnues ?? (await loadIndicateurDimensions(indicateurId))
  const dimensions = dimensionsObjectifs(toutes)
  // Indicateur mono-dimension : sémantique historique gelée. Un indicateur
  // multi-dimension passe toujours par le graphe de cellules, même si son
  // sous-cube d'objectifs n'a qu'une dimension (mêmes enfants que les valeurs).
  if (toutes.length <= 1) {
    const cibles = await loadCiblesMono(cellules)
    if (cibles.length === 0) return { ctx: ctxObjectifVide(), cibles }
    const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
      loadSousArbre(cibles),
      loadFonctionsAgregation(indicateurId),
    ])
    const objectifBucketParIndividu = await loadObjectifsBucketises({
      indicateurId,
      cles: [...allNodes.keys()],
      dateTrunc,
    })
    return {
      cibles,
      ctx: {
        enfantsParParent,
        fonctionAgregationParReferentiel,
        objectifBucketParIndividu,
        referentielParIndividu: new Map(
          [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
        ),
      },
    }
  }

  const topologie = await loadTopologieCube(dimensions)
  const coordonnees = resoudreCoordonnees(topologie, cellules)
  if (coordonnees.length === 0) return { ctx: ctxObjectifVide(), cibles: [] }
  // Support des objectifs : cellules portant des objectifs (un objectif est
  // prospectif ; une valeur sans objectif ne bloque pas un objectif strict).
  const support = await loadSupport({ indicateurId, topologie, typeFait: 'objectifs' })
  const graphe = buildGrapheCube({
    topologie,
    support,
    cibles: coordonnees.map((c) => c.coordonnees),
  })
  const objectifBucketParIndividu = await loadObjectifsBucketises({
    indicateurId,
    cles: [...graphe.noeuds.keys()],
    dateTrunc,
  })
  return {
    cibles: ciblesDemandees(graphe.cibles, coordonnees),
    ctx: {
      enfantsParParent: graphe.enfantsParParent,
      fonctionAgregationParReferentiel: graphe.fonctionAgregationParReferentiel,
      objectifBucketParIndividu,
      referentielParIndividu: graphe.referentielParIndividu,
    },
  }
}

// Les cibles gardent la chaîne envoyée par le client comme `publicId` (le champ
// `individu` des réponses), pour qu'il retrouve ses items sans connaître la forme
// canonique ; tri par cette chaîne.
const ciblesDemandees = (
  refs: ReadonlyArray<IndividuRef>,
  demandes: ReadonlyArray<CoordonneesDemandees>,
): IndividuRef[] =>
  refs
    .map((ref, index) => ({ ...ref, publicId: demandes[index]!.demandee }))
    .sort((a, b) => (a.publicId < b.publicId ? -1 : a.publicId > b.publicId ? 1 : 0))

const ctxSerieVide = (): ResolveSerieContext => ({
  enfantsParParent: new Map(),
  fonctionAgregationParReferentiel: new Map(),
  serieFeuilleParIndividu: new Map(),
  referentielParIndividu: new Map(),
})

const ctxObjectifVide = (): ResolveObjectifContext => ({
  enfantsParParent: new Map(),
  fonctionAgregationParReferentiel: new Map(),
  objectifBucketParIndividu: new Map(),
  referentielParIndividu: new Map(),
})
