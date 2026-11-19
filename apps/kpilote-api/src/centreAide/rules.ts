import { err, ok, type Result } from 'neverthrow'

import { type ArticleCentreAideStatut, type ArticleCentreAideType } from '@/generated/prisma/enums'

export type ArticleHorsCorbeilleError = { type: 'ARTICLE_HORS_CORBEILLE' }

// La suppression définitive ne se fait que depuis la corbeille.
export const checkArticleSupprimable = ({
  statut,
}: {
  statut: ArticleCentreAideStatut
}): Result<void, ArticleHorsCorbeilleError> => {
  if (statut !== 'CORBEILLE') return err({ type: 'ARTICLE_HORS_CORBEILLE' })
  return ok()
}

export type ParentInvalideError = { type: 'PARENT_INTROUVABLE' } | { type: 'PARENT_PAS_UN_GROUPE' }

// Un article se range à la racine ou dans un groupe actif.
export const checkParentEstUnGroupe = ({
  parentId,
  parent,
}: {
  parentId: string | null
  // Le parent parmi les articles actifs, s'il y est.
  parent: { type: ArticleCentreAideType } | undefined
}): Result<void, ParentInvalideError> => {
  if (parentId === null) return ok()
  if (!parent) return err({ type: 'PARENT_INTROUVABLE' })
  if (parent.type !== 'GROUPE') return err({ type: 'PARENT_PAS_UN_GROUPE' })
  return ok()
}

export type DeplacementCirculaireError = { type: 'DEPLACEMENT_CIRCULAIRE' }

// Un article ne se range ni dans lui-même ni dans l'un de ses descendants.
export const checkSansDeplacementCirculaire = ({
  articleId,
  cheminDuParent,
}: {
  articleId: string
  // Le parent puis ses ancêtres jusqu'à la racine ; vide à la racine.
  cheminDuParent: ReadonlyArray<string>
}): Result<void, DeplacementCirculaireError> => {
  if (cheminDuParent.includes(articleId)) return err({ type: 'DEPLACEMENT_CIRCULAIRE' })
  return ok()
}
