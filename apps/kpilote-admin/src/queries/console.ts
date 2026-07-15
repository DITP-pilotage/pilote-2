import { queryOptions } from '@tanstack/react-query'

import { fetchConsoleMeta, fetchOpenapiSpec, HTTP_METHODS, type HttpMethod } from '@/api/console'

export type OpenapiEndpoint = {
  method: HttpMethod
  path: string
  summary: string
  bodyExample: string
}

const METHOD_SET = new Set<string>(HTTP_METHODS)

// Génère un exemple JSON minimal depuis un schéma OpenAPI (profondeur limitée).
const exampleFromSchema = (schema: unknown, depth = 0): unknown => {
  if (depth > 4 || typeof schema !== 'object' || schema === null) return null
  const node = schema as Record<string, unknown>
  if ('example' in node) return node.example
  if (Array.isArray(node.enum) && node.enum.length > 0) return node.enum[0]
  switch (node.type) {
    case 'object': {
      const properties = (node.properties as Record<string, unknown>) ?? {}
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(properties)) {
        result[key] = exampleFromSchema(value, depth + 1)
      }
      return result
    }
    case 'array':
      return [exampleFromSchema(node.items, depth + 1)]
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

const bodyExampleFor = (operation: Record<string, unknown>): string => {
  const requestBody = operation.requestBody as Record<string, unknown> | undefined
  const content = requestBody?.content as Record<string, unknown> | undefined
  const jsonContent = content?.['application/json'] as Record<string, unknown> | undefined
  if (!jsonContent?.schema) return ''
  const example = exampleFromSchema(jsonContent.schema)
  if (example === null || example === undefined) return ''
  return JSON.stringify(example, null, 2)
}

const parseEndpoints = (spec: unknown): OpenapiEndpoint[] => {
  const paths = (spec as { paths?: Record<string, unknown> })?.paths
  if (!paths) return []
  const endpoints: OpenapiEndpoint[] = []
  for (const [path, pathItem] of Object.entries(paths)) {
    if (typeof pathItem !== 'object' || pathItem === null) continue
    for (const [rawMethod, operation] of Object.entries(pathItem as Record<string, unknown>)) {
      const method = rawMethod.toUpperCase()
      if (!METHOD_SET.has(method) || typeof operation !== 'object' || operation === null) continue
      const op = operation as Record<string, unknown>
      endpoints.push({
        method: method as HttpMethod,
        path,
        summary: typeof op.summary === 'string' ? op.summary : '',
        bodyExample: bodyExampleFor(op),
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
