import { Hono } from 'hono'
import * as client from 'openid-client'

import { getOidcConfig } from '@/server/auth/oidc'
import {
  clearPkce,
  clearSession,
  readPkce,
  readSession,
  writePkce,
  writeSession,
} from '@/server/auth/session'
import { serverEnv } from '@/server/env'

const SCOPES = 'openid profile email offline_access'
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

const sessionTtlSeconds = (refreshExpiresIn: unknown): number => {
  const value = Number(refreshExpiresIn)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SESSION_TTL_SECONDS
}

export const authRouter = new Hono()

authRouter.get('/login', async (context) => {
  const config = await getOidcConfig()
  const codeVerifier = client.randomPKCECodeVerifier()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const state = client.randomState()

  await writePkce(context, { codeVerifier, state })

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: serverEnv.OIDC_REDIRECT_URI,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  return context.redirect(authorizationUrl.toString())
})

authRouter.get('/callback', async (context) => {
  const pkce = await readPkce(context)
  if (!pkce) {
    return context.text('Invalid auth state', 400)
  }
  clearPkce(context)

  const config = await getOidcConfig()
  const incomingSearch = new URL(context.req.url).search
  const currentUrl = new URL(`${serverEnv.OIDC_REDIRECT_URI}${incomingSearch}`)

  let tokens: Awaited<ReturnType<typeof client.authorizationCodeGrant>>
  try {
    tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: pkce.codeVerifier,
      expectedState: pkce.state,
    })
  } catch {
    return context.text('Authentication failed', 401)
  }

  const claims = tokens.claims()
  if (!claims?.sub || !tokens.refresh_token) {
    return context.text('Missing tokens', 500)
  }

  await writeSession(
    context,
    { refreshToken: tokens.refresh_token, sub: claims.sub },
    sessionTtlSeconds(tokens.refresh_expires_in),
  )

  return context.redirect(serverEnv.PUBLIC_BASE_URL)
})

authRouter.post('/refresh', async (context) => {
  const session = await readSession(context)
  if (!session) {
    return context.json({ error: 'unauthorized' }, 401)
  }

  const config = await getOidcConfig()
  let tokens: Awaited<ReturnType<typeof client.refreshTokenGrant>>
  try {
    tokens = await client.refreshTokenGrant(config, session.refreshToken)
  } catch {
    clearSession(context)
    return context.json({ error: 'unauthorized' }, 401)
  }

  if (!tokens.access_token) {
    clearSession(context)
    return context.json({ error: 'unauthorized' }, 401)
  }

  if (tokens.refresh_token) {
    await writeSession(
      context,
      { refreshToken: tokens.refresh_token, sub: session.sub },
      sessionTtlSeconds(tokens.refresh_expires_in),
    )
  }

  return context.json({
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in ?? null,
  })
})

authRouter.post('/logout', async (context) => {
  const session = await readSession(context)
  clearSession(context)

  if (!session) {
    return context.json({ logoutUrl: null })
  }

  const config = await getOidcConfig()
  try {
    await client.tokenRevocation(config, session.refreshToken)
  } catch {
    // best effort
  }

  const endSessionUrl = client.buildEndSessionUrl(config, {
    post_logout_redirect_uri: serverEnv.OIDC_POST_LOGOUT_REDIRECT_URI,
  })

  return context.json({ logoutUrl: endSessionUrl.toString() })
})
