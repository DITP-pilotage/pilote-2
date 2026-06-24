import { type NiveauConfianceApiModel } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/commentaire/utils'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

const CONFIANCE: Prisma.CommentaireWhereInput = {
  OR: [
    { indicateurIndividu: { type: 'CONFIANCE' } },
    { panierIndividu: { type: 'CONFIANCE' } },
    { panier: { type: 'CONFIANCE' } },
  ],
}

// Courant = dernier commentaire CONFIANCE publié du scope (par id desc = antichrono).
// Renvoie 404 (P2025) si aucun.
export const getNiveauConfianceCourant = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params }: { params: P },
): ResultAsync<NiveauConfianceApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().commentaire.findFirstOrThrow({
      where: { AND: [config.whereLecture(params, principalId), CONFIANCE, { statut: 'PUBLIE' }] },
      orderBy: { id: 'desc' },
      include: niveauConfianceInclude,
    }),
  ).map(toNiveauConfianceApiModel)
}
