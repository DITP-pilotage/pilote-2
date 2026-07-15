import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import { featureFlippingKeySchema } from '@pilote/kpilote-shared/featureFlipping'

const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations')
const ETATS = ['DESACTIVE', 'ACTIVE', 'ACTIVE_POUR_UTILISATEUR'] as const
type Etat = (typeof ETATS)[number]

const printUsage = () => {
  process.stderr.write(
    [
      'Usage: tsx scripts/creer-feature-flipping.ts --key=<key> --nom="<nom>" [--etat=<etat>]',
      '',
      '  --key   Clé technique du feature flipping (a-z, 0-9, `_`, `-`). Obligatoire.',
      '  --nom   Libellé lisible. Obligatoire.',
      `  --etat  État initial (${ETATS.join(' | ')}). Défaut : DESACTIVE.`,
      '',
      'Scaffolde une migration Prisma (--create-only) insérant la ligne feature_flipping,',
      "puis injecte l'INSERT dans le migration.sql généré. Relis puis committe le fichier.",
      '',
    ].join('\n'),
  )
}

const echapperSql = (valeur: string): string => valeur.replace(/'/g, "''")

const main = (): void => {
  const { values } = parseArgs({
    options: {
      key: { type: 'string' },
      nom: { type: 'string' },
      etat: { type: 'string', default: 'DESACTIVE' },
    },
  })

  const keyResult = featureFlippingKeySchema.safeParse(values.key)
  if (!keyResult.success) {
    process.stderr.write(
      `--key invalide : ${keyResult.error.issues[0]?.message ?? 'clé requise'}\n\n`,
    )
    printUsage()
    process.exit(2)
  }
  const key = keyResult.data

  const nom = values.nom?.trim()
  if (!nom) {
    process.stderr.write('--nom est requis.\n\n')
    printUsage()
    process.exit(2)
  }

  const etat = values.etat ?? 'DESACTIVE'
  if (!ETATS.includes(etat as Etat)) {
    process.stderr.write(`--etat doit être l'un de : ${ETATS.join(', ')}\n`)
    process.exit(2)
  }

  // Refuse une key déjà insérée par une migration existante.
  const dejaPresent = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .some((entry) => {
      const sqlPath = join(MIGRATIONS_DIR, entry.name, 'migration.sql')
      try {
        return readFileSync(sqlPath, 'utf8').includes(`'${echapperSql(key)}'`)
      } catch {
        return false
      }
    })
  if (dejaPresent) {
    process.stderr.write(`La clé "${key}" est déjà référencée par une migration.\n`)
    process.exit(1)
  }

  // Scaffolde une migration vide via Prisma (nécessite une base up).
  const nomMigration = `ajout_ff_${key}`
  execFileSync(
    'pnpm',
    ['exec', 'prisma', 'migrate', 'dev', '--create-only', '--name', nomMigration],
    { stdio: 'inherit' },
  )

  // Retrouve le dossier fraîchement créé (celui dont le nom finit par nomMigration).
  const dossier = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(nomMigration))
    .map((entry) => entry.name)
    .sort()
    .at(-1)
  if (!dossier) {
    process.stderr.write('Migration introuvable après scaffold.\n')
    process.exit(1)
  }

  const sqlPath = join(MIGRATIONS_DIR, dossier, 'migration.sql')
  // `updated_at` est @updatedAt côté Prisma (pas de default SQL) : on l'alimente
  // explicitement en INSERT brut, sinon violation NOT NULL. `created_at` a un
  // default DB (now()), donc facultatif — fourni aussi par cohérence.
  const insert =
    `\nINSERT INTO "feature_flipping" ("id", "key", "nom", "etat", "created_at", "updated_at")\n` +
    `VALUES (gen_random_uuid(), '${echapperSql(key)}', '${echapperSql(nom)}', '${etat}', now(), now());\n`
  writeFileSync(sqlPath, readFileSync(sqlPath, 'utf8') + insert)

  process.stdout.write(`✅ Migration générée : ${sqlPath}\n`)
  process.stdout.write('   Relis le SQL puis committe-le.\n')
}

main()
