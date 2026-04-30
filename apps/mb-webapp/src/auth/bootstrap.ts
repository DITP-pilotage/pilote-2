import { refreshAccessToken } from '@/auth/refresh'

export const bootstrapSession = async (): Promise<{ authenticated: boolean }> => {
  const token = await refreshAccessToken()
  return { authenticated: token !== null }
}
