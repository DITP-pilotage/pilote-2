import {
  type UpsertValeurAvancementBody,
  type ValeurSaisieApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { combinaisonKey, upsertCombinaisons } from '@/axe/combinaison'
import { type SaisieModalitesError } from '@/axe/requestedModalites'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveCelluleForWrite } from '@/valeurAvancement/resolveCelluleForWrite'
import { toValeurSaisieApiModel } from '@/valeurAvancement/utils'

export type UpsertValeurAvancementError = IndividuInconnuError | SaisieModalitesError

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
}

export const upsertValeurAvancement = ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): ResultAsync<ValeurSaisieApiModel, UpsertValeurAvancementError> =>
  resolveCelluleForWrite({
    indicateurPublicId,
    individuPublicId: body.individu,
    modalitePublicIds: body.modalites ?? [],
  }).andThen(({ indicateur, individu, modalites }) =>
    ResultAsync.fromSafePromise(upsertCombinaisons({ combinaisons: [modalites] }))
      .map((idParCle) => idParCle.get(combinaisonKey({ modalites }))!)
      .andThen((combinaisonId) =>
        ResultAsync.fromSafePromise(
          db().valeurAvancement.upsert({
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
          }),
        ),
      )
      .map((valeur) =>
        toValeurSaisieApiModel(valeur, {
          modalites: modalites.map((modalite) => modalite.publicId),
        }),
      ),
  )
