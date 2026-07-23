import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { type BucketKey, compareBuckets } from '@/framework/bucket'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'
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
  individusCibles,
  dateTruncValeur,
  dateTruncObjectif,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTruncValeur: DateTrunc
  dateTruncObjectif: DateTrunc
}): Promise<TauxProgressionPoint[]> => {
  if (individusCibles.length === 0) return []

  const [{ ctx: serieCtx }, { ctx: objectifCtx }] = await Promise.all([
    loadResolveSerieContext({
      indicateurId,
      individusCibles,
      dateTrunc: dateTruncValeur,
    }),
    loadResolveObjectifContext({
      indicateurId,
      individusCibles,
      dateTrunc: dateTruncObjectif,
    }),
  ])
  const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
  const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()

  const valeurs: ValeurBrute[] = []
  const objectifsParIndividu = new Map<string, ObjectifBrut[]>()

  for (const cible of individusCibles) {
    const serie = await resolveSerieIndividu(cible.id, serieCtx, serieCache)
    for (const point of serie) {
      valeurs.push({
        individuId: cible.id,
        individuPublicId: cible.publicId,
        date: point.bucket,
        valeur: point.valeur,
      })
    }

    const objectifsMap = resolveObjectifIndividu(cible.id, objectifCtx, objectifCache)
    if (objectifsMap.size === 0) continue
    const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
      .map((point) => ({ dateCible: point.bucket, valeurCible: point.valeur }))
      .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
    objectifsParIndividu.set(cible.id, objectifsList)
  }

  return resolveTauxProgression({ valeurs, objectifsParIndividu })
}
