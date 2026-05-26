import {
  type ObjectifAvancementApiModel,
  type UpsertObjectifAvancementBody,
} from '@pilote/mb-shared/objectifAvancement'
import { ResultAsync } from 'neverthrow'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividu } from '@/indicateur/resolveIndicateurAndIndividu'
import { toObjectifAvancementApiModel } from '@/objectifAvancement/utils'

export type UpsertObjectifAvancementError = IndividuInconnuError

type UpsertObjectifAvancementParams = {
  indicateurPublicId: string
  body: UpsertObjectifAvancementBody
}

export const upsertObjectifAvancement = ({
  indicateurPublicId,
  body,
}: UpsertObjectifAvancementParams): ResultAsync<
  ObjectifAvancementApiModel,
  UpsertObjectifAvancementError
> =>
  resolveIndicateurAndIndividu({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().objectifAvancement.upsert({
        where: {
          objectif_avancement_unique: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            date: body.date,
          },
        },
        update: { valeur: new Decimal(body.valeur) },
        create: {
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
    ).map(toObjectifAvancementApiModel),
  )
