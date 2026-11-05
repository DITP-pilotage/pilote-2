import type { RateBody } from '@pilote/kpilote-shared/assistant/feedback'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { apiClient } from '@/api/client'
import { DEFAULT_STALE_TIME } from '@/queries/utils'

const accessSchema = z.object({ allowed: z.boolean() })

export const assistantAccessQueryOptions = () =>
  queryOptions({
    queryKey: ['assistant', 'acces'],
    queryFn: async () => accessSchema.parse(await apiClient.get('assistant/acces').json()),
    staleTime: DEFAULT_STALE_TIME,
  })

export const rateCall = async ({
  llmCallId,
  body,
}: {
  llmCallId: string
  body: RateBody
}): Promise<void> => {
  await apiClient.post(`assistant/appels/${llmCallId}/evaluation`, { json: body })
}
