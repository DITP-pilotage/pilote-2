import { type RouteConfig } from '@hono/zod-openapi'
import { type ToolError, type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import { type ErrorApiModel } from '@pilote/kpilote-shared/error'
import { jsonSchema, tool, type Schema, type Tool } from 'ai'
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
 *
 * Un tableau part en CSV, jamais en clé répétée. L'outil reçoit l'entrée APRÈS le schéma
 * de la route, dont les transformations ont déjà éclaté les listes CSV (`individus`,
 * `ids`) en tableaux ; une clé répétée arriverait à la route sous forme de tableau, que
 * son `z.string()` refuse. Le CSV est la forme que toutes ces routes acceptent.
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
    const scalars = (Array.isArray(value) ? value : [value])
      .map(toScalar)
      .filter((item): item is string => item !== null)
    if (scalars.length > 0) query.append(key, scalars.join(','))
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

type ToolInput = Record<string, unknown>

/**
 * Le schéma de la route valide l'entrée, mais l'outil exécute l'entrée BRUTE.
 *
 * Un schéma zod donné tel quel au SDK lui fait passer la valeur transformée : `individus`
 * arrive à `execute` en tableau alors que le modèle a envoyé un CSV. Ce tableau est ensuite
 * rejoué dans l'historique comme l'entrée de l'appel, et le modèle l'imite au tour suivant —
 * un tableau que le schéma refuse. Le JSON Schema exposé est celui de l'entrée, la valeur
 * validée est celle que le modèle a écrite : ce qu'il voit dans l'historique est ce qu'il
 * doit produire.
 */
const inputSchemaFor = (route: RouteConfig): Schema<ToolInput> => {
  const params = route.request?.params as z.ZodObject<z.ZodRawShape> | undefined
  const query = route.request?.query as z.ZodObject<z.ZodRawShape> | undefined
  const routeSchema = z.object({ ...(params?.shape ?? {}), ...(query?.shape ?? {}) })

  return jsonSchema<ToolInput>(
    {
      ...z.toJSONSchema(routeSchema, { target: 'draft-7', io: 'input' }),
      additionalProperties: false,
    } as Parameters<typeof jsonSchema>[0],
    {
      validate: (value) => {
        const raw = dropEmptyValues(value) as ToolInput
        const result = routeSchema.safeParse(raw)
        return result.success
          ? { success: true, value: raw }
          : { success: false, error: result.error }
      },
    },
  )
}

const REPEATED_FAILURE: ToolError = {
  error:
    "Cet appel a déjà échoué dans ce tour avec exactement ces paramètres. Ne le répète pas : corrige les paramètres d'après l'erreur précédente, ou explique à l'utilisateur ce qui bloque.",
}

/**
 * Une erreur lisible plutôt qu'un throw, et le message de l'API avec : c'est lui qui dit au
 * modèle QUOI corriger. Sans lui, un 400 se lit comme un refus et le modèle réessaie à
 * l'identique.
 */
const describeFailure = async (response: Response): Promise<ToolError> => {
  // Lecture structurelle plutôt que `errorApiModelSchema` : importer un schéma partagé ici
  // l'évaluerait avant l'extension `.openapi()` de zod, ce qui casse les routes (voir registry.ts).
  const body = (await response.json().catch(() => null)) as Partial<ErrorApiModel> | null
  if (typeof body?.message !== 'string') {
    return { error: `L'appel a échoué avec le statut ${response.status}.` }
  }
  const details = body.details === undefined ? '' : ` ${JSON.stringify(body.details)}`
  return { error: `L'appel a échoué avec le statut ${response.status} : ${body.message}${details}` }
}

/**
 * Transforme une route de lecture en outil. La description et le schéma sont ceux de la
 * route : quand elle évolue, l'outil suit sans intervention.
 *
 * L'outil est construit par tour : la mémoire des appels échoués ne vit pas plus longtemps.
 */
export const deriveTool = ({ route }: WhitelistEntry, fetcher: Fetcher): Tool => {
  const failed = new Set<string>()

  return tool({
    description: route.description ?? route.summary ?? '',
    inputSchema: inputSchemaFor(route),
    execute: async (params: ToolInput) => {
      const url = buildUrl(route.path, params)
      if (failed.has(url)) return REPEATED_FAILURE

      const response = await fetcher(url)
      if (!response.ok) {
        failed.add(url)
        return describeFailure(response)
      }
      return response.json()
    },
  })
}
