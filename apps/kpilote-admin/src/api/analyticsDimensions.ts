import {
  analyticsDimensionListSchema,
  analyticsDimensionSchema,
  type AnalyticsDimension,
  type UpsertAnalyticsDimensionBody,
} from '@pilote/kpilote-shared/analytics/dimensions'

import { bffClient } from '@/api/client'

export const fetchAnalyticsDimensions = async (): Promise<AnalyticsDimension[]> =>
  analyticsDimensionListSchema.parse(await bffClient.get('analytics/dimensions').json())

export const upsertAnalyticsDimension = async (
  cle: string,
  body: UpsertAnalyticsDimensionBody,
): Promise<AnalyticsDimension> =>
  analyticsDimensionSchema.parse(
    await bffClient.put(`analytics/dimensions/${cle}`, { json: body }).json(),
  )

export const deleteAnalyticsDimension = async (cle: string): Promise<void> => {
  await bffClient.delete(`analytics/dimensions/${cle}`)
}
