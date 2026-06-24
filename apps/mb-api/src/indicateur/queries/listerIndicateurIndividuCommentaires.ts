import { type ListerCommentairesQuery } from '@pilote/mb-shared/commentaire'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { indicateurIndividuConfig } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'

type Input = {
  params: { indicateurId: string; individuId: string }
  query: ListerCommentairesQuery
}

export const listerIndicateurIndividuCommentaires = (input: Input) =>
  listerCommentaires(indicateurIndividuConfig, input)
