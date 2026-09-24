import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'
import { z } from 'zod'

import { providerSchema, type Provider } from '@/server/auth/oidc'
import { serverEnv } from '@/server/env'
import { logger } from '@/server/logger'

const SESSION_COOKIE = 'mb_session'
const PKCE_COOKIE = 'mb_pkce'
const LAST_PROVIDER_COOKIE = 'mb_last_provider'
const COOKIE_PATH = '/auth'
const LAST_PROVIDER_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

const sessionSchema = z.object({
  refreshToken: z.string(),
  sub: z.string(),
  idToken: z.string(),
  provider: providerSchema,
})
export type SessionPayload = z.infer<typeof sessionSchema>

const pkceSchema = z.object({
  codeVerifier: z.string(),
  state: z.string(),
  nonce: z.string(),
  provider: providerSchema,
  redirect: z.string().optional(),
})
export type PkcePayload = z.infer<typeof pkceSchema>

const sealOptions = { password: serverEnv.SESSION_SECRET }

// iron-session 9 ne lève plus d'erreur sur un cookie illisible : il renvoie `{}`.
// Le schéma est donc le seul rempart contre une session vide ou partielle.
const readSealedCookie = async <T>(
  context: Context,
  name: string,
  schema: z.ZodType<T>,
): Promise<T | null> => {
  const raw = getCookie(context, name)
  if (!raw) return null
  const data = await unsealData(raw, {
    ...sealOptions,
    onUnsealError: (reason) => {
      if (reason === 'expired') return
      logger.warn(
        { event: 'auth.cookie.rejected', cookie: name, reason },
        'Rejected unreadable auth cookie',
      )
    },
  })
  const parsed = schema.safeParse(data)
  return parsed.success ? parsed.data : null
}

export const writeSession = async (
  context: Context,
  payload: SessionPayload,
  maxAgeSeconds: number,
) => {
  const sealed = await sealData(payload, { ...sealOptions, ttl: maxAgeSeconds })
  setCookie(context, SESSION_COOKIE, sealed, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: COOKIE_PATH,
    maxAge: maxAgeSeconds,
  })
}

export const readSession = (context: Context): Promise<SessionPayload | null> =>
  readSealedCookie(context, SESSION_COOKIE, sessionSchema)

export const clearSession = (context: Context) => {
  deleteCookie(context, SESSION_COOKIE, { path: COOKIE_PATH })
}

export const writePkce = async (context: Context, payload: PkcePayload) => {
  const sealed = await sealData(payload, { ...sealOptions, ttl: 600 })
  setCookie(context, PKCE_COOKIE, sealed, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: COOKIE_PATH,
    maxAge: 600,
  })
}

export const readPkce = (context: Context): Promise<PkcePayload | null> =>
  readSealedCookie(context, PKCE_COOKIE, pkceSchema)

export const clearPkce = (context: Context) => {
  deleteCookie(context, PKCE_COOKIE, { path: COOKIE_PATH })
}

export const writeLastProvider = (context: Context, provider: Provider) => {
  setCookie(context, LAST_PROVIDER_COOKIE, provider, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: COOKIE_PATH,
    maxAge: LAST_PROVIDER_MAX_AGE_SECONDS,
  })
}

export const readLastProvider = (context: Context): Provider | null => {
  const raw = getCookie(context, LAST_PROVIDER_COOKIE)
  if (!raw) return null
  const parsed = providerSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}
