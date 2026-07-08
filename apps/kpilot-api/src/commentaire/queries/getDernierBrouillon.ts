import { type BrouillonApiModel, type RecupererBrouillonQuery } from '@pilote/kpilot-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { filtreParType } from '@/commentaire/queries/filtres'
import { filtreVisibiliteCommentaire } from '@/commentaire/visibilite'
import { commentaireInclude, toCommentaireApiModel } from '@/commentaire/utils'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

type Params<P extends Record<string, string>> = {
  params: P
  query: RecupererBrouillonQuery
}

// Renvoie le dernier brouillon du principal courant pour le sujet + type, ou null.
export const getDernierBrouillon = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, query }: Params<P>,
): ResultAsync<BrouillonApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where: Prisma.CommentaireWhereInput = {
    AND: [
      config.whereLecture(params, principalId),
      filtreParType(query.type),
      filtreVisibiliteCommentaire(principalId, 'BROUILLON'),
    ],
  }
  return ResultAsync.fromSafePromise(
    db().commentaire.findFirst({ where, orderBy: { id: 'desc' }, include: commentaireInclude }),
  ).map((row) => (row ? toCommentaireApiModel(row) : null))
}
