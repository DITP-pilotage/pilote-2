import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'

export type IndividuInconnuError = { type: 'INDIVIDU_INCONNU'; individu: string }

export const resolveAuthorizedIndividu = ({
  individuPublicId,
  indicateurId,
}: {
  individuPublicId: string
  indicateurId: string
}): ResultAsync<{ id: string; publicId: string }, IndividuInconnuError> => {
  const unknownOrUnauthorized = (): IndividuInconnuError => ({
    type: 'INDIVIDU_INCONNU',
    individu: individuPublicId,
  })
  return ResultAsync.fromSafePromise(
    db().individu.findUnique({
      where: { publicId: individuPublicId },
      select: { id: true, publicId: true, referentielId: true },
    }),
  )
    .andThen((individu) => (individu ? okAsync(individu) : errAsync(unknownOrUnauthorized())))
    .andThen((individu) =>
      ResultAsync.fromSafePromise(
        db().indicateurReferentiel.findUnique({
          where: {
            indicateurId_referentielId: {
              indicateurId,
              referentielId: individu.referentielId,
            },
          },
        }),
      ).andThen((link) =>
        link
          ? okAsync({ id: individu.id, publicId: individu.publicId })
          : errAsync(unknownOrUnauthorized()),
      ),
    )
}
