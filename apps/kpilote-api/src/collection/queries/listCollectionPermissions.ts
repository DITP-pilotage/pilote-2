import {
  type CollectionPermissionsApiModel,
  type PermissionActionValue,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

type Entree = CollectionPermissionsApiModel['items'][number]

const ORDRE_ACTIONS: PermissionActionValue[] = [PermissionAction.READ, PermissionAction.WRITE]

const performList = async (publicId: string): Promise<CollectionPermissionsApiModel> => {
  const lignes = await db().collectionPermission.findMany({
    where: { collection: { publicId } },
    include: { principal: { include: { utilisateur: true, apiKey: true } } },
  })

  const parPrincipal = new Map<string, Entree>()
  for (const ligne of lignes) {
    const { utilisateur, apiKey } = ligne.principal
    const entree: Entree = parPrincipal.get(ligne.principalId) ?? {
      principalId: ligne.principalId,
      type: utilisateur ? 'UTILISATEUR' : 'API_KEY',
      libelle: utilisateur?.email ?? apiKey?.label ?? ligne.principalId,
      actions: [],
    }
    entree.actions.push(ligne.action)
    parPrincipal.set(ligne.principalId, entree)
  }

  const items = [...parPrincipal.values()]
    .map((entree) => ({
      ...entree,
      actions: ORDRE_ACTIONS.filter((action) => entree.actions.includes(action)),
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.libelle.localeCompare(b.libelle))

  return { items }
}

// Lecture inverse de `GET /permissions?principalId=…`, qui ne sait répondre
// qu'à « à quoi ce principal a-t-il accès ».
export const listCollectionPermissions = (
  publicId: string,
): ResultAsync<CollectionPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performList(publicId))
