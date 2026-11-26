import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'

import { type BucketKey, compareBuckets } from '@/framework/bucket'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  type ResolveObjectifContext,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { type IndividuRef, type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'
import {
  type ObjectifBrut,
  resolveTauxProgression,
  type TauxProgressionPoint,
  type ValeurBrute,
} from '@/valeurAvancement/resolveTauxProgression'

// Pipeline complet de calcul du taux de progression pour un indicateur et un
// lot de cibles : charge les contextes (série dérivée + objectifs), résout
// série et objectifs par individu, et applique le resolver pur. Buckets de
// valeurs et d'objectifs sont indépendamment paramétrables (la contrainte
// `dateTruncObjectif >= dateTruncValeur` est validée en amont côté schema).
// Mutualisé entre la query "liste pour un indicateur" et la query "agrégat
// collection" (cf. `docs/architecture/taux-progression.md`).
export const computeTauxProgressionPoints = async ({
  indicateurId,
  sensSouhaite,
  individusCibles,
  dateTruncValeur,
  dateTruncObjectif,
  lastPointCount = null,
}: {
  indicateurId: string
  sensSouhaite: SensSouhaite
  individusCibles: ReadonlyArray<IndividuRef>
  dateTruncValeur: DateTrunc
  dateTruncObjectif: DateTrunc
  // Nombre de derniers points de valeur à rendre par cible ; null pour toute la série.
  lastPointCount?: number | null
}): Promise<TauxProgressionPoint[]> => {
  if (individusCibles.length === 0) return []

  // Indicateur à axes : la série d'un individu est « Tous » (la marginale), le
  // taux est donc marginale / objectif de l'individu (D6).
  const [{ serieOf }, { ctx: objectifCtx }] = await Promise.all([
    loadResolveSerieContext({
      indicateurId,
      individusCibles,
      dateTrunc: dateTruncValeur,
      lastPointCount,
    }),
    loadResolveObjectifContext({
      indicateurId,
      individusCibles,
      dateTrunc: dateTruncObjectif,
    }),
  ])
  return buildTauxProgressionPoints({ individusCibles, serieOf, objectifCtx, sensSouhaite })
}

// Le calcul pur, sur des séries et des objectifs déjà chargés : un appelant qui a
// déjà résolu les séries n'a pas à les recharger.
export const buildTauxProgressionPoints = ({
  individusCibles,
  serieOf,
  objectifCtx,
  sensSouhaite,
}: {
  individusCibles: ReadonlyArray<IndividuRef>
  serieOf: (individu: IndividuRef) => ReadonlyArray<PointInterne>
  objectifCtx: ResolveObjectifContext
  sensSouhaite: SensSouhaite
}): TauxProgressionPoint[] => {
  const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()

  const valeurs: ValeurBrute[] = []
  const objectifsByIndividu = new Map<string, ObjectifBrut[]>()

  for (const cible of individusCibles) {
    for (const point of serieOf(cible)) {
      valeurs.push({
        individuId: cible.id,
        individuPublicId: cible.publicId,
        date: point.bucket,
        valeur: point.valeur,
      })
    }

    const objectifsMap = resolveObjectifIndividu({
      individuId: cible.id,
      ctx: objectifCtx,
      cache: objectifCache,
    })
    if (objectifsMap.size === 0) continue
    const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
      .map((point) => ({ dateCible: point.bucket, valeurCible: point.valeur }))
      .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
    objectifsByIndividu.set(cible.id, objectifsList)
  }

  return resolveTauxProgression({ valeurs, objectifsByIndividu, sensSouhaite })
}
