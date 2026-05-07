import { createRemoteJWKSet, jwtVerify } from 'jose'
import { z } from 'zod'

import { env } from '@/env'

const jwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URI))

const jwtPayloadSchema = z.object({
  typ: z.literal('Bearer'),
  azp: z.literal(env.OIDC_AUTHORIZED_PARTY),
  sub: z.string().min(1),
  given_name: z.string().min(1).optional(),
  family_name: z.string().min(1).optional(),
})

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

  const claims = jwtPayloadSchema.parse(payload)

  return { providerSub: claims.sub, providerType: 'keycloak' }
}
