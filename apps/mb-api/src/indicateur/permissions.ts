import { Prisma } from '@/generated/prisma/client'
import { PermissionAction } from '@/generated/prisma/enums'

const INDICATEUR_READ_PERMISSIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.WRITE,
]

export const withIndicateurReadPermission = (
  where: Prisma.IndicateurWhereInput,
  principalId: string,
): Prisma.IndicateurWhereInput => ({
  ...where,
  permissions: {
    some: { principalId, action: { in: INDICATEUR_READ_PERMISSIONS } },
  },
})
