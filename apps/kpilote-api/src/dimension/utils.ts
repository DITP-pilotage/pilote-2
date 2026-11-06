import { type DimensionApiModel } from '@pilote/kpilote-shared/dimension'

import { type Prisma } from '@/generated/prisma/client'

export const dimensionInclude = {
  referentiels: { select: { publicId: true }, orderBy: { publicId: 'asc' } },
} satisfies Prisma.DimensionInclude

export type DimensionRow = Prisma.DimensionGetPayload<{ include: typeof dimensionInclude }>

export const toDimensionApiModel = (dimension: DimensionRow): DimensionApiModel => ({
  id: dimension.publicId,
  nom: dimension.nom,
  description: dimension.description,
  referentiels: dimension.referentiels.map((referentiel) => referentiel.publicId),
  createdAt: dimension.createdAt.toISOString(),
  updatedAt: dimension.updatedAt.toISOString(),
})
