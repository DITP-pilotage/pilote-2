import { type ListerCommentairesQuery } from '@pilote/kpilot-shared/commentaire'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { panierConfig } from '@/panier/commands/creerPanierCommentaire'

type Input = {
  params: { panierId: string }
  query: ListerCommentairesQuery
}

export const listerPanierCommentaires = (input: Input) => listerCommentaires(panierConfig, input)
