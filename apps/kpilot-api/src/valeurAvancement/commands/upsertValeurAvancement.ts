import {
  type UpsertValeurAvancementBody,
  type ValeurSaisieApiModel,
} from '@pilote/kpilot-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividuForWrite } from '@/indicateur/resolveIndicateurAndIndividuForWrite'
import { toValeurSaisieApiModel } from '@/valeurAvancement/utils'

export type UpsertValeurAvancementError = IndividuInconnuError

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
}

export const upsertValeurAvancement = ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): ResultAsync<ValeurSaisieApiModel, UpsertValeurAvancementError> =>
  resolveIndicateurAndIndividuForWrite({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().valeurAvancement.upsert({
        where: {
          valeur_avancement_unique: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            date: body.date,
          },
        },
        update: { valeur: new Decimal(body.valeur) },
        create: {
          id: uuidv7(),
          indicateurId: indicateur.id,
          individuId: individu.id,
          date: body.date,
          valeur: new Decimal(body.valeur),
        },
        include: {
          indicateur: { select: { publicId: true } },
          individu: { select: { publicId: true } },
        },
      }),
    ).map(toValeurSaisieApiModel),
  )
