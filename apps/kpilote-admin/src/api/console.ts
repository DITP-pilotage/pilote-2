import {
  consoleMetaSchema,
  consoleResponseSchema,
  HTTP_METHODS,
  type ConsoleMeta,
  type ConsoleRequest,
  type ConsoleResponse,
  type HeaderPair,
  type HttpMethod,
} from '@pilote/kpilote-shared/console'
import ky from 'ky'

// Le contrat (schémas + types) vit dans le package partagé : front et back
// parlent la même enveloppe. On ré-exporte ici ce dont l'UI a besoin pour éviter
// de propager l'import `@pilote/kpilote-shared/console` dans tous les composants.
export { HTTP_METHODS }
export type { ConsoleMeta, ConsoleRequest, ConsoleResponse, HeaderPair, HttpMethod }

// L'UI manipule une URL relative unique (`/indicateurs?limit=10`) ; l'enveloppe,
// elle, sépare chemin et querystring. Ces deux helpers font le pont.
export const splitUrl = (url: string): { path: string; query: string } => {
  const index = url.indexOf('?')
  if (index === -1) return { path: url, query: '' }
  return { path: url.slice(0, index), query: url.slice(index + 1) }
}

export const joinUrl = ({ path, query }: { path: string; query: string }): string =>
  query ? `${path}?${query}` : path

const consoleClient = ky.create({
  prefix: new URL('/console/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
  throwHttpErrors: false,
})

// La requête à exécuter est décrite dans une enveloppe JSON POSTée au BFF, qui
// forge l'appel upstream côté serveur (le token n'est jamais exposé au client, et
// on peut poser des en-têtes que le `fetch` du navigateur interdirait). La réponse
// est elle aussi une enveloppe : status/statusText/headers/body + timing serveur.
export const sendConsoleRequest = async (request: ConsoleRequest): Promise<ConsoleResponse> => {
  const payload: ConsoleRequest = {
    ...request,
    headers: request.headers.filter((header) => header.key.trim()),
  }
  // `throwHttpErrors: false` : ky ne lève pas sur les status HTTP, on inspecte
  // `.ok` nous-mêmes (pas de try/catch nécessaire ici).
  const bffResponse = await consoleClient.post('proxy', { json: payload })
  if (!bffResponse.ok) {
    const detail = await bffResponse.text()
    throw new Error(`Erreur proxy console (${bffResponse.status}) : ${detail}`)
  }
  return consoleResponseSchema.parse(await bffResponse.json())
}

export const fetchConsoleMeta = async (): Promise<ConsoleMeta> =>
  consoleMetaSchema.parse(await consoleClient.get('meta').json())

export const fetchOpenapiSpec = async (): Promise<unknown> =>
  consoleClient.get('openapi.json').json()
