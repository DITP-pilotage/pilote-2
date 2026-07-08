import { type CommentaireApiModel } from '@pilote/kpilot-shared/commentaire'

import { auteurInclude, toAuteurApiModel } from '@/commentaire/auteur'
import { type Prisma } from '@/generated/prisma/client'

// Dérive un texte brut depuis un contenu HTML riche (recherche / LLM).
// Implémentation minimale (strip de balises + normalisation des espaces) ;
// à durcir si le richEditor introduit des structures complexes.
export const htmlToPlainText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const commentaireInclude = {
  auteurCreation: auteurInclude,
  auteurModification: auteurInclude,
  indicateurIndividu: { include: { individu: { select: { publicId: true } } } },
  panier: true,
} satisfies Prisma.CommentaireInclude

export type CommentaireRow = Prisma.CommentaireGetPayload<{ include: typeof commentaireInclude }>

const typeDuCommentaire = (row: CommentaireRow): string =>
  row.indicateurIndividu?.type ?? row.panier?.type ?? 'DEFAUT'

const individuPublicId = (row: CommentaireRow): string | null =>
  row.indicateurIndividu?.individu.publicId ?? null

export const toCommentaireApiModel = (row: CommentaireRow): CommentaireApiModel => ({
  id: row.id,
  type: typeDuCommentaire(row),
  individuId: individuPublicId(row),
  contenu: row.contenu,
  statut: row.statut,
  auteurCreation: toAuteurApiModel(row.auteurCreation),
  auteurModification: toAuteurApiModel(row.auteurModification),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})
