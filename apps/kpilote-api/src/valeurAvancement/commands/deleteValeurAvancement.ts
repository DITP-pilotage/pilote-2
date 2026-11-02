import { type DeleteValeurAvancementBody } from '@pilote/kpilote-shared/valeurAvancement'
import { okAsync, ResultAsync } from 'neverthrow'

import { type ErreurCellule, resoudreCelluleEcriture } from '@/dimension/celluleEcriture'
import { db } from '@/framework/persistence/dbStore'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'

export type DeleteValeurAvancementError = ErreurCellule

type DeleteValeurAvancementParams = {
  indicateurPublicId: string
  body: DeleteValeurAvancementBody
}

export const deleteValeurAvancement = ({
  indicateurPublicId,
  body,
}: DeleteValeurAvancementParams): ResultAsync<void, DeleteValeurAvancementError> =>
  resolveIndicateurForWriteData({ indicateurPublicId }).andThen(({ indicateur, principalId }) =>
    resoudreCelluleEcriture({
      indicateurId: indicateur.id,
      principalId,
      sousCube: 'valeurs',
      cible: body,
      creer: false,
    }).andThen(({ celluleId }) =>
      celluleId === null
        ? okAsync(undefined)
        : ResultAsync.fromSafePromise(
            db().valeurAvancement.deleteMany({
              where: { indicateurId: indicateur.id, celluleId, date: body.date },
            }),
          ).map(() => undefined),
    ),
  )
