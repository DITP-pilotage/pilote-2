import {
  type ListTauxProgressionQuery,
  type TauxProgressionListApiModel,
  type TauxProgressionPointApiModel,
} from '@pilote/mb-shared/tauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import {
  type ObjectifBrut,
  resolveTauxProgression,
  type ValeurBrute,
} from '@/tauxProgression/resolveTauxProgression'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'

// Bucket de référence unique pour aligner valeurs et objectifs. Le mois est
// un compromis entre granularité d'affichage et coût de carry-forward sur les
// gros arbres (cf. doc archi `taux-progression.md`).
const DATE_TRUNC = 'month' as const

export const listTauxProgressionForIndicateur = (
  indicateurPublicId: string,
  params: ListTauxProgressionQuery,
): ResultAsync<TauxProgressionListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  ).andThen((indicateur) => ResultAsync.fromSafePromise(buildList({ indicateur, params })))
}

const buildList = async ({
  indicateur,
  params,
}: {
  indicateur: { id: string; publicId: string }
  params: ListTauxProgressionQuery
}): Promise<TauxProgressionListApiModel> => {
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const [{ ctx: serieCtx }, { ctx: objectifCtx }] = await Promise.all([
    loadResolveSerieContext({ indicateurId: indicateur.id, cibles: individusCibles, dateTrunc: DATE_TRUNC }),
    loadResolveObjectifContext({ indicateurId: indicateur.id, cibles: individusCibles, dateTrunc: DATE_TRUNC }),
  ])
  const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
  const objectifCache = new Map<string, ReadonlyMap<string, PointObjectifInterne>>()

  const valeurs: ValeurBrute[] = []
  const objectifsParIndividu = new Map<string, ObjectifBrut[]>()

  for (const cible of individusCibles) {
    const serie = await resolveSerieIndividu(cible.id, serieCtx, serieCache)
    for (const point of serie) {
      valeurs.push(toValeurBrute({ cible, point }))
    }

    const objectifsMap = resolveObjectifIndividu(cible.id, objectifCtx, objectifCache)
    const objectifsList = toObjectifBruts(objectifsMap)
    if (objectifsList.length > 0) {
      objectifsParIndividu.set(cible.id, objectifsList)
    }
  }

  const points = resolveTauxProgression({ valeurs, objectifsParIndividu })

  // Filtres dateDebut/dateFin appliqués en sortie pour ne pas perturber le
  // carry-forward des séries dérivées (cf. design doc indicateur-derives.md).
  const filtered = points.filter((p) => {
    if (params.dateDebut && p.date < params.dateDebut) return false
    if (params.dateFin && p.date > params.dateFin) return false
    return true
  })

  filtered.sort((a, b) =>
    a.individuPublicId !== b.individuPublicId
      ? a.individuPublicId.localeCompare(b.individuPublicId)
      : a.date.localeCompare(b.date),
  )

  const items: TauxProgressionPointApiModel[] = filtered.map((p) => ({
    indicateur: indicateur.publicId,
    individu: p.individuPublicId,
    date: p.date,
    valeur: p.valeur.toNumber(),
    valeurCible: p.valeurCible.toNumber(),
    dateCible: p.dateCible,
    tauxProgression: p.tauxProgression,
  }))

  return { items }
}

const toValeurBrute = ({
  cible,
  point,
}: {
  cible: IndividuRef
  point: PointInterne
}): ValeurBrute => ({
  individuId: cible.id,
  individuPublicId: cible.publicId,
  date: point.bucket,
  valeur: point.valeur,
})

const toObjectifBruts = (
  objectifsMap: ReadonlyMap<string, PointObjectifInterne>,
): ObjectifBrut[] =>
  [...objectifsMap.entries()]
    .map(([dateCible, point]) => ({ dateCible, valeurCible: point.valeur }))
    .sort((a, b) => a.dateCible.localeCompare(b.dateCible))
