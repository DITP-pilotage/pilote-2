import { db } from '@/framework/persistence/dbStore'

// Clé arbitraire, dédiée à la numérotation des indicateurs, pour
// pg_advisory_xact_lock (sérialise les créations concurrentes). Le verrou est
// relâché automatiquement au commit/rollback de la transaction courante.
const INDICATEUR_NUMBERING_LOCK = 4815162342n

export const generateIndicateurPublicId = async (): Promise<string> => {
  await db().$executeRaw`SELECT pg_advisory_xact_lock(${INDICATEUR_NUMBERING_LOCK})`
  const rows = await db().$queryRaw<{ max: number }[]>`
    SELECT COALESCE(MAX(CAST(SUBSTRING(public_id FROM 5) AS INTEGER)), 0) AS max
    FROM indicateur
    WHERE public_id ~ '^IND-[0-9]+$'
  `
  const max = Number(rows[0]?.max ?? 0)
  return `IND-${max + 1}`
}
