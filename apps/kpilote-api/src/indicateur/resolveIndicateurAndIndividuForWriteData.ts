import { err, ok, type Result } from 'neverthrow'

import { type IndividuInconnuError, resolveAuthorizedIndividu } from '@/individu/permission'

import { resolveIndicateurForWriteData } from './resolveIndicateurForWrite'

type ResolvedContext = {
  indicateur: { id: string; publicId: string }
  individu: { id: string; publicId: string }
  principalId: string
}

export const resolveIndicateurAndIndividuForWriteData = async ({
  indicateurPublicId,
  individuPublicId,
}: {
  indicateurPublicId: string
  individuPublicId: string
}): Promise<Result<ResolvedContext, IndividuInconnuError>> => {
  const { indicateur, principalId } = await resolveIndicateurForWriteData({ indicateurPublicId })
  const individu = await resolveAuthorizedIndividu({
    individuPublicId,
    indicateurId: indicateur.id,
  })
  if (individu.isErr()) return err(individu.error)
  return ok({ indicateur, individu: individu.value, principalId })
}
