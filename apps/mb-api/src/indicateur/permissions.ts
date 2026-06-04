import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { PermissionAction, Visibilite } from '@/generated/prisma/enums'
import { PANIER_READ_PERMISSIONS } from '@/panier/permissions'

const INDICATEUR_READ_PERMISSIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.WRITE,
]

// La permission de lecture sur un indicateur est accordée si :
// - l'indicateur est PUBLIC, OU
// - le principal a READ/WRITE direct sur l'indicateur, OU
// - le principal a READ/WRITE sur un panier qui contient l'indicateur
//   (propagation panier → indicateur, cf. permissions-design.md).
// Le WRITE indicateur reste strictement direct (ensureIndicateurWritePermission).
export const withIndicateurReadPermission = (
  where: Prisma.IndicateurWhereInput,
  principalId: string,
): Prisma.IndicateurWhereInput => ({
  AND: [
    where,
    {
      OR: [
        { visibilite: Visibilite.PUBLIC },
        { permissions: { some: { principalId, action: { in: INDICATEUR_READ_PERMISSIONS } } } },
        {
          paniers: {
            some: {
              panier: {
                permissions: {
                  some: { principalId, action: { in: PANIER_READ_PERMISSIONS } },
                },
              },
            },
          },
        },
      ],
    },
  ],
})

export const ensureIndicateurWritePermission = ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    db()
      .indicateurPermission.findUnique({
        where: {
          principalId_indicateurId_action: {
            principalId,
            indicateurId,
            action: PermissionAction.WRITE,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError("Vous n'avez pas la permission de modifier cet indicateur")
        }
      }),
  )
