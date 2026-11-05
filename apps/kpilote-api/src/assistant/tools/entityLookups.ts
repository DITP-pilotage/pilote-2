import { type EntityRef } from '@pilote/kpilote-shared/assistant/tools'
import { type CollectionApiModel } from '@pilote/kpilote-shared/collection'

import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'

// Les queries de détail lèvent quand l'entité est absente ou illisible ; un outil veut un
// `null` qu'il rapporte en `notFound`, l'API ne distinguant pas les deux cas.

export const findReadableCollection = async (id: string): Promise<CollectionApiModel | null> => {
  try {
    return (await getCollectionByPublicId(id)).unwrapOr(null)
  } catch {
    return null
  }
}

export const findIndividu = async (id: string): Promise<EntityRef | null> => {
  const row = await db().individu.findUnique({
    where: { publicId: id },
    select: { publicId: true, nom: true },
  })
  return row ? { id: row.publicId, nom: row.nom } : null
}

/** Les noms des indicateurs lisibles parmi `ids`. */
export const findIndicateurNamesByIds = async (
  ids: ReadonlyArray<string>,
): Promise<Map<string, string>> => {
  const rows = await db().indicateur.findMany({
    where: withIndicateurReadPermission(
      { publicId: { in: [...ids] } },
      requireCurrentPrincipalId(),
      {
        isAdmin: isAdminPrincipal(),
      },
    ),
    select: { publicId: true, nom: true },
  })
  return new Map(rows.map((row) => [row.publicId, row.nom]))
}
