import { readFileSync } from 'node:fs'

import { parse } from 'dotenv'

// `env.ts` charge `.env.test`, dont la clé Albert est factice. La vraie clé vient
// de `.env` ou de l'environnement (CI) : posée ici, avant le chargement de `env.ts`,
// elle n'est pas écrasée.
const readLocalKey = (): string | undefined => {
  try {
    return parse(readFileSync('.env'))['ALBERT_API_KEY']
  } catch {
    return undefined
  }
}

const key = process.env['ALBERT_API_KEY'] ?? readLocalKey()
if (key) process.env['ALBERT_API_KEY'] = key
