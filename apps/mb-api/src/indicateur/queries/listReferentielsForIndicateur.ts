import { type ReferentielApiModel } from '@pilote/mb-shared/referentiel'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toReferentielApiModel } from '@/referentiel/utils'

export const listReferentielsForIndicateur = (
  indicateurPublicId: string,
): ResultAsync<{ items: ReferentielApiModel[] }, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      db().referentiel.findMany({
        where: { indicateurs: { some: { indicateurId: indicateur.id } } },
        orderBy: { publicId: 'asc' },
        include: { _count: { select: { individus: true } } },
      }),
    ).map((rows) => ({ items: rows.map(toReferentielApiModel) })),
  )
}
