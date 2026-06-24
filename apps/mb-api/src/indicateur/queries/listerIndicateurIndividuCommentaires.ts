import { type ListerCommentairesQuery } from '@pilote/mb-shared/commentaire'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { indicateurIndividuConfig } from '@/commentaire/sujets'

type Input = {
  params: { indicateurId: string; individuId: string }
  query: ListerCommentairesQuery
}

export const listerIndicateurIndividuCommentaires = (input: Input) =>
  listerCommentaires(indicateurIndividuConfig, input)
