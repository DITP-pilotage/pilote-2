import { createRemoteJWKSet, jwtVerify } from 'jose'
import ky from 'ky'
import { LRUCache } from 'lru-cache'
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

const userinfoCache = new LRUCache<string, VerifiedTokenInfo>({
  max: 5_000,
  ttl: 30_000,
})

export const verifyAccessToken = async (token: string): Promise<VerifiedTokenInfo> => {
  const cached = userinfoCache.get(token)
  if (cached) return cached

  const userinfoJwt = await ky
    .get(env.OIDC_USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
      retry: 0,
      timeout: 5000,
    })
    .text()

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
  userinfoCache.set(token, result)
  return result
}
