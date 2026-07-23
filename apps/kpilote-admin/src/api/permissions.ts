import type {
  GrantCollectionPermissionBody,
  GrantIndicateurPermissionBody,
  PermissionActionValue,
  PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { principalPermissionsApiModelSchema } from '@pilote/kpilote-shared/permission'

import { bffClient } from '@/api/client'

export const fetchPrincipalPermissions = async (
  principalId: string,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.get('permissions', { searchParams: { principalId } }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

// --- Indicateur --------------------------------------------------------------

export const grantIndicateurPermission = async (
  body: GrantIndicateurPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.post('permissions/indicateur', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const revokeIndicateurPermission = async (params: {
  principalId: string
  indicateurPublicId: string
  action?: PermissionActionValue
}): Promise<PrincipalPermissionsApiModel> => {
  const searchParams: Record<string, string> = {
    principalId: params.principalId,
    indicateurPublicId: params.indicateurPublicId,
  }
  if (params.action) searchParams.action = params.action
  const json = await bffClient.delete('permissions/indicateur', { searchParams }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

// --- Collection -----------------------------------------------------------------

export const grantCollectionPermission = async (
  body: GrantCollectionPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.post('permissions/collection', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const revokeCollectionPermission = async (params: {
  principalId: string
  collectionPublicId: string
  action?: PermissionActionValue
}): Promise<PrincipalPermissionsApiModel> => {
  const searchParams: Record<string, string> = {
    principalId: params.principalId,
    collectionPublicId: params.collectionPublicId,
  }
  if (params.action) searchParams.action = params.action
  const json = await bffClient.delete('permissions/collection', { searchParams }).json()
  return principalPermissionsApiModelSchema.parse(json)
}
