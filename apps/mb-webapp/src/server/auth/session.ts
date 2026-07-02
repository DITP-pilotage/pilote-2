import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'

import { providerSchema, type Provider } from '@/server/auth/oidc'
import { serverEnv } from '@/server/env'

const SESSION_COOKIE = 'mb_session'
const PKCE_COOKIE = 'mb_pkce'
const LAST_PROVIDER_COOKIE = 'mb_last_provider'
const COOKIE_PATH = '/auth'
const LAST_PROVIDER_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

export type SessionPayload = {
  refreshToken: string
  sub: string
  idToken: string
  provider: Provider
}

export type PkcePayload = {
  codeVerifier: string
  state: string
  nonce: string
  provider: Provider
  redirect?: string
}

const sealOptions = { password: serverEnv.SESSION_SECRET }

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

export const readSession = async (context: Context): Promise<SessionPayload | null> => {
  const raw = getCookie(context, SESSION_COOKIE)
  if (!raw) return null
  try {
    return await unsealData<SessionPayload>(raw, sealOptions)
  } catch {
    return null
  }
}

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

export const readPkce = async (context: Context): Promise<PkcePayload | null> => {
  const raw = getCookie(context, PKCE_COOKIE)
  if (!raw) return null
  try {
    return await unsealData<PkcePayload>(raw, sealOptions)
  } catch {
    return null
  }
}

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
