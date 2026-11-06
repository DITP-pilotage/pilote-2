import { type CommentaireApiModel } from '@pilote/kpilote-shared/commentaire'

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
  indicateurIndividu: {
    include: {
      cellule: {
        include: {
          coordonnees: { include: { individu: { select: { publicId: true } } } },
        },
      },
      indicateur: { select: { dimensions: { select: { dimensionId: true, ordre: true } } } },
    },
  },
  collection: true,
} satisfies Prisma.CommentaireInclude

export type CommentaireRow = Prisma.CommentaireGetPayload<{ include: typeof commentaireInclude }>

const typeDuCommentaire = (row: CommentaireRow): string =>
  row.indicateurIndividu?.type ?? row.collection?.type ?? 'DEFAUT'

// Identifiant public de la cellule commentée, membres dans l'ordre des dimensions
// de l'indicateur (= publicId de l'individu en mono-dimension).
const individuPublicId = (row: CommentaireRow): string | null => {
  const satellite = row.indicateurIndividu
  if (!satellite) return null
  const ordre = new Map(satellite.indicateur.dimensions.map((d) => [d.dimensionId, d.ordre]))
  return [...satellite.cellule.coordonnees]
    .sort(
      (a, b) =>
        (ordre.get(a.dimensionId) ?? Number.MAX_SAFE_INTEGER) -
        (ordre.get(b.dimensionId) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((coordonnee) => coordonnee.individu.publicId)
    .join('~')
}

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
