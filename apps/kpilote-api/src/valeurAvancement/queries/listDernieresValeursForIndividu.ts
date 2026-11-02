import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type DernieresValeursIndividuListApiModel,
  type DernierValeurIndividuApiModel,
  type ListDernieresValeursForIndividuQuery,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { loadContexteSerie } from '@/dimension/queries/loadContexteResolution'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { type PointInterne, resolveSerieIndividu } from '@/valeurAvancement/resolveSerieIndividu'

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

  const indicateurs = await db().indicateur.findMany({
    where: withIndicateurReadPermission({ publicId: { in: [...params.indicateurs] } }, principalId),
    select: { id: true, publicId: true },
  })
  if (indicateurs.length === 0) return { items: [] }

  const startedAt = performance.now()
  const dateTrunc = DEFAULT_DATE_TRUNC
  const resolus = await Promise.all(
    indicateurs.map(async (indicateur) => {
      // La cellule (un individu, ou `DEPT-84~OP-ORANGE`) est utilisée telle
      // quelle par indicateur ; invalide pour l'indicateur → indicateur omis.
      const { ctx: serieCtx, cibles } = await loadContexteSerie({
        indicateurId: indicateur.id,
        cellules: [individuPublicId],
        dateTrunc,
      })
      const cible = cibles[0]
      if (!cible) return null

      const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
      const serie = await resolveSerieIndividu(cible.id, serieCtx, serieCache)
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
      cellule: individuPublicId,
      nbIndicateursDemandes: params.indicateurs.length,
      nbIndicateursAccessibles: indicateurs.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listDernieresValeursForIndividu computed',
  )
  return { items }
}
