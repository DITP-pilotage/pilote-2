import {
  DossierCommentaireType,
  IndicateurIndividuCommentaireType,
  type Prisma,
} from '@/generated/prisma/client'

// Filtre sur le `type` quel que soit le satellite (un seul satellite est renseigné par commentaire).
// Chaque satellite a son propre enum : on n'inclut une branche que si la valeur appartient à son enum,
// sinon Prisma rejette la requête (validation runtime).
export const filtreParType = (type: string): Prisma.CommentaireWhereInput => {
  const branches: Prisma.CommentaireWhereInput[] = []
  if (type in IndicateurIndividuCommentaireType) {
    branches.push({ indicateurIndividu: { type: type as IndicateurIndividuCommentaireType } })
  }
  if (type in DossierCommentaireType) {
    branches.push({ dossier: { type: type as DossierCommentaireType } })
  }
  return { OR: branches }
}
