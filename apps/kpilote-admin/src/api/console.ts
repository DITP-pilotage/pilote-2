import ky from 'ky'

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
export type HttpMethod = (typeof HTTP_METHODS)[number]

export type HeaderPair = { key: string; value: string }

export type ConsoleRequest = {
  method: HttpMethod
  path: string
  headers: HeaderPair[]
  body: string
}

export type ConsoleResponse = {
  status: number
  headers: Record<string, string>
  body: string
  durationMs: number
}

const consoleClient = ky.create({
  prefixUrl: new URL('/console/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
  throwHttpErrors: false,
})

// Normalise le path saisi (retire les `/` de tête) pour le préfixer à `proxy/`.
const normalizePath = (path: string): string => path.replace(/^\/+/, '')

const isBodyless = (method: HttpMethod): boolean => method === 'GET'

export const sendConsoleRequest = async (request: ConsoleRequest): Promise<ConsoleResponse> => {
  const headers = new Headers()
  for (const { key, value } of request.headers) {
    if (key.trim()) headers.set(key, value)
  }
  const bodyProvided = !isBodyless(request.method) && request.body.trim().length > 0
  if (bodyProvided && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const start = performance.now()
  const response = await consoleClient(`proxy/${normalizePath(request.path)}`, {
    method: request.method,
    headers,
    ...(bodyProvided ? { body: request.body } : {}),
  })
  const text = await response.text()
  const durationMs = Math.round(performance.now() - start)

  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  return { status: response.status, headers: responseHeaders, body: text, durationMs }
}

export const fetchConsoleMeta = async (): Promise<{ environment: string; baseUrl: string }> => {
  return consoleClient.get('meta').json()
}

export const fetchOpenapiSpec = async (): Promise<unknown> => {
  return consoleClient.get('openapi.json').json()
}
