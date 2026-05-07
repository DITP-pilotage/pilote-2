import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'

import { serverEnv } from '@/server/env'

const SESSION_COOKIE = 'mb_session'
const PKCE_COOKIE = 'mb_pkce'
const COOKIE_PATH = '/auth'

export type SessionPayload = {
  refreshToken: string
  sub: string
  idToken: string
}

export type PkcePayload = {
  codeVerifier: string
  state: string
  nonce: string
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
