import ky from 'ky'

import { refreshAccessToken } from '@/auth'
import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

const apiOrigin = new URL(env.apiUrl).origin

export const isApiOrigin = (url: string): boolean => {
  try {
    return new URL(url).origin === apiOrigin
  } catch {
    return false
  }
}

export const apiClient = ky.create({
  prefixUrl: env.apiUrl,
  retry: {
    limit: 1,
    statusCodes: [401],
    methods: ['get', 'post', 'put', 'patch', 'delete', 'head'],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        if (!isApiOrigin(request.url)) return
        const token = tokenStore.get()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    beforeRetry: [
      async ({ request }) => {
        const token = await refreshAccessToken()
        if (!token) {
          window.location.assign('/auth/login')
          return ky.stop
        }
        request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
  },
})
