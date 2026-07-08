import type {
  GrantDossierPermissionBody,
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

// --- Dossier -----------------------------------------------------------------

export const grantDossierPermission = async (
  body: GrantDossierPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.post('permissions/dossier', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const revokeDossierPermission = async (params: {
  principalId: string
  dossierPublicId: string
  action?: PermissionActionValue
}): Promise<PrincipalPermissionsApiModel> => {
  const searchParams: Record<string, string> = {
    principalId: params.principalId,
    dossierPublicId: params.dossierPublicId,
  }
  if (params.action) searchParams.action = params.action
  const json = await bffClient.delete('permissions/dossier', { searchParams }).json()
  return principalPermissionsApiModelSchema.parse(json)
}
