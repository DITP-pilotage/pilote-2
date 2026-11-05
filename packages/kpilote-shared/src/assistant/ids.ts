import { z } from 'zod'

type PrefixedEntity = 'IND' | 'COL'

// Le modèle écrit souvent un identifiant à peu près juste (`ind 42`, `IND42`). On le
// redresse au parse plutôt que de compter sur le prompt. Une valeur qui n'a pas la forme
// préfixée passe telle quelle : les identifiants deviendront des slugs (PIL-1688).
export const normalizePublicId = (prefix: PrefixedEntity, raw: string): string => {
  const trimmed = raw.trim()
  const match = new RegExp(`^${prefix}[\\s_-]*(\\d+)$`, 'iu').exec(trimmed)
  return match ? `${prefix}-${match[1]}` : trimmed
}

export const indicateurIdInput = z
  .string()
  .min(1)
  .transform((raw) => normalizePublicId('IND', raw))
  .describe("Identifiant de l'indicateur, par exemple IND-42.")

export const collectionIdInput = z
  .string()
  .min(1)
  .transform((raw) => normalizePublicId('COL', raw))
  .describe('Identifiant de la collection, par exemple COL-7.')

export const individuIdInput = z
  .string()
  .min(1)
  .transform((raw) => raw.trim().toUpperCase())
  .describe("Identifiant de l'individu tel que renvoyé par search_individus.")

export const referentielIdInput = z
  .string()
  .min(1)
  .transform((raw) => raw.trim().toUpperCase())
  .describe('Identifiant du référentiel, par exemple REF-DEPT.')
