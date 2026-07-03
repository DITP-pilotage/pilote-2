import { type PermissionResourceType } from '@pilote/mb-shared/permission'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

// Valide la cohérence type ↔ préfixe (`PAN-` / `IND-`) puis résout l'UUID interne.
// findUniqueOrThrow → P2025 → 404 si la ressource est introuvable.
export const resolveResourceId = async (
  resourceType: PermissionResourceType,
  resourcePublicId: string,
): Promise<string> => {
  if (resourceType === 'PANIER') {
    if (!resourcePublicId.startsWith('PAN-')) {
      throw new ValidationError('`resourcePublicId` doit commencer par `PAN-` pour un panier.')
    }
    const panier = await db().panier.findUniqueOrThrow({
      where: { publicId: resourcePublicId },
      select: { id: true },
    })
    return panier.id
  }
  if (!resourcePublicId.startsWith('IND-')) {
    throw new ValidationError('`resourcePublicId` doit commencer par `IND-` pour un indicateur.')
  }
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: resourcePublicId },
    select: { id: true },
  })
  return indicateur.id
}
