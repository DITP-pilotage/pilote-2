import { type MeFeatureApiModel } from '@pilote/kpilote-shared/meFeature'
import { ResultAsync } from 'neverthrow'

import { loadFeaturesActives } from '@/feature/isFeatureActive'

export const listerMesFeatures = (): ResultAsync<MeFeatureApiModel, never> =>
  ResultAsync.fromSafePromise(loadFeaturesActives()).map((features) => ({ features }))
