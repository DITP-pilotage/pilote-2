import {
  type ArticleCentreAideApiModel,
  type ModifierArticleBody,
} from '@pilote/kpilote-shared/centreAide'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { htmlToPlainText, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

export type ModifierArticleError =
  | { type: 'PARENT_INTROUVABLE' }
  | { type: 'PARENT_PAS_UN_GROUPE' }
  | { type: 'DEPLACEMENT_CIRCULAIRE' }

// Remplacement complet et idempotent de l'état éditable d'un article. Le client possède
// l'instantané publié (titre/titreAffiche/contenu) ; le serveur dérive contenuTexte et
// réindexe les frères pour placer l'article à `ordre`. Valide que le parent cible est un
// groupe et qu'on ne crée pas de cycle.
const performModifier = async (
  id: string,
  body: ModifierArticleBody,
): Promise<Result<ArticleCentreAideApiModel, ModifierArticleError>> => {
  ensureAdmin()
  const principalId = requireCurrentPrincipalId()
  const { parentId, ordre } = body

  await db().articleCentreAide.findUniqueOrThrow({ where: { id } })

  const tous = await db().articleCentreAide.findMany({
    where: { statut: 'ACTIF' },
    select: { id: true, parentId: true, type: true, ordre: true },
  })
  const parId = new Map(tous.map((article) => [article.id, article]))

  if (parentId !== null) {
    const parent = parId.get(parentId)
    if (!parent) return err({ type: 'PARENT_INTROUVABLE' })
    if (parent.type !== 'GROUPE') return err({ type: 'PARENT_PAS_UN_GROUPE' })
    // Interdit de déplacer un noeud dans lui-même ou l'un de ses descendants.
    for (
      let courant: string | null = parentId;
      courant;
      courant = parId.get(courant)?.parentId ?? null
    ) {
      if (courant === id) return err({ type: 'DEPLACEMENT_CIRCULAIRE' })
    }
  }

  await db().articleCentreAide.update({
    where: { id },
    data: {
      titreBrouillon: body.titreBrouillon,
      titreAfficheBrouillon: body.titreAfficheBrouillon,
      contenuBrouillon: body.contenuBrouillon,
      titre: body.titre,
      titreAffiche: body.titreAffiche,
      contenu: body.contenu,
      contenuTexte: htmlToPlainText(body.contenu),
      parentId,
      estMasque: body.estMasque,
      estPublie: body.estPublie,
      statut: body.statut,
      updatedBy: principalId,
    },
  })

  const freres = tous
    .filter((article) => article.parentId === parentId && article.id !== id)
    .sort((a, b) => a.ordre - b.ordre)
    .map((article) => article.id)

  const position = Math.max(0, Math.min(ordre, freres.length))
  const ordonnes = [...freres.slice(0, position), id, ...freres.slice(position)]
  for (const [rang, articleId] of ordonnes.entries()) {
    await db().articleCentreAide.update({
      where: { id: articleId },
      data: { ordre: rang, updatedBy: principalId },
    })
  }

  const maj = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  return ok(toArticleCentreAideApiModel(maj))
}

export const modifierArticleCentreAide = (
  id: string,
  body: ModifierArticleBody,
): ResultAsync<ArticleCentreAideApiModel, ModifierArticleError> =>
  new ResultAsync(performModifier(id, body))
