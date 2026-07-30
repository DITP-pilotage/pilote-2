import { type ResultAsync } from 'neverthrow'

import { type IndividuInconnuError, resolveAuthorizedIndividu } from '@/individu/permission'

import { resolveIndicateurForWriteData } from './resolveIndicateurForWrite'

type ResolvedContext = {
  indicateur: { id: string; publicId: string }
  individu: { id: string; publicId: string }
  principalId: string
}

export const resolveIndicateurAndIndividuForWrite = ({
  indicateurPublicId,
  individuPublicId,
}: {
  indicateurPublicId: string
  individuPublicId: string
}): ResultAsync<ResolvedContext, IndividuInconnuError> =>
  resolveIndicateurForWriteData({ indicateurPublicId }).andThen(({ indicateur, principalId }) =>
    resolveAuthorizedIndividu({ individuPublicId, indicateurId: indicateur.id }).map(
      (individu) => ({ indicateur, individu, principalId }),
    ),
  )
