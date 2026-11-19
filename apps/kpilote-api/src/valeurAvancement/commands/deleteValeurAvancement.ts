import { type DeleteValeurAvancementBody } from '@pilote/kpilote-shared/valeurAvancement'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { combinaisonKey } from '@/axe/combinaison'
import { type SaisieModalitesError } from '@/axe/requestedModalites'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveCelluleForWrite } from '@/valeurAvancement/resolveCelluleForWrite'

export type DeleteValeurAvancementError = IndividuInconnuError | SaisieModalitesError

type DeleteValeurAvancementParams = {
  indicateurPublicId: string
  body: DeleteValeurAvancementBody
}

// La suppression vise la même cellule complète que la saisie.
const performDelete = async ({
  indicateurPublicId,
  body,
}: DeleteValeurAvancementParams): Promise<Result<void, DeleteValeurAvancementError>> => {
  const cellule = await resolveCelluleForWrite({
    indicateurPublicId,
    individuPublicId: body.individu,
    modalitePublicIds: body.modalites ?? [],
  })
  if (cellule.isErr()) return err(cellule.error)
  const { indicateur, individu, modalites } = cellule.value

  // Filtre sur la combinaison, par sa clé : sans lui, la suppression d'une
  // valeur effacerait celles de toutes les combinaisons de la cellule. Une
  // combinaison qui n'existe pas encore ne porte aucune valeur : rien n'est
  // supprimé.
  await db().valeurAvancement.deleteMany({
    where: {
      indicateurId: indicateur.id,
      individuId: individu.id,
      date: body.date,
      combinaison: { cle: combinaisonKey({ modalites }) },
    },
  })
  return ok()
}

export const deleteValeurAvancement = (
  params: DeleteValeurAvancementParams,
): ResultAsync<void, DeleteValeurAvancementError> => new ResultAsync(performDelete(params))
