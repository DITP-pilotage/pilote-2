import {
  type ObjectifIndicateurIndividuApiModel,
  type UpsertObjectifIndicateurIndividuBody,
} from '@pilote/kpilote-shared/objectifIndicateurIndividu'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividuForWriteData } from '@/indicateur/resolveIndicateurAndIndividuForWriteData'
import { toObjectifIndicateurIndividuApiModel } from '@/objectifIndicateurIndividu/utils'

export type UpsertObjectifIndicateurIndividuError = IndividuInconnuError

type UpsertObjectifIndicateurIndividuParams = {
  indicateurPublicId: string
  body: UpsertObjectifIndicateurIndividuBody
}

const performUpsert = async ({
  indicateurPublicId,
  body,
}: UpsertObjectifIndicateurIndividuParams): Promise<
  Result<ObjectifIndicateurIndividuApiModel, UpsertObjectifIndicateurIndividuError>
> => {
  const resolved = await resolveIndicateurAndIndividuForWriteData({
    indicateurPublicId,
    individuPublicId: body.individu,
  })
  if (resolved.isErr()) return err(resolved.error)
  const { indicateur, individu } = resolved.value

  const objectif = await db().objectifIndicateurIndividu.upsert({
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
  })
  return ok(toObjectifIndicateurIndividuApiModel(objectif))
}

export const upsertObjectifIndicateurIndividu = (
  params: UpsertObjectifIndicateurIndividuParams,
): ResultAsync<ObjectifIndicateurIndividuApiModel, UpsertObjectifIndicateurIndividuError> =>
  new ResultAsync(performUpsert(params))
