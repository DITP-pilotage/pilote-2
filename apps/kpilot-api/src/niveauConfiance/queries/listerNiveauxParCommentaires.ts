import {
  type ListerNiveauxConfianceQuery,
  type NiveauConfianceListApiModel,
} from '@pilote/kpilot-shared/niveauConfiance'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { filtreVisibiliteCommentaire } from '@/commentaire/visibilite'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'

type Params<P extends Record<string, string>> = {
  params: P
  query: ListerNiveauxConfianceQuery
}

// Renvoie les niveaux de confiance des commentaires demandés (par id), restreints
// aux commentaires visibles du périmètre (publiés + brouillons du principal).
export const listerNiveauxParCommentaires = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, query }: Params<P>,
): ResultAsync<NiveauConfianceListApiModel, never> => {
  if (query.commentaires.length === 0) {
    return ResultAsync.fromSafePromise(
      Promise.resolve({ items: [], pagination: { cursor: null, hasMore: false }, total: 0 }),
    )
  }
  const principalId = requireCurrentPrincipalId()
  const where: Prisma.NiveauConfianceWhereInput = {
    commentaireId: { in: query.commentaires },
    commentaire: {
      AND: [config.whereLecture(params, principalId), filtreVisibiliteCommentaire(principalId)],
    },
  }
  return ResultAsync.fromSafePromise(
    db().niveauConfiance.findMany({
      where,
      orderBy: { id: 'desc' },
      include: niveauConfianceInclude,
    }),
  ).map((rows) => ({
    items: rows.map(toNiveauConfianceApiModel),
    pagination: { cursor: null, hasMore: false },
    total: rows.length,
  }))
}
