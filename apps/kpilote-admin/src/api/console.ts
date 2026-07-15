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
  statusText: string
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

// La requête à exécuter est décrite dans une enveloppe JSON POSTée au BFF, qui
// forge l'appel upstream côté serveur (le token n'est jamais exposé au client, et
// on peut poser des en-têtes que le `fetch` du navigateur interdirait). La réponse
// est elle aussi une enveloppe : status/statusText/headers/body + timing serveur.
export const sendConsoleRequest = async (request: ConsoleRequest): Promise<ConsoleResponse> => {
  const bffResponse = await consoleClient.post('proxy', {
    json: {
      method: request.method,
      path: request.path,
      headers: request.headers.filter((header) => header.key.trim()),
      body: request.body,
    },
  })
  if (!bffResponse.ok) {
    const detail = await bffResponse.text()
    throw new Error(`Erreur proxy console (${bffResponse.status}) : ${detail}`)
  }
  return bffResponse.json<ConsoleResponse>()
}

export const fetchConsoleMeta = async (): Promise<{ environment: string; baseUrl: string }> => {
  return consoleClient.get('meta').json()
}

export const fetchOpenapiSpec = async (): Promise<unknown> => {
  return consoleClient.get('openapi.json').json()
}
