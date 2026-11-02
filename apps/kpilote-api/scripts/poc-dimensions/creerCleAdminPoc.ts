/* eslint-disable no-console -- script CLI */
// Crée une clé API ADMIN de test sur la base du POC dimensions (5444) pour se
// connecter à kpilote-admin en local. La clé brute est écrite dans le fichier
// passé en argument (mode 600, hors git), jamais sur la sortie standard.
//
//   tsx scripts/poc-dimensions/creerCleAdminPoc.ts <fichier>
import { writeFileSync } from 'node:fs'

import { env } from '@/env'
import { buildApiKey } from '@/framework/auth/apiKey'
import { prisma } from '@/framework/persistence/prisma'

const main = async () => {
  const [fichier] = process.argv.slice(2)
  if (!fichier) {
    console.error('usage: creerCleAdminPoc.ts <fichier>')
    process.exit(2)
  }
  if (!env.DATABASE_URL.includes(':5444/')) {
    console.error('Refus : ce script ne cible que la base du POC (port 5444).')
    process.exit(2)
  }
  const generated = buildApiKey(env.API_KEY_HMAC_SECRET)
  await prisma.$transaction(async (tx) => {
    await tx.principal.create({ data: { id: generated.id } })
    await tx.apiKey.create({
      data: {
        id: generated.id,
        label: 'POC dimensions — admin local',
        keyHash: generated.keyHash,
        prefix: generated.prefix,
        role: 'ADMIN',
      },
    })
  })
  writeFileSync(fichier, `${generated.rawKey}\n`, { mode: 0o600 })
  console.log(`Clé ADMIN créée (id ${generated.id}), écrite dans ${fichier}.`)
}

await main()
await prisma.$disconnect()
