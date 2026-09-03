import { type RouteConfig } from '@hono/zod-openapi'
import { type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { type Fetcher } from '@/assistant/tools/fetcher'

export type WhitelistEntry = { name: ToolName; route: RouteConfig }

const PATH_PARAM = /\{([^}]+)\}/g

/**
 * Un paramètre d'URL ne peut être qu'un scalaire. Tout le reste renvoie `null` et est
 * ignoré : `String({})` produirait `[object Object]` dans l'URL, ce qu'aucune route
 * n'attend et que personne ne diagnostiquerait facilement.
 */
const toScalar = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

/**
 * Reconstitue l'URL documentée par la route : les paramètres qui apparaissent entre
 * accolades dans le chemin y sont substitués, les autres partent en query string.
 */
export const buildUrl = (path: string, params: Record<string, unknown>): string => {
  const consumed = new Set<string>()
  const pathWithParams = path.replace(PATH_PARAM, (_match, name: string) => {
    consumed.add(name)
    return encodeURIComponent(toScalar(params[name]) ?? '')
  })

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (consumed.has(key) || value === undefined || value === null) continue
    for (const item of Array.isArray(value) ? value : [value]) {
      const scalar = toScalar(item)
      if (scalar !== null) query.append(key, scalar)
    }
  }

  const suffix = query.toString()
  return suffix ? `${pathWithParams}?${suffix}` : pathWithParams
}

const mergeSchemas = (route: RouteConfig): z.ZodObject<z.ZodRawShape> => {
  const params = route.request?.params as z.ZodObject<z.ZodRawShape> | undefined
  const query = route.request?.query as z.ZodObject<z.ZodRawShape> | undefined
  return z.object({ ...(params?.shape ?? {}), ...(query?.shape ?? {}) })
}

/**
 * Transforme une route de lecture en outil. La description et le schéma sont ceux de la
 * route : quand elle évolue, l'outil suit sans intervention.
 */
export const deriveTool = ({ route }: WhitelistEntry, fetcher: Fetcher): Tool =>
  tool({
    description: route.description ?? route.summary ?? '',
    inputSchema: mergeSchemas(route),
    execute: async (params: Record<string, unknown>) => {
      const response = await fetcher(buildUrl(route.path, params))
      if (!response.ok) {
        // Une erreur lisible plutôt qu'un throw : le modèle peut corriger son appel ou
        // dire à l'utilisateur qu'il n'a pas accès, au lieu de perdre tout le tour.
        return { error: `L'appel a échoué avec le statut ${response.status}.` }
      }
      return response.json()
    },
  })
