import { type DeleteValeurAvancementBody } from '@pilote/kpilote-shared/valeurAvancement'
import { okAsync, ResultAsync } from 'neverthrow'

import { getCombinaisonId } from '@/axe/combinaison'
import { type SaisieModalitesError } from '@/axe/requestedModalites'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveCelluleForWrite } from '@/valeurAvancement/resolveCelluleForWrite'

export type DeleteValeurAvancementError = IndividuInconnuError | SaisieModalitesError

type DeleteValeurAvancementParams = {
  indicateurPublicId: string
  body: DeleteValeurAvancementBody
}

// La suppression vise la même cellule complète que la saisie. Une combinaison
// qui n'existe pas encore ne porte aucune valeur : rien à supprimer.
export const deleteValeurAvancement = ({
  indicateurPublicId,
  body,
}: DeleteValeurAvancementParams): ResultAsync<void, DeleteValeurAvancementError> =>
  resolveCelluleForWrite({
    indicateurPublicId,
    individuPublicId: body.individu,
    modalitePublicIds: body.modalites ?? [],
  }).andThen(({ indicateur, individu, modalites }) =>
    ResultAsync.fromSafePromise(getCombinaisonId({ modalites })).andThen((combinaisonId) =>
      combinaisonId === null
        ? okAsync(undefined)
        : // Filtre sur la combinaison : sans lui, la suppression d'une valeur
          // effacerait celles de toutes les combinaisons de la cellule.
          ResultAsync.fromSafePromise(
            db().valeurAvancement.deleteMany({
              where: {
                indicateurId: indicateur.id,
                individuId: individu.id,
                combinaisonId,
                date: body.date,
              },
            }),
          ).map(() => undefined),
    ),
  )
