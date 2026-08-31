import { type Hono } from 'hono'

/**
 * Une fonction qui joue un appel documenté et rend sa réponse.
 *
 * Elle est INJECTÉE aux outils, jamais importée par eux. Deux raisons :
 *
 * 1. `@/app` monte les routes de l'assistant, donc un outil qui importerait `app`
 *    créerait un cycle.
 * 2. En test, `buildTestApp` exclut délibérément `databaseContext` — son commentaire dit
 *    qu'il « écraserait le contexte db transactionnel d'integrationTest et rendrait les
 *    fixtures invisibles ». Un outil rappelant le vrai `app` réintroduirait ce middleware
 *    et ne verrait pas les fixtures de son propre test.
 */
export type Requeteur = (url: string) => Promise<Response>

/**
 * En production, l'app complète : pas de socket, mais toute la chaîne de middlewares
 * s'exécute — `databaseContext`, `authContext`, `requireAuthentication`, puis les filtres
 * de permission des queries. L'outil ne peut donc pas voir plus que l'appelant dont il
 * porte le jeton.
 */
export const creerRequeteur =
  (app: Pick<Hono, 'request'>, jeton: string): Requeteur =>
  // `app.request` peut rendre une `Response` synchrone : l'`async` la normalise en promesse.
  async (url) =>
    app.request(url, { headers: { authorization: `Bearer ${jeton}` } })
