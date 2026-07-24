import type {
  ArticleCentreAideApiModel,
  ArticleCentreAideListApiModel,
  BasculerVisibiliteArticleBody,
  CreerArticleCentreAideBody,
  DeplacerArticleBody,
  DeplacerArticleVersBody,
  ModifierBrouillonArticleBody,
  ModifierStatutArticleBody,
} from '@pilote/kpilote-shared/centreAide'
import {
  articleCentreAideApiModelSchema,
  articleCentreAideListApiModelSchema,
} from '@pilote/kpilote-shared/centreAide'

import { bffClient } from '@/api/client'

const CHEMIN = 'centre-aide/articles'

export const fetchArticlesCentreAide = async (): Promise<ArticleCentreAideListApiModel> => {
  const json = await bffClient.get(CHEMIN).json()
  return articleCentreAideListApiModelSchema.parse(json)
}

export const creerArticleCentreAide = async (
  body: CreerArticleCentreAideBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(CHEMIN, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const modifierBrouillonArticleCentreAide = async (
  id: string,
  body: ModifierBrouillonArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.put(`${CHEMIN}/${id}`, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const publierArticleCentreAide = async (id: string): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(`${CHEMIN}/${id}/publier`).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const depublierArticleCentreAide = async (
  id: string,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(`${CHEMIN}/${id}/depublier`).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const basculerVisibiliteArticleCentreAide = async (
  id: string,
  body: BasculerVisibiliteArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(`${CHEMIN}/${id}/visibilite`, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const deplacerArticleCentreAide = async (
  id: string,
  body: DeplacerArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(`${CHEMIN}/${id}/deplacer`, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const deplacerArticleVersCentreAide = async (
  id: string,
  body: DeplacerArticleVersBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(`${CHEMIN}/${id}/deplacer-vers`, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const fetchArticlesCentreAideCorbeille =
  async (): Promise<ArticleCentreAideListApiModel> => {
    const json = await bffClient.get(`${CHEMIN}/corbeille`).json()
    return articleCentreAideListApiModelSchema.parse(json)
  }

// Transition de cycle de vie : CORBEILLE = mettre à la corbeille, ACTIF = restaurer.
export const modifierStatutArticleCentreAide = async (
  id: string,
  body: ModifierStatutArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.patch(`${CHEMIN}/${id}/statut`, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

// Suppression définitive (l'article doit être en corbeille).
export const supprimerArticleCentreAide = async (id: string): Promise<void> => {
  await bffClient.delete(`${CHEMIN}/${id}`)
}
