import { type CreerCommentaireBody } from '@pilote/kpilote-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type CommentaireType } from '@/commentaire/ensureBrouillonUnique'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import {
  ensureCollectionWriteCommentPermission,
  withCollectionReadPermission,
} from '@/collection/permissions'

type Params = { collectionId: string }

export const collectionConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: ({ collectionId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().collection.findFirstOrThrow({
        where: withCollectionReadPermission({ publicId: collectionId }, principalId),
        select: { id: true },
      }),
    ).andThen((collection) =>
      ensureCollectionWriteCommentPermission({ collectionId: collection.id, principalId }).map(
        () => ({
          principalId,
          satelliteCreate: (type: string) => ({
            collection: { create: { collectionId: collection.id, type: type as never } },
          }),
        }),
      ),
    )
  },
  whereLecture: ({ collectionId }, principalId) => ({
    collection: {
      collection: withCollectionReadPermission({ publicId: collectionId }, principalId),
    },
  }),
}

type Input = {
  params: Params
  body: CreerCommentaireBody<CommentaireType>
}

export const creerCollectionCommentaire = (input: Input) =>
  creerCommentaire(collectionConfig, input)
