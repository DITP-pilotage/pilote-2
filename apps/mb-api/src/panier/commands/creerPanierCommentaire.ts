import { type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { panierConfig } from '@/commentaire/sujets'

type Input = {
  params: { panierId: string }
  body: CreerCommentaireBody
}

export const creerPanierCommentaire = (input: Input) => creerCommentaire(panierConfig, input)
