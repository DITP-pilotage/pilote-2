import { queryOptions } from '@tanstack/react-query'

import { fetchConsoleMeta, fetchOpenapiSpec, HTTP_METHODS, type HttpMethod } from '@/api/console'

export type OpenapiEndpoint = {
  method: HttpMethod
  path: string
  summary: string
  bodyExample: string
}

// Sous-ensemble de la spec OpenAPI que l'on exploite. On type l'entrée une seule
// fois à la frontière (`spec as OpenapiSpec`) plutôt que de caster à chaque accès.
type OpenapiSchema = {
  $ref?: string
  example?: unknown
  enum?: unknown[]
  type?: string
  properties?: Record<string, OpenapiSchema>
  items?: OpenapiSchema
}
type OpenapiOperation = {
  summary?: string
  requestBody?: { content?: Record<string, { schema?: OpenapiSchema }> }
}
type OpenapiSpec = {
  paths?: Record<string, Record<string, OpenapiOperation>>
  components?: { schemas?: Record<string, OpenapiSchema> }
}

const METHOD_SET = new Set<string>(HTTP_METHODS)
const REF_PREFIX = '#/components/schemas/'

// Génère un exemple JSON minimal depuis un schéma OpenAPI. Les `$ref` (que
// @hono/zod-openapi émet pour les bodies enregistrés en composants) sont résolus
// contre `components.schemas`. La profondeur est bornée (refs cycliques, imbrication).
const exampleFromSchema = (
  schema: OpenapiSchema | undefined,
  schemas: Record<string, OpenapiSchema>,
  depth = 0,
): unknown => {
  if (depth > 6 || !schema) return null
  if (schema.$ref) {
    const name = schema.$ref.startsWith(REF_PREFIX) ? schema.$ref.slice(REF_PREFIX.length) : ''
    return exampleFromSchema(schemas[name], schemas, depth + 1)
  }
  if ('example' in schema) return schema.example
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0]
  switch (schema.type) {
    case 'object': {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(schema.properties ?? {})) {
        result[key] = exampleFromSchema(value, schemas, depth + 1)
      }
      return result
    }
    case 'array':
      return [exampleFromSchema(schema.items, schemas, depth + 1)]
    case 'string':
      return ''
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    default:
      return null
  }
}

const bodyExampleFor = (
  operation: OpenapiOperation,
  schemas: Record<string, OpenapiSchema>,
): string => {
  const schema = operation.requestBody?.content?.['application/json']?.schema
  if (!schema) return ''
  const example = exampleFromSchema(schema, schemas)
  if (example === null || example === undefined) return ''
  return JSON.stringify(example, null, 2)
}

const parseEndpoints = (spec: unknown): OpenapiEndpoint[] => {
  const typed = spec as OpenapiSpec
  const paths = typed.paths
  if (!paths) return []
  const schemas = typed.components?.schemas ?? {}
  const endpoints: OpenapiEndpoint[] = []
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const [rawMethod, operation] of Object.entries(pathItem)) {
      const method = rawMethod.toUpperCase()
      // Le filtre méthode écarte de fait les clés non-opérations (parameters, $ref…).
      if (!METHOD_SET.has(method)) continue
      endpoints.push({
        method: method as HttpMethod,
        path,
        summary: operation.summary ?? '',
        bodyExample: bodyExampleFor(operation, schemas),
      })
    }
  }
  return endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
}

export const consoleMetaQueryOptions = queryOptions({
  queryKey: ['console', 'meta'],
  queryFn: fetchConsoleMeta,
  staleTime: 60 * 60 * 1000,
})

export const openapiEndpointsQueryOptions = queryOptions({
  queryKey: ['console', 'openapi'],
  queryFn: async () => parseEndpoints(await fetchOpenapiSpec()),
  staleTime: 60 * 60 * 1000,
})
