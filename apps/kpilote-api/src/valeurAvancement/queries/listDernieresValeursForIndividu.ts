import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type DernieresValeursIndividuListApiModel,
  type DernierValeurIndividuApiModel,
  type ListDernieresValeursForIndividuQuery,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { withConcurrency } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

type ListDernieresValeursForIndividuParams = {
  individuPublicId: string
  query: ListDernieresValeursForIndividuQuery
}

export const listDernieresValeursForIndividu = (
  params: ListDernieresValeursForIndividuParams,
): ResultAsync<DernieresValeursIndividuListApiModel, never> =>
  ResultAsync.fromSafePromise(build(params))

const build = async ({
  individuPublicId,
  query,
}: ListDernieresValeursForIndividuParams): Promise<DernieresValeursIndividuListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const individuRow = await db().individu.findUnique({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true, referentielId: true },
  })
  if (!individuRow) return { items: [] }
  const individu: IndividuRef = individuRow

  const indicateurs = await db().indicateur.findMany({
    where: withIndicateurReadPermission({ publicId: { in: [...query.indicateurs] } }, principalId),
    select: { id: true, publicId: true },
  })
  if (indicateurs.length === 0) return { items: [] }

  const startedAt = performance.now()
  const dateTrunc = DEFAULT_DATE_TRUNC
  // Un contexte de résolution par indicateur : on borne ceux qui vivent en même temps.
  const resolved = await withConcurrency(
    indicateurs.map((indicateur) => async () => {
      const { serieOf } = await loadResolveSerieContext({
        indicateurId: indicateur.id,
        individusCibles: [individu],
        dateTrunc,
        lastPointCount: 1,
      })
      const lastPoint = serieOf(individu).at(-1)
      if (!lastPoint) return null

      const item: DernierValeurIndividuApiModel = {
        indicateur: indicateur.publicId,
        valeur: lastPoint.valeur.toNumber(),
        date: formatBucket(lastPoint.bucket),
        type: lastPoint.type,
      }
      return item
    }),
  )
  const items = resolved.filter((item): item is DernierValeurIndividuApiModel => item !== null)

  logger.info(
    {
      event: 'valeurAvancement.listDernieresValeursForIndividu.timing',
      individuId: individu.id,
      nbIndicateursDemandes: query.indicateurs.length,
      nbIndicateursAccessibles: indicateurs.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listDernieresValeursForIndividu computed',
  )
  return { items }
}
