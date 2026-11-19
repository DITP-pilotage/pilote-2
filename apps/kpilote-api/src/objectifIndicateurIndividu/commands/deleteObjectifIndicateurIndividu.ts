import { type DeleteObjectifIndicateurIndividuBody } from '@pilote/kpilote-shared/objectifIndicateurIndividu'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/rules'
import { resolveIndicateurAndIndividuForWriteData } from '@/indicateur/resolveIndicateurAndIndividuForWriteData'

export type DeleteObjectifIndicateurIndividuError = IndividuInconnuError

type DeleteObjectifIndicateurIndividuParams = {
  indicateurPublicId: string
  body: DeleteObjectifIndicateurIndividuBody
}

const performDelete = async ({
  indicateurPublicId,
  body,
}: DeleteObjectifIndicateurIndividuParams): Promise<
  Result<void, DeleteObjectifIndicateurIndividuError>
> => {
  const resolved = await resolveIndicateurAndIndividuForWriteData({
    indicateurPublicId,
    individuPublicId: body.individu,
  })
  if (resolved.isErr()) return err(resolved.error)
  const { indicateur, individu } = resolved.value

  await db().objectifIndicateurIndividu.deleteMany({
    where: { indicateurId: indicateur.id, individuId: individu.id, dateCible: body.dateCible },
  })
  return ok()
}

export const deleteObjectifIndicateurIndividu = (
  params: DeleteObjectifIndicateurIndividuParams,
): ResultAsync<void, DeleteObjectifIndicateurIndividuError> =>
  new ResultAsync(performDelete(params))
