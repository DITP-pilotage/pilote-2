import type { HeaderPair, HttpMethod } from '@/api/console'

// Échappement shell d'une valeur entre quotes simples : ' → '\''
const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`

const BODYLESS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['GET'])

// Construit une commande curl multi-lignes. Le token n'est jamais inclus : on
// émet un placeholder `$API_KEY` que l'utilisateur remplacera.
export const toCurl = ({
  method,
  url,
  headers,
  body,
}: {
  method: HttpMethod
  url: string
  headers: HeaderPair[]
  body: string
}): string => {
  const lines = [`curl -X ${method} ${shellQuote(url)}`]
  lines.push(`  -H ${shellQuote('Authorization: Bearer $API_KEY')}`)
  for (const { key, value } of headers) {
    if (!key.trim()) continue
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`)
  }
  const trimmedBody = body.trim()
  if (!BODYLESS.has(method) && trimmedBody) {
    lines.push(`  --data ${shellQuote(trimmedBody)}`)
  }
  return lines.join(' \\\n')
}
