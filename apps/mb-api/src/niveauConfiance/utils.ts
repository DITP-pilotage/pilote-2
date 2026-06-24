import { type NiveauConfianceApiModel } from '@pilote/mb-shared/niveauConfiance'

import { commentaireInclude, toCommentaireApiModel } from '@/commentaire/utils'
import { type Prisma } from '@/generated/prisma/client'

const auteurInclude = {
  select: {
    id: true,
    utilisateur: { select: { email: true } },
    apiKey: { select: { label: true } },
  },
} as const

export const niveauConfianceInclude = {
  commentaire: { include: commentaireInclude },
  auteurCreation: auteurInclude,
  auteurModification: auteurInclude,
} satisfies Prisma.NiveauConfianceInclude

export type NiveauConfianceRow = Prisma.NiveauConfianceGetPayload<{
  include: typeof niveauConfianceInclude
}>

type AuteurRow = {
  id: string
  utilisateur: { email: string } | null
  apiKey: { label: string } | null
}

const toAuteurApiModel = (row: AuteurRow): NiveauConfianceApiModel['auteurCreation'] => {
  if (row.utilisateur) {
    return { type: 'utilisateur', id: row.id, email: row.utilisateur.email }
  }
  if (row.apiKey) {
    return { type: 'apiKey', id: row.id, label: row.apiKey.label }
  }
  throw new Error(`Principal ${row.id} sans utilisateur ni clé API associé`)
}

export const toNiveauConfianceApiModel = (row: NiveauConfianceRow): NiveauConfianceApiModel => ({
  id: row.id,
  indice: row.indice,
  commentaire: toCommentaireApiModel(row.commentaire),
  auteurCreation: toAuteurApiModel(row.auteurCreation),
  auteurModification: toAuteurApiModel(row.auteurModification),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})
