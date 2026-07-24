import {
  type ArticleCentreAideApiModel,
  type DeplacerArticleVersBody,
} from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

// Déplacement absolu (drag-and-drop) : place l'article sous `parentId` à la
// position `index`, et réindexe l'ordre des frères. Valide que la cible est un
// groupe (ou la racine) et qu'on ne crée pas de cycle.
const performDeplacerVers = async (
  id: string,
  body: DeplacerArticleVersBody,
): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()
  const { parentId, index } = body

  await db().articleCentreAide.findUniqueOrThrow({ where: { id } })

  const tous = await db().articleCentreAide.findMany({
    where: { statut: 'ACTIF' },
    select: { id: true, parentId: true, type: true, ordre: true },
  })
  const parId = new Map(tous.map((article) => [article.id, article]))

  if (parentId !== null) {
    const parent = parId.get(parentId)
    if (!parent) throw new ValidationError('Le parent cible est introuvable.')
    if (parent.type !== 'GROUPE') {
      throw new ValidationError('Un article ne peut être rangé que dans un groupe.')
    }
    // Interdit de déplacer un noeud dans lui-même ou l'un de ses descendants.
    for (
      let courant: string | null = parentId;
      courant;
      courant = parId.get(courant)?.parentId ?? null
    ) {
      if (courant === id) throw new ValidationError('Déplacement circulaire impossible.')
    }
  }

  const freres = tous
    .filter((article) => article.parentId === parentId && article.id !== id)
    .sort((a, b) => a.ordre - b.ordre)
    .map((article) => article.id)

  const position = Math.max(0, Math.min(index, freres.length))
  const ordonnes = [...freres.slice(0, position), id, ...freres.slice(position)]

  await db().articleCentreAide.update({
    where: { id },
    data: { parentId, updatedBy: principalId },
  })
  for (const [rang, articleId] of ordonnes.entries()) {
    await db().articleCentreAide.update({
      where: { id: articleId },
      data: { ordre: rang },
    })
  }

  const maj = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  return toArticleCentreAideApiModel(maj)
}

export const deplacerArticleVersCentreAide = (
  id: string,
  body: DeplacerArticleVersBody,
): ResultAsync<ArticleCentreAideApiModel, never> =>
  ResultAsync.fromSafePromise(performDeplacerVers(id, body))
