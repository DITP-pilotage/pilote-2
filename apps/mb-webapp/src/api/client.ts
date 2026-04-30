import ky from 'ky'

import { env } from '@/env'

export const apiClient = ky.create({
  prefixUrl: env.apiUrl,
  credentials: 'include',
})
