import { createRemoteJWKSet, jwtVerify } from 'jose'
import { z } from 'zod'

import { env } from '@/env'

const jwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URI))

const jwtPayloadSchema = z.object({
  sub: z.string().min(1),
  given_name: z.string().min(1),
  usual_name: z.string().min(1),
})

export type VerifiedTokenInfo = {
  providerSub: string
  providerType: 'proconnect'
  prenom: string
  nom: string
}

const USERINFO_CACHE_TTL_MS = 30_000
const USERINFO_CACHE_MAX_ENTRIES = 5_000

type CacheEntry = { value: VerifiedTokenInfo; expiresAt: number }
const userinfoCache = new Map<string, CacheEntry>()

const readCache = (token: string): VerifiedTokenInfo | null => {
  const entry = userinfoCache.get(token)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    userinfoCache.delete(token)
    return null
  }
  return entry.value
}

const writeCache = (token: string, value: VerifiedTokenInfo): void => {
  if (userinfoCache.size >= USERINFO_CACHE_MAX_ENTRIES) {
    const firstKey = userinfoCache.keys().next().value
    if (firstKey !== undefined) userinfoCache.delete(firstKey)
  }
  userinfoCache.set(token, { value, expiresAt: Date.now() + USERINFO_CACHE_TTL_MS })
}

export const verifyAccessToken = async (token: string): Promise<VerifiedTokenInfo> => {
  const cached = readCache(token)
  if (cached) return cached

  const response = await fetch(env.OIDC_USERINFO_URL, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`userinfo request failed: ${response.status}`)
  }

  const userinfoJwt = await response.text()
  const { payload } = await jwtVerify(userinfoJwt, jwks, {
    issuer: env.OIDC_ISSUER_URL,
    audience: env.OIDC_AUDIENCE,
    algorithms: ['RS256'],
    clockTolerance: 30,
  })

  const claims = jwtPayloadSchema.parse(payload)

  const result: VerifiedTokenInfo = {
    providerSub: claims.sub,
    providerType: 'proconnect',
    prenom: claims.given_name,
    nom: claims.usual_name,
  }
  writeCache(token, result)
  return result
}
