import { type DeleteValeurAvancementBody } from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'
import {
  type IndividuInconnuError,
  resolveAuthorizedIndividu,
} from '@/valeurAvancement/resolveAuthorizedIndividu'

export type DeleteValeurAvancementError = IndividuInconnuError

type DeleteValeurAvancementParams = {
  indicateurPublicId: string
  body: DeleteValeurAvancementBody
}

export const deleteValeurAvancement = ({
  indicateurPublicId,
  body,
}: DeleteValeurAvancementParams): ResultAsync<
  void,
  DeleteValeurAvancementError | ForbiddenError
> => {
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
        indicateurId: indicateur.id,
        individuPublicId: body.individu,
      }).map((individu) => ({ indicateur, individu })),
    )
    .andThen(({ indicateur, individu }) =>
      ResultAsync.fromSafePromise(
        db().valeurAvancement.deleteMany({
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
