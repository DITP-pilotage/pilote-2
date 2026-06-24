import { type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { indicateurIndividuConfig } from '@/commentaire/sujets'

type Input = {
  params: { indicateurId: string; individuId: string }
  body: CreerCommentaireBody
}

export const creerIndicateurIndividuCommentaire = (input: Input) =>
  creerCommentaire(indicateurIndividuConfig, input)
