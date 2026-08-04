import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { IndicateurPermissionAction, Visibilite } from '@/generated/prisma/enums'
import { COLLECTION_PERMISSIONS_GRANTING_READ } from '@/collection/permissions'

const INDICATEUR_PERMISSIONS_GRANTING_READ: IndicateurPermissionAction[] = [
  IndicateurPermissionAction.READ,
  IndicateurPermissionAction.WRITE_DATA,
  IndicateurPermissionAction.WRITE_COMMENT,
]

// La permission de lecture sur un indicateur est accordée si :
// - le principal est ADMIN (bypass : administre PUBLIC + PRIVÉ, aligné avec /me/permissions), OU
// - l'indicateur est PUBLIC, OU
// - le principal a READ/WRITE_DATA/WRITE_COMMENT direct sur l'indicateur, OU
// - le principal a READ/WRITE_COMMENT sur une collection qui contient l'indicateur
//   (propagation collection → indicateur, cf. permissions-design.md).
// WRITE_DATA et WRITE_COMMENT restent strictement directs (jamais propagés).
export const withIndicateurReadPermission = (
  where: Prisma.IndicateurWhereInput,
  principalId: string,
  { isAdmin = false }: { isAdmin?: boolean } = {},
): Prisma.IndicateurWhereInput => {
  if (isAdmin) {
    return where
  }
  return {
    AND: [
      where,
      {
        OR: [
          { visibilite: Visibilite.PUBLIC },
          {
            permissions: {
              some: { principalId, action: { in: INDICATEUR_PERMISSIONS_GRANTING_READ } },
            },
          },
          {
            collections: {
              some: {
                collection: {
                  permissions: {
                    some: { principalId, action: { in: COLLECTION_PERMISSIONS_GRANTING_READ } },
                  },
                },
              },
            },
          },
        ],
      },
    ],
  }
}

export const ensureIndicateurWriteDataPermission = ({
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
            action: IndicateurPermissionAction.WRITE_DATA,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError(
            "Vous n'avez pas la permission de modifier les données de cet indicateur",
          )
        }
      }),
  )

export const ensureIndicateurWriteCommentPermission = ({
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
            action: IndicateurPermissionAction.WRITE_COMMENT,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError(
            "Vous n'avez pas la permission d'écrire un commentaire sur cet indicateur",
          )
        }
      }),
  )
