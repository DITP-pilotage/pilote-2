import { parseArgs } from 'node:util'

import { buildApiKey } from '@/framework/auth/apiKey'

const printUsage = () => {
  process.stderr.write(
    [
      'Usage: tsx scripts/generate-api-key.ts --secret=<hmac-secret> [--label=<label>] [--expires-at=YYYY-MM-DD]',
      '',
      '  --secret      Secret HMAC à utiliser pour calculer le hash (obligatoire ; sinon lu depuis API_KEY_HMAC_SECRET).',
      "  --label       Étiquette à utiliser dans la commande SQL d'insertion (optionnel ; défaut: 'à renseigner').",
      "  --expires-at  Date d'expiration ISO (optionnel ; sans cette option, la clé n'expire pas).",
      '',
      'Le script ne touche pas la base : il imprime la clé en clair (à transmettre au client) et',
      "le SQL d'insertion (à exécuter manuellement) sur stdout.",
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

const sqlString = (value: string): string => `'${value.replace(/'/g, "''")}'`

const main = (): void => {
  const { values } = parseArgs({
    options: {
      secret: { type: 'string' },
      label: { type: 'string' },
      'expires-at': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
    allowPositionals: true,
  })

  if (values.help) {
    printUsage()
    process.exit(0)
  }

  const secret = values.secret ?? process.env['API_KEY_HMAC_SECRET']
  if (!secret || secret.length < 32) {
    process.stderr.write(
      'Secret HMAC manquant ou trop court (32 chars min). Passez --secret=… ou définissez API_KEY_HMAC_SECRET.\n',
    )
    process.exit(2)
  }

  const label = values.label ?? 'à renseigner'
  const expiresAt = parseExpiresAt(values['expires-at'])
  const generated = buildApiKey(secret)

  const sqlInsert = [
    'BEGIN;',
    `INSERT INTO principal (id) VALUES (${sqlString(generated.id)});`,
    `INSERT INTO api_key (id, label, key_hash, prefix, expires_at) VALUES (` +
      `${sqlString(generated.id)}, ${sqlString(label)}, ${sqlString(generated.keyHash)}, ${sqlString(generated.prefix)}, ` +
      `${expiresAt ? sqlString(expiresAt.toISOString()) : 'NULL'});`,
    `-- Grants READ + WRITE sur les 10 premiers indicateurs (ordre publicId ASC)`,
    `INSERT INTO indicateur_permission (principal_id, indicateur_id, action)`,
    `SELECT ${sqlString(generated.id)}, i.id, a.action`,
    `FROM (SELECT id FROM indicateur ORDER BY public_id ASC LIMIT 10) AS i`,
    `CROSS JOIN (VALUES ('READ'::permission_action_enum), ('WRITE'::permission_action_enum)) AS a(action);`,
    'COMMIT;',
  ].join('\n  ')

  process.stdout.write(
    [
      '',
      '== API key générée ==',
      `id        : ${generated.id}`,
      `label     : ${label}`,
      `prefix    : ${generated.prefix}`,
      `expiresAt : ${expiresAt ? expiresAt.toISOString() : 'jamais'}`,
      '',
      "Clé en clair (à conserver maintenant, elle n'est pas re-affichable) :",
      `  ${generated.rawKey}`,
      '',
      "SQL d'insertion :",
      `  ${sqlInsert}`,
      '',
    ].join('\n'),
  )
}

main()
