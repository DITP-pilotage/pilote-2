import { type NiveauConfianceApiModel } from '@pilote/kpilote-shared/niveauConfiance'

import { auteurInclude, toAuteurApiModel } from '@/commentaire/auteur'
import { commentaireInclude, toCommentaireApiModel } from '@/commentaire/utils'
import { type Prisma } from '@/generated/prisma/client'

export const niveauConfianceInclude = {
  commentaire: { include: commentaireInclude },
  auteurCreation: auteurInclude,
  auteurModification: auteurInclude,
} satisfies Prisma.NiveauConfianceInclude

export type NiveauConfianceRow = Prisma.NiveauConfianceGetPayload<{
  include: typeof niveauConfianceInclude
}>

export const toNiveauConfianceApiModel = (row: NiveauConfianceRow): NiveauConfianceApiModel => ({
  id: row.id,
  indice: row.indice,
  commentaire: toCommentaireApiModel(row.commentaire),
  auteurCreation: toAuteurApiModel(row.auteurCreation),
  auteurModification: toAuteurApiModel(row.auteurModification),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})
