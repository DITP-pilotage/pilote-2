import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type ListTauxProgressionIndividuQuery,
  type TauxProgressionIndividuListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { formatBucket } from '@/framework/bucket'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'
import { computeTauxProgressionPoints } from '@/valeurAvancement/queries/computeTauxProgressionPoints'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

export const listTauxProgressionForIndividu = (
  individuPublicId: string,
  params: ListTauxProgressionIndividuQuery,
): ResultAsync<TauxProgressionIndividuListApiModel, never> =>
  ResultAsync.fromSafePromise(build(individuPublicId, params))

const build = async (
  individuPublicId: string,
  params: ListTauxProgressionIndividuQuery,
): Promise<TauxProgressionIndividuListApiModel> => {
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
      const points = await computeTauxProgressionPoints({
        indicateurId: indicateur.id,
        individusCibles: [individu],
        dateTruncValeur: dateTrunc,
        dateTruncObjectif: dateTrunc,
      })
      const point = points.at(-1)
      if (!point) return null

      return {
        indicateur: indicateur.publicId,
        tauxProgression: point.tauxProgression,
        valeurCible: point.valeurCible.toNumber(),
        dateCible: formatBucket(point.dateCible),
      }
    }),
  )

  const items = resolus.filter((item) => item !== null)

  logger.info(
    {
      event: 'valeurAvancement.listTauxProgressionForIndividu.timing',
      individuId: individu.id,
      nbIndicateursDemandes: params.indicateurs.length,
      nbIndicateursAccessibles: indicateurs.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listTauxProgressionForIndividu computed',
  )
  return { items }
}
