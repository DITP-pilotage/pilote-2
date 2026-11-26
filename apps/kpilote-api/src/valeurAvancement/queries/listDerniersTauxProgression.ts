import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type ListDerniersTauxProgressionQuery,
  type DernierTauxProgressionApiModel,
  type DerniersTauxProgressionListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { formatBucket } from '@/framework/bucket'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { withConcurrency } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeTauxProgressionPoints } from '@/valeurAvancement/computeTauxProgressionPoints'
import { resolveIndividusCibles } from '@/valeurAvancement/resolveIndividusCibles'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

type ListDerniersTauxProgressionParams = {
  query: ListDerniersTauxProgressionQuery
}

export const listDerniersTauxProgression = (
  params: ListDerniersTauxProgressionParams,
): ResultAsync<DerniersTauxProgressionListApiModel, never> =>
  ResultAsync.fromSafePromise(build(params))

const build = async ({
  query,
}: ListDerniersTauxProgressionParams): Promise<DerniersTauxProgressionListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const indicateurs = await db().indicateur.findMany({
    where: withIndicateurReadPermission({ publicId: { in: [...query.indicateurs] } }, principalId),
    select: { id: true, publicId: true, sensSouhaite: true },
  })
  const individusCibles = await resolveIndividusCibles({
    selectedPublicIds: query.individus,
    indicateurIds: indicateurs.map((indicateur) => indicateur.id),
  })

  const startedAt = performance.now()
  const dateTrunc = DEFAULT_DATE_TRUNC
  // Un contexte de résolution par indicateur : on borne ceux qui vivent en même temps.
  const resolved = await withConcurrency(
    indicateurs.map((indicateur) => async () => {
      const individu = individusCibles.get(indicateur.id)
      if (!individu) return null

      const points = await computeTauxProgressionPoints({
        indicateurId: indicateur.id,
        sensSouhaite: indicateur.sensSouhaite,
        individusCibles: [individu],
        dateTruncValeur: dateTrunc,
        dateTruncObjectif: dateTrunc,
        lastPointCount: 1,
      })
      const point = points.at(-1)
      if (!point) return null

      const item: DernierTauxProgressionApiModel = {
        indicateur: indicateur.publicId,
        individu: individu.publicId,
        tauxProgression: point.tauxProgression,
        valeurCible: point.valeurCible.toNumber(),
        dateCible: formatBucket(point.dateCible),
      }
      return item
    }),
  )

  const items = resolved.filter((item) => item !== null)

  logger.info(
    {
      event: 'valeurAvancement.listDerniersTauxProgression.timing',
      individus: query.individus ?? null,
      nbIndicateursDemandes: query.indicateurs.length,
      nbIndicateursAccessibles: indicateurs.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listDerniersTauxProgression computed',
  )
  return { items }
}
