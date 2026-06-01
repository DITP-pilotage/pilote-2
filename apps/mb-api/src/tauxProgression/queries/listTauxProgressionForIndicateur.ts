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
import { resolveTauxProgression } from '@/tauxProgression/resolveTauxProgression'
import {
  loadObjectifs,
  loadValeursAvancement,
} from '@/tauxProgression/queries/loadTauxProgressionData'

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

  const [valeurs, objectifsParIndividu] = await Promise.all([
    loadValeursAvancement(indicateur.id, individusCibles, params),
    loadObjectifs(
      indicateur.id,
      individusCibles.map((i) => i.id),
    ),
  ])

  const points = resolveTauxProgression({ valeurs, objectifsParIndividu })

  points.sort((a, b) =>
    a.individuPublicId !== b.individuPublicId
      ? a.individuPublicId.localeCompare(b.individuPublicId)
      : a.date.localeCompare(b.date),
  )

  const items: TauxProgressionPointApiModel[] = points.map((p) => ({
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
