import type {
  ArticleCentreAideApiModel,
  ArticleCentreAideListApiModel,
  CreerArticleCentreAideBody,
  ModifierArticleBody,
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

export const modifierArticleCentreAide = async (
  id: string,
  body: ModifierArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  const json = await bffClient.put(`${CHEMIN}/${id}`, { json: body }).json()
  return articleCentreAideApiModelSchema.parse(json)
}

export const fetchArticlesCentreAideCorbeille =
  async (): Promise<ArticleCentreAideListApiModel> => {
    const json = await bffClient.get(`${CHEMIN}/corbeille`).json()
    return articleCentreAideListApiModelSchema.parse(json)
  }

// Suppression définitive (l'article doit être en corbeille).
export const supprimerArticleCentreAide = async (id: string): Promise<void> => {
  await bffClient.delete(`${CHEMIN}/${id}`)
}
