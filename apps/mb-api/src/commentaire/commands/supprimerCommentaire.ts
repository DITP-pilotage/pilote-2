import { ResultAsync } from 'neverthrow'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { db } from '@/framework/persistence/dbStore'

export const supprimerCommentaire = (commentaireId: string): ResultAsync<void, never> =>
  resolveCommentairePourEcriture(commentaireId).andThen(() =>
    ResultAsync.fromSafePromise(
      db()
        .commentaire.delete({ where: { id: commentaireId } })
        .then(() => undefined),
    ),
  )
