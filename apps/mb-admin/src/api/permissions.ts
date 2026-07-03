import type {
  GrantPermissionBody,
  PermissionActionValue,
  PermissionResourceType,
  PrincipalPermissionsApiModel,
} from '@pilote/mb-shared/permission'
import { principalPermissionsApiModelSchema } from '@pilote/mb-shared/permission'

import { bffClient } from '@/api/client'

export const fetchPrincipalPermissions = async (
  principalId: string,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.get('permissions', { searchParams: { principalId } }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const grantPermission = async (
  body: GrantPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.post('permissions', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const revokePermission = async (params: {
  principalId: string
  resourceType: PermissionResourceType
  resourcePublicId: string
  action?: PermissionActionValue
}): Promise<PrincipalPermissionsApiModel> => {
  const searchParams: Record<string, string> = {
    principalId: params.principalId,
    resourceType: params.resourceType,
    resourcePublicId: params.resourcePublicId,
  }
  if (params.action) searchParams.action = params.action
  const json = await bffClient.delete('permissions', { searchParams }).json()
  return principalPermissionsApiModelSchema.parse(json)
}
