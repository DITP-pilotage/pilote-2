import { type ListerCommentairesQuery } from '@pilote/kpilote-shared/commentaire'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { collectionConfig } from '@/collection/commands/creerCollectionCommentaire'

type Input = {
  params: { collectionId: string }
  query: ListerCommentairesQuery
}

export const listerCollectionCommentaires = (input: Input) =>
  listerCommentaires(collectionConfig, input)
