import type {
  ArticleCentreAideApiModel,
  ArticleCentreAideListApiModel,
  BasculerVisibiliteArticleBody,
  CreerArticleCentreAideBody,
  DeplacerArticleBody,
  DeplacerArticleVersBody,
  ModifierBrouillonArticleBody,
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

// Suppression logique : l'article part en corbeille (PIL-1685 #2).
export const supprimerArticleCentreAide = async (
  id: string,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.delete(`${CHEMIN}/${id}`).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const restaurerArticleCentreAide = async (
  id: string,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.post(`${CHEMIN}/${id}/restaurer`).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const supprimerDefinitivementArticleCentreAide = async (id: string): Promise<void> => {
  await bffClient.delete(`${CHEMIN}/${id}/definitif`)
}
