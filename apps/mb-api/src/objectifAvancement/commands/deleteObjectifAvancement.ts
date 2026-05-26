import { type DeleteObjectifAvancementBody } from '@pilote/mb-shared/objectifAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError, resolveAuthorizedIndividu } from '@/individu/permission'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'

export type DeleteObjectifAvancementError = IndividuInconnuError

type DeleteObjectifAvancementParams = {
  indicateurPublicId: string
  body: DeleteObjectifAvancementBody
}

export const deleteObjectifAvancement = ({
  indicateurPublicId,
  body,
}: DeleteObjectifAvancementParams): ResultAsync<void, DeleteObjectifAvancementError> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  )
    .andThen((indicateur) =>
      ensureIndicateurWritePermission({ indicateurId: indicateur.id, principalId }).map(
        () => indicateur,
      ),
    )
    .andThen((indicateur) =>
      resolveAuthorizedIndividu({
        individuPublicId: body.individu,
        indicateurId: indicateur.id,
      }).map((individu) => ({ indicateur, individu })),
    )
    .andThen(({ indicateur, individu }) =>
      ResultAsync.fromSafePromise(
        db().objectifAvancement.deleteMany({
          where: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            date: body.date,
          },
        }),
      ),
    )
    .map(() => undefined)
}
