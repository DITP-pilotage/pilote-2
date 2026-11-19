import { err, ok, type Result } from 'neverthrow'

import { loadIndividusContext } from '@/individu/loadIndividusContext'
import { checkIndividuRattache, type IndividuInconnuError } from '@/individu/rules'

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

  const individus = await loadIndividusContext({
    indicateurId: indicateur.id,
    individuPublicIds: [individuPublicId],
  })

  const individu = checkIndividuRattache({
    individuPublicId,
    individu: individus.individuByPublicId.get(individuPublicId),
    referentielIdsLies: individus.referentielIdsLies,
  })
  if (individu.isErr()) return err(individu.error)

  return ok({ indicateur, individu: individu.value, principalId })
}
