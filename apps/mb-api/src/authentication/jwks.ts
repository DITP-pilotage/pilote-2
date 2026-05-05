import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

import { env } from '@/env'

const jwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URI))

export type VerifiedTokenInfo = {
  providerSub: string
  providerType: 'keycloak'
}

export const verifyAccessToken = async (token: string): Promise<VerifiedTokenInfo> => {
  // Quand on aura plusieurs OIDC, il faudra vérifier le issuer en fonction du provider
  const { payload } = await jwtVerify(token, jwks, {
    issuer: env.OIDC_ISSUER_URL,
    audience: env.OIDC_AUDIENCE,
    algorithms: ['RS256'],
    clockTolerance: 30,
  })

  if (payload.typ !== 'Bearer') {
    throw new Error(`Unexpected token typ claim: ${String(payload.typ)}`)
  }

  if (!isAuthorizedParty(payload)) {
    throw new Error('Unexpected authorized party')
  }

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('Missing sub claim')
  }

  return { providerSub: payload.sub, providerType: 'keycloak' }
}

const isAuthorizedParty = (payload: JWTPayload) =>
  typeof payload.azp === 'string' && payload.azp === env.OIDC_AUTHORIZED_PARTY
