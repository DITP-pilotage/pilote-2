import {
  type ArticleCentreAideApiModel,
  type DirectionDeplacement,
} from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const performDeplacer = async (
  id: string,
  direction: DirectionDeplacement,
): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()

  const article = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  const freres = await db().articleCentreAide.findMany({
    where: { parentId: article.parentId },
    orderBy: { ordre: 'asc' },
  })
  const index = freres.findIndex((frere) => frere.id === id)

  if (direction === 'monter' || direction === 'descendre') {
    const voisin = freres[direction === 'monter' ? index - 1 : index + 1]
    if (!voisin) return toArticleCentreAideApiModel(article)
    await db().articleCentreAide.update({
      where: { id: article.id },
      data: { ordre: voisin.ordre, updatedBy: principalId },
    })
    await db().articleCentreAide.update({
      where: { id: voisin.id },
      data: { ordre: article.ordre, updatedBy: principalId },
    })
    const rafraichi = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
    return toArticleCentreAideApiModel(rafraichi)
  }

  if (direction === 'entrer') {
    const precedent = freres[index - 1]
    if (!precedent) return toArticleCentreAideApiModel(article)
    const agregat = await db().articleCentreAide.aggregate({
      where: { parentId: precedent.id },
      _max: { ordre: true },
    })
    const updated = await db().articleCentreAide.update({
      where: { id },
      data: {
        parentId: precedent.id,
        ordre: (agregat._max.ordre ?? -1) + 1,
        updatedBy: principalId,
      },
    })
    return toArticleCentreAideApiModel(updated)
  }

  // sortir : remonter d'un niveau et se placer juste après l'ancien parent.
  if (article.parentId === null) return toArticleCentreAideApiModel(article)
  const parent = await db().articleCentreAide.findUniqueOrThrow({ where: { id: article.parentId } })
  await db().articleCentreAide.updateMany({
    where: { parentId: parent.parentId, ordre: { gt: parent.ordre } },
    data: { ordre: { increment: 1 } },
  })
  const updated = await db().articleCentreAide.update({
    where: { id },
    data: { parentId: parent.parentId, ordre: parent.ordre + 1, updatedBy: principalId },
  })
  return toArticleCentreAideApiModel(updated)
}

export const deplacerArticleCentreAide = (
  id: string,
  direction: DirectionDeplacement,
): ResultAsync<ArticleCentreAideApiModel, never> =>
  ResultAsync.fromSafePromise(performDeplacer(id, direction))
