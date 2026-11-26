import {
  type DernierNiveauConfianceApiModel,
  type DerniersNiveauxConfianceListApiModel,
  type ListDerniersNiveauxConfianceQuery,
} from '@pilote/kpilote-shared/niveauConfiance'
import { keyBy } from 'es-toolkit'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { getDerniersNiveauxConfiance } from '@/generated/prisma/sql'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { resolveIndividusCibles } from '@/valeurAvancement/resolveIndividusCibles'

type ListDerniersNiveauxConfianceParams = {
  query: ListDerniersNiveauxConfianceQuery
}

export const listDerniersNiveauxConfiance = (
  params: ListDerniersNiveauxConfianceParams,
): ResultAsync<DerniersNiveauxConfianceListApiModel, never> =>
  ResultAsync.fromSafePromise(build(params))

const keyOf = ({ indicateurId, individuId }: { indicateurId: string; individuId: string }) =>
  `${indicateurId}:${individuId}`

const build = async ({
  query,
}: ListDerniersNiveauxConfianceParams): Promise<DerniersNiveauxConfianceListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const indicateurs = await db().indicateur.findMany({
    where: withIndicateurReadPermission({ publicId: { in: [...query.indicateurs] } }, principalId),
    select: { id: true, publicId: true },
  })
  const individusCibles = await resolveIndividusCibles({
    selectedPublicIds: query.individus,
    indicateurIds: indicateurs.map((indicateur) => indicateur.id),
  })
  const lectures = indicateurs.flatMap((indicateur) => {
    const individu = individusCibles.get(indicateur.id)
    return individu ? [{ indicateur, individu }] : []
  })
  if (lectures.length === 0) return { items: [] }

  // Une ligne au plus par couple : la requête ne lit que le dernier commentaire
  // publié, quelle que soit la profondeur de l'historique.
  const niveaux = await db().$queryRawTyped(
    getDerniersNiveauxConfiance(
      lectures.map(({ indicateur }) => indicateur.id),
      lectures.map(({ individu }) => individu.id),
    ),
  )
  const niveauByKey = keyBy(niveaux, keyOf)

  const items = lectures.flatMap(({ indicateur, individu }) => {
    const niveau = niveauByKey[keyOf({ indicateurId: indicateur.id, individuId: individu.id })]
    if (!niveau) return []
    const item: DernierNiveauConfianceApiModel = {
      indicateur: indicateur.publicId,
      individu: individu.publicId,
      indice: niveau.indice,
    }
    return [item]
  })
  return { items }
}
