import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { parseCelluleId } from '@pilote/kpilote-shared/cellule'

import { loadContexteObjectif, loadContexteSerie } from '@/dimension/queries/loadContexteResolution'
import {
  type DimensionIndicateur,
  dimensionsObjectifs,
  loadIndicateurDimensions,
} from '@/dimension/queries/loadIndicateurDimensions'
import { type BucketKey, compareBuckets } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { type PointInterne, resolveSerieIndividu } from '@/valeurAvancement/resolveSerieIndividu'
import {
  type ObjectifBrut,
  resolveTauxProgression,
  type TauxProgressionPoint,
} from '@/valeurAvancement/resolveTauxProgression'

const cleMembres = (publicIds: ReadonlyArray<string>): string => [...publicIds].sort().join('~')

// Projection d'une cellule sur le sous-cube des objectifs (cf. dimensions-design.md
// « Taux de progression ») : le taux n'existe que si les coordonnées hors
// sous-cube sont absentes (marginales). Renvoie la cellule d'objectif, ou null.
const projeterSurObjectifs = async ({
  cellules,
  dimensions,
}: {
  cellules: ReadonlyArray<string>
  dimensions: ReadonlyArray<DimensionIndicateur>
}): Promise<Map<string, string | null>> => {
  const projection = new Map<string, string | null>()
  if (dimensions.length <= 1) {
    for (const cellule of cellules) projection.set(cellule, cellule)
    return projection
  }
  const niveauxObjectifs = new Set(
    dimensionsObjectifs(dimensions).flatMap((d) => d.niveaux.map((n) => n.referentielId)),
  )
  const membres = await db().individu.findMany({
    where: { publicId: { in: [...new Set(cellules.flatMap(parseCelluleId))] } },
    select: { publicId: true, referentielId: true },
  })
  const referentielParPublicId = new Map(membres.map((m) => [m.publicId, m.referentielId]))
  for (const cellule of cellules) {
    const publicIds = parseCelluleId(cellule)
    const horsSousCube = publicIds.some(
      (publicId) => !niveauxObjectifs.has(referentielParPublicId.get(publicId) ?? ''),
    )
    projection.set(cellule, horsSousCube ? null : cellule)
  }
  return projection
}

// Pipeline complet de calcul du taux de progression pour un indicateur et un
// lot de cellules : charge les contextes (série dérivée + objectifs), résout
// série et objectifs par cellule, et applique le resolver pur. Buckets de
// valeurs et d'objectifs sont indépendamment paramétrables (la contrainte
// `dateTruncObjectif >= dateTruncValeur` est validée en amont côté schema).
// Mutualisé entre la query "liste pour un indicateur" et la query "agrégat
// collection" (cf. `docs/architecture/taux-progression.md`).
export const computeTauxProgressionPoints = async ({
  indicateurId,
  cellules,
  dateTruncValeur,
  dateTruncObjectif,
}: {
  indicateurId: string
  cellules: ReadonlyArray<string>
  dateTruncValeur: DateTrunc
  dateTruncObjectif: DateTrunc
}): Promise<TauxProgressionPoint[]> => {
  if (cellules.length === 0) return []
  const dimensions = await loadIndicateurDimensions(indicateurId)
  const projection = await projeterSurObjectifs({ cellules, dimensions })
  const cellulesObjectifs = [
    ...new Set([...projection.values()].filter((c): c is string => c !== null)),
  ]

  const [serie, objectif] = await Promise.all([
    loadContexteSerie({ indicateurId, cellules, dateTrunc: dateTruncValeur, dimensions }),
    loadContexteObjectif({
      indicateurId,
      cellules: cellulesObjectifs,
      dateTrunc: dateTruncObjectif,
      dimensions,
    }),
  ])
  const objectifParMembres = new Map(
    objectif.cibles.map((cible) => [cleMembres(parseCelluleId(cible.publicId)), cible]),
  )
  const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
  const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()

  const valeurs: Parameters<typeof resolveTauxProgression>[0]['valeurs'][number][] = []
  const objectifsParIndividu = new Map<string, ObjectifBrut[]>()

  for (const cible of serie.cibles) {
    const points = await resolveSerieIndividu(cible.id, serie.ctx, serieCache)
    for (const point of points) {
      valeurs.push({
        individuId: cible.id,
        individuPublicId: cible.publicId,
        date: point.bucket,
        valeur: point.valeur,
      })
    }

    const celluleDemandee = [...projection.keys()].find(
      (cellule) =>
        cleMembres(parseCelluleId(cellule)) === cleMembres(parseCelluleId(cible.publicId)),
    )
    const celluleObjectif = celluleDemandee ? projection.get(celluleDemandee) : null
    const cibleObjectif = celluleObjectif
      ? objectifParMembres.get(cleMembres(parseCelluleId(celluleObjectif)))
      : undefined
    if (!cibleObjectif) continue
    const objectifsMap = resolveObjectifIndividu(cibleObjectif.id, objectif.ctx, objectifCache)
    if (objectifsMap.size === 0) continue
    const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
      .map((point) => ({ dateCible: point.bucket, valeurCible: point.valeur }))
      .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
    objectifsParIndividu.set(cible.id, objectifsList)
  }

  return resolveTauxProgression({ valeurs, objectifsParIndividu })
}
