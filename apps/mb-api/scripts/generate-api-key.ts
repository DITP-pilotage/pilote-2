import { parseArgs } from 'node:util'

import { buildApiKey } from '@/framework/auth/apiKey'
import { prisma } from '@/framework/persistence/prisma'

const printUsage = () => {
  process.stderr.write(
    [
      'Usage: tsx scripts/generate-api-key.ts --label=<label> [--expires-at=YYYY-MM-DD]',
      '',
      "  --label       Description courte de l'API key (obligatoire)",
      "  --expires-at  Date d'expiration ISO (optionnel ; sans cette option, la clé n'expire pas)",
      '',
    ].join('\n'),
  )
}

const parseExpiresAt = (raw: string | undefined): Date | null => {
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    process.stderr.write(`Date d'expiration invalide : ${raw}\n`)
    process.exit(2)
  }
  return parsed
}

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: {
      label: { type: 'string' },
      'expires-at': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  })

  if (values.help || !values.label) {
    printUsage()
    process.exit(values.help ? 0 : 1)
  }

  const expiresAt = parseExpiresAt(values['expires-at'])
  const generated = buildApiKey()

  await prisma.apiKey.create({
    data: {
      id: generated.id,
      label: values.label,
      keyHash: generated.keyHash,
      prefix: generated.prefix,
      expiresAt,
    },
  })

  process.stdout.write(
    [
      '',
      'API key générée avec succès.',
      `  id        : ${generated.id}`,
      `  label     : ${values.label}`,
      `  prefix    : ${generated.prefix}`,
      `  expiresAt : ${expiresAt ? expiresAt.toISOString() : 'jamais'}`,
      '',
      "  Clé en clair (à conserver maintenant, elle n'est pas re-affichable) :",
      `  ${generated.rawKey}`,
      '',
    ].join('\n'),
  )
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Échec de la génération : ${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
