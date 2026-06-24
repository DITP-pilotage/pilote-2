import { type ListerCommentairesQuery } from '@pilote/mb-shared/commentaire'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { panierIndividuConfig } from '@/commentaire/sujets'

type Input = {
  params: { panierId: string; individuId: string }
  query: ListerCommentairesQuery
}

export const listerPanierIndividuCommentaires = (input: Input) =>
  listerCommentaires(panierIndividuConfig, input)
