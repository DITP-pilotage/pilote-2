import { type ListerCommentairesQuery } from '@pilote/kpilote-shared/commentaire'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { dossierConfig } from '@/dossier/commands/creerDossierCommentaire'

type Input = {
  params: { dossierId: string }
  query: ListerCommentairesQuery
}

export const listerDossierCommentaires = (input: Input) => listerCommentaires(dossierConfig, input)
