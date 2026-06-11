import { createRemoteJWKSet, jwtVerify } from 'jose'
import ky from 'ky'
import { LRUCache } from 'lru-cache'
import { z } from 'zod'

import { env } from '@/env'

const proconnectJwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URI))
const keycloakJwks = createRemoteJWKSet(new URL(env.KEYCLOAK_JWKS_URI))

const proconnectClaimsSchema = z.object({
  sub: z.string().min(1),
  given_name: z.string().min(1),
  usual_name: z.string().min(1),
  email: z.string().min(1),
})

const keycloakClaimsSchema = z.object({
  sub: z.string().min(1),
  given_name: z.string().min(1),
  family_name: z.string().min(1),
  email: z.string().min(1),
})

export type VerifiedTokenInfo = {
  provider: 'proconnect' | 'keycloak'
  providerSub: string
  email: string
  prenom: string
  nom: string
}

const userinfoCache = new LRUCache<string, VerifiedTokenInfo>({
  max: 5_000,
  ttl: 30_000,
})

const verifyProconnectToken = async (token: string): Promise<VerifiedTokenInfo> => {
  const userinfoJwt = await ky
    .get(env.OIDC_USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
      retry: 0,
      timeout: 5000,
    })
    .text()

  const { payload } = await jwtVerify(userinfoJwt, proconnectJwks, {
    issuer: env.OIDC_ISSUER_URL,
    audience: env.OIDC_AUDIENCE,
    algorithms: ['RS256'],
    clockTolerance: 30,
  })

  const claims = proconnectClaimsSchema.parse(payload)

  return {
    provider: 'proconnect',
    providerSub: claims.sub,
    email: claims.email,
    prenom: claims.given_name,
    nom: claims.usual_name,
  }
}

const verifyKeycloakToken = async (token: string): Promise<VerifiedTokenInfo> => {
  const { payload } = await jwtVerify(token, keycloakJwks, {
    issuer: env.KEYCLOAK_ISSUER_URL,
    audience: env.KEYCLOAK_AUDIENCE,
    algorithms: ['RS256'],
    clockTolerance: 30,
  })

  const claims = keycloakClaimsSchema.parse(payload)

  return {
    provider: 'keycloak',
    providerSub: claims.sub,
    email: claims.email,
    prenom: claims.given_name,
    nom: claims.family_name,
  }
}

const isJwt = (token: string): boolean => token.split('.').length === 3

export const verifyAccessToken = async (token: string): Promise<VerifiedTokenInfo> => {
  const cached = userinfoCache.get(token)
  if (cached) return cached

  const result = await (isJwt(token) ? verifyKeycloakToken(token) : verifyProconnectToken(token))

  userinfoCache.set(token, result)
  return result
}
