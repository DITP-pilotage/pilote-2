import type {
  GrantIndicateurPermissionBody,
  GrantPanierPermissionBody,
  PermissionActionValue,
  PrincipalPermissionsApiModel,
} from '@pilote/kpilot-shared/permission'
import { principalPermissionsApiModelSchema } from '@pilote/kpilot-shared/permission'

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

// --- Panier ------------------------------------------------------------------

export const grantPanierPermission = async (
  body: GrantPanierPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.post('permissions/panier', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const revokePanierPermission = async (params: {
  principalId: string
  panierPublicId: string
  action?: PermissionActionValue
}): Promise<PrincipalPermissionsApiModel> => {
  const searchParams: Record<string, string> = {
    principalId: params.principalId,
    panierPublicId: params.panierPublicId,
  }
  if (params.action) searchParams.action = params.action
  const json = await bffClient.delete('permissions/panier', { searchParams }).json()
  return principalPermissionsApiModelSchema.parse(json)
}
