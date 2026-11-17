import { type DeleteValeurAvancementBody } from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { trouverCombinaisonId } from '@/axe/combinaison'
import { type SaisieModalitesError } from '@/axe/modalitesDemandees'
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
    ResultAsync.fromSafePromise(
      (async () => {
        const combinaisonId = await trouverCombinaisonId({ modalites })
        if (combinaisonId === null) return
        // Filtre sur la combinaison : sans lui, la suppression d'une valeur
        // effacerait celles de toutes les combinaisons de la cellule.
        await db().valeurAvancement.deleteMany({
          where: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            combinaisonId,
            date: body.date,
          },
        })
      })(),
    ),
  )
