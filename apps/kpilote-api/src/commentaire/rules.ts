import { type CommentaireStatut } from '@pilote/kpilote-shared/commentaire'
import { err, ok, type Result } from 'neverthrow'

export type BrouillonExistantError = { type: 'BROUILLON_EXISTANT' }

// Règle PIL-1585/1592 : un auteur a au plus un brouillon par sujet et par type ;
// il reprend celui qui existe plutôt que d'en ouvrir un second.
export const checkBrouillonUnique = ({
  statut,
  brouillonExistant,
}: {
  statut: CommentaireStatut
  brouillonExistant: boolean
}): Result<void, BrouillonExistantError> => {
  if (statut !== 'BROUILLON') return ok()
  if (brouillonExistant) return err({ type: 'BROUILLON_EXISTANT' })
  return ok()
}
