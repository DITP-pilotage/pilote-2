import {
  type ArticleCentreAideApiModel,
  type ArticleCentreAidePublicApiModel,
} from '@pilote/kpilote-shared/centreAide'

import { type ArticleCentreAide } from '@/generated/prisma/client'

export const MESSAGE_ADMIN = 'Cette opération requiert une clé API de rôle ADMIN'

// Dérive un texte brut cherchable depuis le contenu HTML riche du centre d'aide.
// Version durcie (vs le helper commentaire) : conserve les titres d'accordéon
// (attribut data-title) et insère des espaces aux frontières de bloc pour ne pas
// coller les mots des callouts / listes / titres.
export const htmlToPlainText = (html: string): string =>
  html
    .replace(/<[^>]*\bdata-title="([^"]*)"[^>]*>/gi, ' $1 ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|td|th|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

export const toArticleCentreAideApiModel = (row: ArticleCentreAide): ArticleCentreAideApiModel => ({
  id: row.id,
  type: row.type,
  parentId: row.parentId,
  ordre: row.ordre,
  estPublie: row.estPublie,
  estMasque: row.estMasque,
  titre: row.titre,
  titreAffiche: row.titreAffiche,
  contenu: row.contenu,
  titreBrouillon: row.titreBrouillon,
  titreAfficheBrouillon: row.titreAfficheBrouillon,
  contenuBrouillon: row.contenuBrouillon,
  statut: row.statut,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

// Un groupe n'a pas d'état publié : son titre courant vit dans les champs
// brouillon. On retombe donc sur le brouillon quand le titre publié est vide.
export const toArticleCentreAidePublicApiModel = (
  row: ArticleCentreAide,
): ArticleCentreAidePublicApiModel => ({
  id: row.id,
  type: row.type,
  parentId: row.parentId,
  ordre: row.ordre,
  titre: row.titre || row.titreBrouillon,
  titreAffiche: row.titreAffiche || row.titreAfficheBrouillon || row.titre || row.titreBrouillon,
  contenu: row.contenu,
  contenuTexte: row.contenuTexte,
})
