import {
  type CommentaireApiModel,
  type NiveauConfianceApiModel,
} from '@pilote/mb-shared/commentaire'

import { type Prisma } from '@/generated/prisma/client'

type AuteurRow = {
  id: string
  utilisateur: { email: string } | null
  apiKey: { label: string } | null
}

// Dérive un texte brut depuis un contenu HTML riche (recherche / LLM).
// Implémentation minimale (strip de balises + normalisation des espaces) ;
// à durcir si le richEditor introduit des structures complexes.
export const htmlToPlainText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Include réutilisable pour toutes les queries renvoyant un CommentaireApiModel.
const auteurInclude = {
  select: {
    id: true,
    utilisateur: { select: { email: true } },
    apiKey: { select: { label: true } },
  },
} as const

export const commentaireInclude = {
  auteurCreation: auteurInclude,
  auteurModification: auteurInclude,
  indicateurIndividu: { include: { individu: { select: { publicId: true } } } },
  panierIndividu: { include: { individu: { select: { publicId: true } } } },
  panier: true,
} satisfies Prisma.CommentaireInclude

export type CommentaireRow = Prisma.CommentaireGetPayload<{ include: typeof commentaireInclude }>

const typeDuCommentaire = (row: CommentaireRow): string =>
  row.indicateurIndividu?.type ?? row.panierIndividu?.type ?? row.panier?.type ?? 'DEFAUT'

const individuPublicId = (row: CommentaireRow): string | null =>
  row.indicateurIndividu?.individu.publicId ?? row.panierIndividu?.individu.publicId ?? null

const toAuteurApiModel = (row: AuteurRow): CommentaireApiModel['auteurCreation'] => {
  if (row.utilisateur) {
    return { type: 'utilisateur', id: row.id, email: row.utilisateur.email }
  }
  if (row.apiKey) {
    return { type: 'apiKey', id: row.id, label: row.apiKey.label }
  }
  throw new Error(`Principal ${row.id} sans utilisateur ni clé API associé`)
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

// Include avec le dernier indice (courant) du commentaire.
export const niveauConfianceInclude = {
  ...commentaireInclude,
  niveauxConfiance: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.CommentaireInclude

export type NiveauConfianceRow = Prisma.CommentaireGetPayload<{
  include: typeof niveauConfianceInclude
}>

export const toNiveauConfianceApiModel = (row: NiveauConfianceRow): NiveauConfianceApiModel => {
  const indice = row.niveauxConfiance[0]?.indice
  if (!indice) {
    throw new Error(`Commentaire ${row.id} de type CONFIANCE sans NiveauConfiance`)
  }
  return { ...toCommentaireApiModel(row), indice }
}
