import {
  type ObjectifIndicateurIndividuApiModel,
  type UpsertObjectifIndicateurIndividuBody,
} from '@pilote/kpilot-shared/objectifIndicateurIndividu'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividuForWrite } from '@/indicateur/resolveIndicateurAndIndividuForWrite'
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
  resolveIndicateurAndIndividuForWrite({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().objectifIndicateurIndividu.upsert({
        where: {
          objectif_indicateur_individu_unique: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            dateCible: body.dateCible,
          },
        },
        update: { valeurCible: new Decimal(body.valeurCible) },
        create: {
          id: uuidv7(),
          indicateurId: indicateur.id,
          individuId: individu.id,
          dateCible: body.dateCible,
          valeurCible: new Decimal(body.valeurCible),
        },
        include: {
          indicateur: { select: { publicId: true } },
          individu: { select: { publicId: true } },
        },
      }),
    ).map(toObjectifIndicateurIndividuApiModel),
  )
