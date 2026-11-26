import {
  type DernierNiveauConfianceApiModel,
  type DerniersNiveauxConfianceListApiModel,
  type ListDerniersNiveauxConfianceQuery,
} from '@pilote/kpilote-shared/niveauConfiance'
import { keyBy } from 'es-toolkit'
import { ResultAsync } from 'neverthrow'

import { filtreVisibiliteCommentaire } from '@/commentaire/visibilite'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { IndicateurIndividuCommentaireType } from '@/generated/prisma/enums'
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

// Même lecture que la fiche indicateur : le niveau affiché est celui du dernier
// commentaire CONFIANCE publié. Si ce commentaire n'en porte pas, on ne remonte
// pas vers un commentaire plus ancien.
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

  const derniersCommentaires = await db().indicateurIndividuCommentaire.findMany({
    where: {
      type: IndicateurIndividuCommentaireType.CONFIANCE,
      commentaire: filtreVisibiliteCommentaire(principalId, 'PUBLIE'),
      OR: lectures.map(({ indicateur, individu }) => ({
        indicateurId: indicateur.id,
        individuId: individu.id,
      })),
    },
    // uuidv7 → antichronologique : `distinct` garde le dernier commentaire de chaque couple.
    orderBy: { commentaireId: 'desc' },
    distinct: ['indicateurId', 'individuId'],
    include: {
      commentaire: { include: { niveauxConfiance: { orderBy: { id: 'desc' }, take: 1 } } },
    },
  })
  const dernierCommentaireByKey = keyBy(derniersCommentaires, keyOf)

  const items = lectures.flatMap(({ indicateur, individu }) => {
    const dernierCommentaire =
      dernierCommentaireByKey[keyOf({ indicateurId: indicateur.id, individuId: individu.id })]
    const niveau = dernierCommentaire?.commentaire.niveauxConfiance[0]
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
