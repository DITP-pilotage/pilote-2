import { type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { panierIndividuConfig } from '@/commentaire/sujets'

type Input = {
  params: { panierId: string; individuId: string }
  body: CreerCommentaireBody
}

export const creerPanierIndividuCommentaire = (input: Input) =>
  creerCommentaire(panierIndividuConfig, input)
