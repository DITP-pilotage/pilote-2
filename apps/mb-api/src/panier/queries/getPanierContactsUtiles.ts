import { type PanierContactsUtilesApiModel } from '@pilote/mb-shared/panierContactUtile'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withPanierReadPermission } from '@/panier/permissions'

export const getPanierContactsUtiles = (
  panierPublicId: string,
): ResultAsync<PanierContactsUtilesApiModel, never> => {
  const principalId = requireCurrentPrincipalId()

  return ResultAsync.fromSafePromise(
    db().panier.findFirstOrThrow({
      where: withPanierReadPermission({ publicId: panierPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen(({ id: panierId }) =>
    ResultAsync.fromSafePromise(
      db().organisme.findMany({
        where: { contacts: { some: { paniers: { some: { panierId } } } } },
        orderBy: { nom: 'asc' },
        select: {
          id: true,
          nom: true,
          contacts: {
            where: { paniers: { some: { panierId } } },
            orderBy: { nom: 'asc' },
          },
        },
      }),
    ).map((organismes) => ({
      items: organismes.map(({ id, nom, contacts }) => ({
        organisme: { id, nom },
        contacts,
      })),
    })),
  )
}
