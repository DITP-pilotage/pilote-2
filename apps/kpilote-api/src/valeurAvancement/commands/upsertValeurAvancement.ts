import {
  type UpsertValeurAvancementBody,
  type ValeurSaisieApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { upsertCombinaison } from '@/axe/combinaison'
import { type SaisieModalitesError } from '@/axe/requestedModalites'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/rules'
import { resolveCelluleForWrite } from '@/valeurAvancement/resolveCelluleForWrite'
import { toValeurSaisieApiModel } from '@/valeurAvancement/utils'

export type UpsertValeurAvancementError = IndividuInconnuError | SaisieModalitesError

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
}

const performUpsert = async ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): Promise<
  Result<ValeurSaisieApiModel, UpsertValeurAvancementError>
> => {
  const cellule = await resolveCelluleForWrite({
    indicateurPublicId,
    individuPublicId: body.individu,
    modalitePublicIds: body.modalites ?? [],
  })
  if (cellule.isErr()) return err(cellule.error)
  const { indicateur, individu, modalites } = cellule.value

  const combinaisonId = await upsertCombinaison({ modalites })
  const valeur = await db().valeurAvancement.upsert({
    where: {
      valeur_avancement_cellule_unique: {
        indicateurId: indicateur.id,
        individuId: individu.id,
        combinaisonId,
        date: body.date,
      },
    },
    update: { valeur: new Decimal(body.valeur) },
    create: {
      id: uuidv7(),
      indicateurId: indicateur.id,
      individuId: individu.id,
      combinaisonId,
      date: body.date,
      valeur: new Decimal(body.valeur),
    },
    include: {
      indicateur: { select: { publicId: true } },
      individu: { select: { publicId: true } },
    },
  })
  return ok(
    toValeurSaisieApiModel(valeur, { modalites: modalites.map((modalite) => modalite.publicId) }),
  )
}

export const upsertValeurAvancement = (
  params: UpsertValeurAvancementParams,
): ResultAsync<ValeurSaisieApiModel, UpsertValeurAvancementError> =>
  new ResultAsync(performUpsert(params))
