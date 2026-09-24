import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { sealData, unsealData } from 'iron-session'
import { z } from 'zod'

import { serverEnv } from '@/server/env'
import { ENVIRONMENTS, type Environment } from '@/server/environments'

const SESSION_COOKIE = 'mbadmin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8h
const VAULT_COOKIE = 'mbadmin_vault'
const VAULT_TTL_SECONDS = 60 * 60 * 24 * 7 // 7j

const sessionSchema = z.object({
  environment: z.enum(ENVIRONMENTS),
  apiKey: z.string(),
  label: z.string(),
})
export type AdminSession = z.infer<typeof sessionSchema>

const vaultEntrySchema = z.object({ apiKey: z.string(), label: z.string() })
export type VaultEntry = z.infer<typeof vaultEntrySchema>

const vaultSchema = z.partialRecord(z.enum(ENVIRONMENTS), vaultEntrySchema)
export type Vault = z.infer<typeof vaultSchema>

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
      if (reason !== 'expired') console.warn(`Cookie ${name} illisible, rejeté :`, reason)
    },
  })
  const parsed = schema.safeParse(data)
  return parsed.success ? parsed.data : null
}

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

export const readSession = (context: Context): Promise<AdminSession | null> =>
  readSealedCookie(context, SESSION_COOKIE, sessionSchema)

export const clearSession = (context: Context) => {
  deleteCookie(context, SESSION_COOKIE, { path: '/' })
}

// Garde de session : renvoie la session ou court-circuite le handler avec une 401
// générique. Évite de répéter le `if (!session) return 401` dans chaque route.
export const requireSession = async (context: Context): Promise<AdminSession> => {
  const session = await readSession(context)
  if (!session) throw new HTTPException(401, { message: 'unauthorized' })
  return session
}

// Coffre des clés validées, par environnement. Cookie chiffré httpOnly : la clé
// brute n'est jamais renvoyée au navigateur (seuls label + préfixe le sont, via
// l'endpoint /auth/remembered). Survit au logout (sert à proposer « Continuer
// avec la clé … »).
export const readVault = async (context: Context): Promise<Vault> =>
  (await readSealedCookie(context, VAULT_COOKIE, vaultSchema)) ?? {}

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
