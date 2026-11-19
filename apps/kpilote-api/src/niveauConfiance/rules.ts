import { err, ok, type Result } from 'neverthrow'

import { type CommentaireType } from '@/commentaire/hasBrouillon'

export type CommentairePasConfianceError = { type: 'COMMENTAIRE_PAS_CONFIANCE' }

// Un niveau de confiance précise un commentaire de type CONFIANCE, et aucun autre.
export const checkCommentaireConfiance = ({
  typeCommentaire,
}: {
  // null : commentaire sans sujet rattaché.
  typeCommentaire: CommentaireType | null
}): Result<void, CommentairePasConfianceError> => {
  if (typeCommentaire !== 'CONFIANCE') return err({ type: 'COMMENTAIRE_PAS_CONFIANCE' })
  return ok()
}
