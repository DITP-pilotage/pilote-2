import {
  type ArticleCentreAideApiModel,
  type ModifierArticleBody,
} from '@pilote/kpilote-shared/centreAide'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import {
  checkParentEstUnGroupe,
  checkSansDeplacementCirculaire,
  type DeplacementCirculaireError,
  type ParentInvalideError,
} from '@/centreAide/rules'
import { htmlToPlainText, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type ArticleCentreAideType } from '@/generated/prisma/enums'

export type ModifierArticleError = ParentInvalideError | DeplacementCirculaireError

type ArticleActif = {
  id: string
  parentId: string | null
  type: ArticleCentreAideType
  ordre: number
}

// Le parent puis ses ancêtres jusqu'à la racine, parmi les articles actifs.
// Le Set de visités protège d'un cycle déjà présent en base.
const cheminVersRacine = ({
  depuis,
  articleById,
}: {
  depuis: string | null
  articleById: ReadonlyMap<string, ArticleActif>
}): string[] => {
  const chemin: string[] = []
  const visites = new Set<string>()
  for (
    let courant = depuis;
    courant && !visites.has(courant);
    courant = articleById.get(courant)?.parentId ?? null
  ) {
    chemin.push(courant)
    visites.add(courant)
  }
  return chemin
}

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

  const tous: ArticleActif[] = await db().articleCentreAide.findMany({
    where: { statut: 'ACTIF' },
    select: { id: true, parentId: true, type: true, ordre: true },
  })
  const articleById = new Map(tous.map((article) => [article.id, article]))

  const parentValide = checkParentEstUnGroupe({
    parentId,
    parent: parentId === null ? undefined : articleById.get(parentId),
  })
  if (parentValide.isErr()) return err(parentValide.error)

  const sansCycle = checkSansDeplacementCirculaire({
    articleId: id,
    cheminDuParent: cheminVersRacine({ depuis: parentId, articleById }),
  })
  if (sansCycle.isErr()) return err(sansCycle.error)

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
