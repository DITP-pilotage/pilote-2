import { z } from 'zod'

import { apiClient } from '@/api/client'

const meSchema = z.object({
  id: z.string(),
  source: z.literal('jwt'),
})

export type Me = z.infer<typeof meSchema>

export const fetchMe = async (): Promise<Me> => {
  const json = await apiClient.get('me').json()
  return meSchema.parse(json)
}
