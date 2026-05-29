import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

import { ensureIndicateurWritePermission, withIndicateurReadPermission } from './permissions'

type ResolvedIndicateur = {
  indicateur: { id: string; publicId: string }
  principalId: string
}

export const resolveIndicateurForWrite = ({
  indicateurPublicId,
}: {
  indicateurPublicId: string
}): ResultAsync<ResolvedIndicateur, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  ).andThen((indicateur) =>
    ensureIndicateurWritePermission({ indicateurId: indicateur.id, principalId }).map(() => ({
      indicateur,
      principalId,
    })),
  )
}
