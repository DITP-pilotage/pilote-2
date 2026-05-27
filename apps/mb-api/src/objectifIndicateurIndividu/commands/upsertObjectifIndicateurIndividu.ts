import {
  type ObjectifIndicateurIndividuApiModel,
  type UpsertObjectifIndicateurIndividuBody,
} from '@pilote/mb-shared/objectifIndicateurIndividu'
import { ResultAsync } from 'neverthrow'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividu } from '@/indicateur/resolveIndicateurAndIndividu'
import { toObjectifIndicateurIndividuApiModel } from '@/objectifIndicateurIndividu/utils'

export type UpsertObjectifIndicateurIndividuError = IndividuInconnuError

type UpsertObjectifIndicateurIndividuParams = {
  indicateurPublicId: string
  body: UpsertObjectifIndicateurIndividuBody
}

export const upsertObjectifIndicateurIndividu = ({
  indicateurPublicId,
  body,
}: UpsertObjectifIndicateurIndividuParams): ResultAsync<
  ObjectifIndicateurIndividuApiModel,
  UpsertObjectifIndicateurIndividuError
> =>
  resolveIndicateurAndIndividu({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().objectifIndicateurIndividu.upsert({
        where: {
          objectif_indicateur_individu_unique: {
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
    ).map(toObjectifIndicateurIndividuApiModel),
  )
