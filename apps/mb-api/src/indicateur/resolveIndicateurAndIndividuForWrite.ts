import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError, resolveAuthorizedIndividu } from '@/individu/permission'

import { ensureIndicateurWritePermission, withIndicateurReadPermission } from './permissions'

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
}): ResultAsync<ResolvedContext, IndividuInconnuError> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  )
    .andThen((indicateur) =>
      ensureIndicateurWritePermission({ indicateurId: indicateur.id, principalId }).map(
        () => indicateur,
      ),
    )
    .andThen((indicateur) =>
      resolveAuthorizedIndividu({ individuPublicId, indicateurId: indicateur.id }).map(
        (individu) => ({ indicateur, individu, principalId }),
      ),
    )
}
