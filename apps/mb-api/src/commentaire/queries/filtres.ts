import { type Prisma } from '@/generated/prisma/client'

// Filtre sur le `type` quel que soit le satellite (un seul satellite est renseigné par commentaire).
export const filtreParType = (type: string): Prisma.CommentaireWhereInput => ({
  OR: [
    { indicateurIndividu: { type: type as never } },
    { panierIndividu: { type: type as never } },
    { panier: { type: type as never } },
  ],
})
