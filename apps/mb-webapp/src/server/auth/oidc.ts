import * as client from 'openid-client'
import { z } from 'zod'

import { serverEnv } from '@/server/env'

export const providerSchema = z.enum(['proconnect', 'keycloak'])
export type Provider = z.infer<typeof providerSchema>

const configs: Record<Provider, Promise<client.Configuration> | null> = {
  proconnect: null,
  keycloak: null,
}

const buildConfig = (provider: Provider): Promise<client.Configuration> => {
  const [issuer, clientId, secret] =
    provider === 'proconnect'
      ? [serverEnv.OIDC_ISSUER_URL, serverEnv.OIDC_CLIENT_ID, serverEnv.OIDC_CLIENT_SECRET]
      : [
          serverEnv.KEYCLOAK_ISSUER_URL,
          serverEnv.KEYCLOAK_CLIENT_ID,
          serverEnv.KEYCLOAK_CLIENT_SECRET,
        ]

  return client.discovery(new URL(issuer), clientId, secret).catch((error) => {
    configs[provider] = null
    throw error
  })
}

export const getOidcConfig = (provider: Provider): Promise<client.Configuration> => {
  if (!configs[provider]) {
    configs[provider] = buildConfig(provider)
  }
  return configs[provider]
}
