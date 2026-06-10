import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'

import { serverEnv } from '@/server/env'
import type { Environment } from '@/server/environments'

const SESSION_COOKIE = 'mbadmin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8h
const VAULT_COOKIE = 'mbadmin_vault'
const VAULT_TTL_SECONDS = 60 * 60 * 24 * 7 // 7j

export type AdminSession = {
  environment: Environment
  apiKey: string
  label: string
}

export type VaultEntry = { apiKey: string; label: string }
export type Vault = Partial<Record<Environment, VaultEntry>>

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

// Coffre des clés validées, par environnement. Cookie chiffré httpOnly : la clé
// brute n'est jamais renvoyée au navigateur (seuls label + préfixe le sont, via
// l'endpoint /auth/remembered). Survit au logout (sert à proposer « Continuer
// avec la clé … »).
export const readVault = async (context: Context): Promise<Vault> => {
  const raw = getCookie(context, VAULT_COOKIE)
  if (!raw) return {}
  try {
    return await unsealData<Vault>(raw, sealOptions)
  } catch {
    return {}
  }
}

const writeVault = async (context: Context, vault: Vault) => {
  const sealed = await sealData(vault, { ...sealOptions, ttl: VAULT_TTL_SECONDS })
  setCookie(context, VAULT_COOKIE, sealed, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: VAULT_TTL_SECONDS,
  })
}

export const rememberKey = async (
  context: Context,
  environment: Environment,
  entry: VaultEntry,
) => {
  const vault = await readVault(context)
  await writeVault(context, { ...vault, [environment]: entry })
}

export const forgetKey = async (context: Context, environment: Environment) => {
  const vault = await readVault(context)
  if (!(environment in vault)) return
  const next = { ...vault }
  delete next[environment]
  await writeVault(context, next)
}
