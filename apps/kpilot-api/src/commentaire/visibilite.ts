import { type CommentaireStatut } from '@pilote/kpilot-shared/commentaire'

import { type Prisma } from '@/generated/prisma/client'

// Règle de visibilité d'un commentaire pour le principal courant :
// - les PUBLIE sont visibles par tous (ceux qui ont la permission de lecture du sujet) ;
// - les BROUILLON ne sont visibles que par leur auteur.
// `statut` restreint en plus à un seul statut (pour des appels séparés brouillon/publié).
export const filtreVisibiliteCommentaire = (
  principalId: string,
  statut?: CommentaireStatut,
): Prisma.CommentaireWhereInput => {
  if (statut === 'BROUILLON') return { statut: 'BROUILLON', createdBy: principalId }
  if (statut === 'PUBLIE') return { statut: 'PUBLIE' }
  return { OR: [{ statut: 'PUBLIE' }, { statut: 'BROUILLON', createdBy: principalId }] }
}
