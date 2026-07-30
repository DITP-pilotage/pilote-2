import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

import {
  ensureIndicateurWriteDataPermission,
  ensureIndicateurWriteCommentPermission,
  withIndicateurReadPermission,
} from './permissions'

type ResolvedIndicateur = {
  indicateur: { id: string; publicId: string }
  principalId: string
}

export const resolveIndicateurForWriteData = ({
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
    ensureIndicateurWriteDataPermission({ indicateurId: indicateur.id, principalId }).map(() => ({
      indicateur,
      principalId,
    })),
  )
}

export const resolveIndicateurForWriteComment = ({
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
    ensureIndicateurWriteCommentPermission({ indicateurId: indicateur.id, principalId }).map(
      () => ({ indicateur, principalId }),
    ),
  )
}
