import { type AuteurApiModel } from '@pilote/kpilot-shared/auteur'

import { type Prisma } from '@/generated/prisma/client'

export const auteurInclude = {
  select: {
    id: true,
    utilisateur: { select: { email: true } },
    apiKey: { select: { label: true } },
  },
} as const

type AuteurRow = Prisma.PrincipalGetPayload<typeof auteurInclude>

export const toAuteurApiModel = (row: AuteurRow): AuteurApiModel => {
  if (row.utilisateur) {
    return { type: 'utilisateur', id: row.id, email: row.utilisateur.email }
  }
  if (row.apiKey) {
    return { type: 'apiKey', id: row.id, label: row.apiKey.label }
  }
  throw new Error(`Principal ${row.id} sans utilisateur ni clé API associé`)
}
