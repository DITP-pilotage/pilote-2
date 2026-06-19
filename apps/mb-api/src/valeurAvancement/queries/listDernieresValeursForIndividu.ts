import { type DateTrunc } from '@pilote/mb-shared/dates'
import {
  type DernieresValeursIndividuListApiModel,
  type DernierValeurIndividuApiModel,
  type ListDernieresValeursForIndividuQuery,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type BucketKey, compareBuckets, formatBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
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
} from '@/valeurAvancement/resolveTauxProgression'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

export const listDernieresValeursForIndividu = (
  individuPublicId: string,
  params: ListDernieresValeursForIndividuQuery,
): ResultAsync<DernieresValeursIndividuListApiModel, never> =>
  ResultAsync.fromSafePromise(build(individuPublicId, params))

const build = async (
  individuPublicId: string,
  params: ListDernieresValeursForIndividuQuery,
): Promise<DernieresValeursIndividuListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const individuRow = await db().individu.findUnique({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true, referentielId: true },
  })
  if (!individuRow) return { items: [] }
  const individu: IndividuRef = individuRow

  const indicateurs = await db().indicateur.findMany({
    where: withIndicateurReadPermission({ publicId: { in: [...params.indicateurs] } }, principalId),
    select: { id: true, publicId: true },
  })
  if (indicateurs.length === 0) return { items: [] }

  const startedAt = performance.now()
  const dateTrunc = DEFAULT_DATE_TRUNC
  const resolus = await Promise.all(
    indicateurs.map(async (indicateur) => {
      const [{ ctx: serieCtx }, { ctx: objectifCtx }] = await Promise.all([
        loadResolveSerieContext({
          indicateurId: indicateur.id,
          individusCibles: [individu],
          dateTrunc,
        }),
        loadResolveObjectifContext({
          indicateurId: indicateur.id,
          individusCibles: [individu],
          dateTrunc,
        }),
      ])

      const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
      const serie = await resolveSerieIndividu(individu.id, serieCtx, serieCache)
      const dernier = serie.at(-1)
      if (!dernier) return null

      const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()
      const objectifsMap = resolveObjectifIndividu(individu.id, objectifCtx, objectifCache)
      let tauxProgression: number | null = null
      if (objectifsMap.size > 0) {
        const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
          .map((p) => ({ dateCible: p.bucket, valeurCible: p.valeur }))
          .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))
        const tauxPoints = resolveTauxProgression({
          valeurs: serie.map((p) => ({
            individuId: individu.id,
            individuPublicId: individu.publicId,
            date: p.bucket,
            valeur: p.valeur,
          })),
          objectifsParIndividu: new Map([[individu.id, objectifsList]]),
        })
        tauxProgression = tauxPoints.at(-1)?.tauxProgression ?? null
      }

      const item: DernierValeurIndividuApiModel = {
        indicateur: indicateur.publicId,
        valeur: dernier.valeur.toNumber(),
        date: formatBucket(dernier.bucket),
        type: dernier.type,
        tauxProgression,
      }
      return item
    }),
  )
  const items = resolus.filter((item): item is DernierValeurIndividuApiModel => item !== null)

  logger.info(
    {
      event: 'valeurAvancement.listDernieresValeursForIndividu.timing',
      individuId: individu.id,
      nbIndicateursDemandes: params.indicateurs.length,
      nbIndicateursAccessibles: indicateurs.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listDernieresValeursForIndividu computed',
  )
  return { items }
}
