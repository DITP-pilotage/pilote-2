import { type PanierResponsablesApiModel } from '@pilote/mb-shared/panierResponsable'
import { ResultAsync } from 'neverthrow'
import { pick } from 'remeda'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withPanierReadPermission } from '@/panier/permissions'

export const getPanierResponsables = (
  panierPublicId: string,
): ResultAsync<PanierResponsablesApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().panier.findFirstOrThrow({
      where: withPanierReadPermission({ publicId: panierPublicId }, principalId),
      include: {
        responsables: {
          orderBy: { createdAt: 'asc' },
          include: {
            utilisateur: true,
          },
        },
      },
    }),
  ).map((panier) => ({
    items: panier.responsables.map((r) =>
      pick(r.utilisateur, ['email', 'nom', 'prenom', 'service', 'fonction']),
    ),
  }))
}
