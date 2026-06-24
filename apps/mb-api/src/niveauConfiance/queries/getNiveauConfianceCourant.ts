import { type NiveauConfianceApiModel } from '@pilote/mb-shared/niveauConfiance'
import { ResultAsync } from 'neverthrow'

import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

// Courant = dernier NiveauConfiance dont le commentaire est PUBLIE sur le scope.
// Renvoie 404 (P2025) si aucun.
export const getNiveauConfianceCourant = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params }: { params: P },
): ResultAsync<NiveauConfianceApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().niveauConfiance.findFirstOrThrow({
      where: {
        commentaire: {
          AND: [config.whereLecture(params, principalId), { statut: 'PUBLIE' }],
        },
      },
      orderBy: { id: 'desc' },
      include: niveauConfianceInclude,
    }),
  ).map(toNiveauConfianceApiModel)
}
