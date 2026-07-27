import {
  articleCentreAidePublicListApiModelSchema,
  type ArticleCentreAidePublicListApiModel,
} from '@pilote/kpilote-shared/centreAide'

import { apiClient } from '@/api/client'

export const fetchArticlesCentreAidePublies =
  async (): Promise<ArticleCentreAidePublicListApiModel> => {
    const json = await apiClient.get('centre-aide/public').json()
    return articleCentreAidePublicListApiModelSchema.parse(json)
  }
