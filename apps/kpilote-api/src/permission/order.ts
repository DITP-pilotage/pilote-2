import { CollectionPermissionAction, IndicateurPermissionAction } from '@/generated/prisma/enums'

export const INDICATEUR_ACTION_ORDER = [
  IndicateurPermissionAction.READ,
  IndicateurPermissionAction.WRITE_DATA,
  IndicateurPermissionAction.WRITE_COMMENT,
] as const

export const COLLECTION_ACTION_ORDER = [
  CollectionPermissionAction.READ,
  CollectionPermissionAction.WRITE_COMMENT,
] as const

export const sortByOrder = <T>(items: T[], order: readonly T[]): T[] =>
  [...items].sort((a, b) => order.indexOf(a) - order.indexOf(b))
