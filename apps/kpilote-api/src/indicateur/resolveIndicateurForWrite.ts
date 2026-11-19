import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

import { ensureIndicateurWriteDataPermission, withIndicateurReadPermission } from './permissions'

type ResolvedIndicateur = {
  indicateur: { id: string; publicId: string }
  principalId: string
}

export const resolveIndicateurForWriteData = async ({
  indicateurPublicId,
}: {
  indicateurPublicId: string
}): Promise<ResolvedIndicateur> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true, publicId: true },
  })
  await ensureIndicateurWriteDataPermission({ indicateurId: indicateur.id, principalId })
  return { indicateur, principalId }
}
