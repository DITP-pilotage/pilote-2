import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

import { env } from '@/env'

const jwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URI))

export type AuthenticatedUser = {
  id: string
  source: 'jwt'
}

export const verifyAccessToken = async (token: string): Promise<AuthenticatedUser> => {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: env.OIDC_ISSUER_URL,
    clockTolerance: 30,
  })

  if (!isAuthorizedParty(payload)) {
    throw new Error('Unexpected authorized party')
  }

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('Missing sub claim')
  }

  return { id: payload.sub, source: 'jwt' }
}

const isAuthorizedParty = (payload: JWTPayload) =>
  typeof payload.azp === 'string' && payload.azp === env.OIDC_AUTHORIZED_PARTY
