import { type DateTrunc } from '@pilote/mb-shared/dates'
import {
  type DernieresValeursIndividuListApiModel,
  type DernierValeurIndividuApiModel,
  type ListDernieresValeursForIndividuQuery,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'

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
      const { ctx } = await loadResolveSerieContext({
        indicateurId: indicateur.id,
        cibles: [individu],
        dateTrunc,
      })
      const cache = new Map<string, ReadonlyArray<PointInterne>>()
      const serie = await resolveSerieIndividu(individu.id, ctx, cache)
      const dernier = serie.at(-1)
      if (!dernier) return null
      const item: DernierValeurIndividuApiModel = {
        indicateur: indicateur.publicId,
        valeur: dernier.valeur.toNumber(),
        date: formatBucket(dernier.bucket),
        type: dernier.type,
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
