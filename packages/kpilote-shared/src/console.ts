import { z } from 'zod'

// Contrat de la Console API admin, partagé front/back pour un appel type-safe.
// L'enveloppe décrit la requête à forger côté serveur : la méthode et le path
// voyagent comme des données (pas dans l'URL du BFF), ce qui permet de poser des
// en-têtes que le `fetch` du navigateur interdirait (Host, Referer…). Le token
// n'est jamais exposé au client : il est injecté serveur.

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
export const httpMethodSchema = z.enum(HTTP_METHODS)
export type HttpMethod = z.infer<typeof httpMethodSchema>

export const consoleHeaderPairSchema = z.object({
  key: z.string(),
  value: z.string(),
})
export type HeaderPair = z.infer<typeof consoleHeaderPairSchema>

// `path` = chemin pur (sans querystring) ; `query` = querystring brute (sans `?`).
// Les deux sont séparés à la source pour éviter tout re-parsing bricolé côté
// serveur : le path est sanitizé tel quel, la query est posée via `url.search`.
export const consoleRequestSchema = z.object({
  method: httpMethodSchema,
  path: z.string(),
  query: z.string().default(''),
  headers: z.array(consoleHeaderPairSchema).default([]),
  body: z.string().default(''),
})
export type ConsoleRequest = z.infer<typeof consoleRequestSchema>

export const consoleResponseSchema = z.object({
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string(), z.string()),
  durationMs: z.number(),
  body: z.string(),
})
export type ConsoleResponse = z.infer<typeof consoleResponseSchema>

export const consoleMetaSchema = z.object({
  environment: z.string(),
  baseUrl: z.string(),
})
export type ConsoleMeta = z.infer<typeof consoleMetaSchema>
