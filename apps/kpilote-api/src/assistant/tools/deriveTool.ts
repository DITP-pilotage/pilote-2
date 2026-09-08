import { type RouteConfig } from '@hono/zod-openapi'
import { type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { type Fetcher } from '@/assistant/tools/fetcher'

export type WhitelistEntry = { name: ToolName; route: RouteConfig }

const PATH_PARAM = /\{([^}]+)\}/g

const SCALAR_TYPES = new Set(['string', 'number', 'boolean'])

/**
 * Un paramètre d'URL ne peut être qu'un scalaire. Tout le reste renvoie `null` et est
 * ignoré : `String({})` produirait `[object Object]` dans l'URL, ce qu'aucune route
 * n'attend et que personne ne diagnostiquerait facilement.
 */
const toScalar = (value: unknown): string | null =>
  SCALAR_TYPES.has(typeof value) ? String(value) : null

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

/**
 * Un paramètre vide vaut absent. Le modèle remplit volontiers tous les champs optionnels
 * avec `""` ou `null` — d'autant que la description de `cursor` dit « vide pour la première
 * page » — et un `cursor: ""` est rejeté par le schéma de la route. Dans une query string,
 * les deux formes signifient la même chose : on aligne la validation sur l'URL produite.
 */
export const dropEmptyValues = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, content]) => content !== '' && content !== null,
    ),
  )
}

const mergeSchemas = (route: RouteConfig): z.ZodType<Record<string, unknown>> => {
  const params = route.request?.params as z.ZodObject<z.ZodRawShape> | undefined
  const query = route.request?.query as z.ZodObject<z.ZodRawShape> | undefined
  return z.preprocess(
    dropEmptyValues,
    z.object({ ...(params?.shape ?? {}), ...(query?.shape ?? {}) }),
  )
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
