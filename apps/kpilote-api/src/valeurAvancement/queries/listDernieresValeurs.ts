import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import {
  type DernieresValeursListApiModel,
  type DerniereValeurApiModel,
  type ListDernieresValeursQuery,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { withConcurrency } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeVariation } from '@/valeurAvancement/computeVariation'
import { loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { resolveIndividusCibles } from '@/valeurAvancement/resolveIndividusCibles'

const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

type ListDernieresValeursParams = {
  query: ListDernieresValeursQuery
}

export const listDernieresValeurs = (
  params: ListDernieresValeursParams,
): ResultAsync<DernieresValeursListApiModel, never> => ResultAsync.fromSafePromise(build(params))

const build = async ({
  query,
}: ListDernieresValeursParams): Promise<DernieresValeursListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const indicateurs = await db().indicateur.findMany({
    where: withIndicateurReadPermission({ publicId: { in: [...query.indicateurs] } }, principalId),
    select: { id: true, publicId: true },
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

      const { serieOf } = await loadResolveSerieContext({
        indicateurId: indicateur.id,
        individusCibles: [individu],
        dateTrunc,
        lastPointCount: 2,
      })
      const serie = serieOf(individu)
      const lastPoint = serie.at(-1)
      if (!lastPoint) return null
      const previousPoint = serie.at(-2)

      const item: DerniereValeurApiModel = {
        indicateur: indicateur.publicId,
        individu: individu.publicId,
        valeur: lastPoint.valeur.toNumber(),
        date: formatBucket(lastPoint.bucket),
        type: lastPoint.type,
        precedente: previousPoint
          ? { valeur: previousPoint.valeur.toNumber(), date: formatBucket(previousPoint.bucket) }
          : null,
        // computeVariation attend [recente, precedente] ; la série est ASC par bucket.
        variation: computeVariation(serie.slice(-2).reverse()),
      }
      return item
    }),
  )
  const items = resolved.filter((item): item is DerniereValeurApiModel => item !== null)

  logger.info(
    {
      event: 'valeurAvancement.listDernieresValeurs.timing',
      individus: query.individus ?? null,
      nbIndicateursDemandes: query.indicateurs.length,
      nbIndicateursAccessibles: indicateurs.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listDernieresValeurs computed',
  )
  return { items }
}
