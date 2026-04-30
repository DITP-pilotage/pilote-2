import * as client from 'openid-client'

import { serverEnv } from '@/server/env'

let configPromise: Promise<client.Configuration> | null = null

export const getOidcConfig = (): Promise<client.Configuration> => {
  if (!configPromise) {
    configPromise = client
      .discovery(
        new URL(serverEnv.OIDC_ISSUER_URL),
        serverEnv.OIDC_CLIENT_ID,
        serverEnv.OIDC_CLIENT_SECRET,
      )
      .catch((error) => {
        // Permet une nouvelle tentative au prochain appel si l'IdP était down.
        configPromise = null
        throw error
      })
  }

  return configPromise
}
