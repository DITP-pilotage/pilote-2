import { z } from 'zod'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")

export const collectionPublicIdSchema = z
  .string()
  .regex(/^COL-\d+$/, 'Identifiant public attendu au format COL-XXX')
  .describe('Identifiant public de la collection (format COL-XXX).')

export const referentielPublicIdSchema = z
  .string()
  .regex(
    /^REF-[A-Z0-9-]{1,16}$/,
    'Identifiant public attendu au format REF-<SLUG> (max 20 caractères)',
  )
  .describe(
    'Identifiant public du référentiel (format REF-<SLUG>, ex. REF-DEPT). Max 20 caractères.',
  )

export const individuPublicIdSchema = z
  .string()
  .regex(
    /^[A-Z][A-Z0-9-]{0,19}$/,
    "Identifiant public d'individu attendu (lettre majuscule suivie de lettres/chiffres/tirets, max 20 caractères)",
  )
  .describe(
    "Identifiant public d'individu, format humain-friendly (ex. DEPT-84, REG-93, FR). Lettre majuscule puis lettres/chiffres/tirets, max 20 caractères.",
  )

export const widgetPublicIdSchema = z
  .string()
  .regex(
    /^WID-[A-Z0-9-]{1,16}$/,
    'Identifiant public attendu au format WID-<SLUG> (max 20 caractères)',
  )
  .describe(
    'Identifiant public du widget (format WID-<SLUG>, ex. WID-CARTE-DEPT). Max 20 caractères.',
  )
