import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'

import { serverEnv } from '@/server/env'
import type { Environment } from '@/server/environments'

const SESSION_COOKIE = 'mbadmin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8h

export type AdminSession = {
  environment: Environment
  apiKey: string
  label: string
}

const sealOptions = { password: serverEnv.SESSION_SECRET }

export const writeSession = async (context: Context, payload: AdminSession) => {
  const sealed = await sealData(payload, { ...sealOptions, ttl: SESSION_TTL_SECONDS })
  setCookie(context, SESSION_COOKIE, sealed, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export const readSession = async (context: Context): Promise<AdminSession | null> => {
  const raw = getCookie(context, SESSION_COOKIE)
  if (!raw) return null
  try {
    return await unsealData<AdminSession>(raw, sealOptions)
  } catch {
    return null
  }
}

export const clearSession = (context: Context) => {
  deleteCookie(context, SESSION_COOKIE, { path: '/' })
}
