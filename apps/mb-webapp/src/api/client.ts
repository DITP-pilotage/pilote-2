import ky from 'ky'

import { refreshAccessToken } from '@/auth/refresh'
import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

const RETRY_FLAG = 'x-mb-retried'

export const apiClient = ky.create({
  prefixUrl: env.apiUrl,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = tokenStore.get()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401 || request.headers.get(RETRY_FLAG)) {
          return response
        }

        const token = await refreshAccessToken()
        if (!token) {
          window.location.assign('/auth/login')
          return response
        }

        const retryRequest = new Request(request, {
          headers: new Headers(request.headers),
        })
        retryRequest.headers.set('Authorization', `Bearer ${token}`)
        retryRequest.headers.set(RETRY_FLAG, '1')
        return fetch(retryRequest)
      },
    ],
  },
})
