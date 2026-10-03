import { z } from 'zod'

import { unaccent } from './texte'

// Longueur maximale d'un identifiant public. Les dix caractères d'écart avec
// `SLUG_BASE_MAX_LENGTH` réservent la place du suffixe de déduplication
// (`-2`, `-3`, …) : un slug suffixé ne peut donc jamais dépasser la limite.
export const SLUG_MAX_LENGTH = 100
export const SLUG_BASE_MAX_LENGTH = 90

// Lettres, chiffres et tirets simples, ni en tête ni en queue. La casse reste
// libre : `IND-005`, `REF-DEPT` et `DEPT-84` sont des slugs valides, ce qui
// rend inutile tout backfill des identifiants existants.
export const slugSchema = z
  .string()
  .max(SLUG_MAX_LENGTH, `Identifiant limité à ${SLUG_MAX_LENGTH} caractères`)
  .regex(
    /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
    'Identifiant attendu sous forme de slug : lettres, chiffres et tirets simples',
  )
  .describe(
    'Identifiant public, sous forme de slug (lettres, chiffres et tirets simples, ex. `bilan-de-prevention`). ' +
      'Insensible à la casse pour la vérification d’unicité, immuable une fois attribué.',
  )

// Dérive un slug d'un texte libre : « Bilan de prévention ! » → `bilan-de-prevention`.
// Retourne une chaîne vide si le texte ne contient aucun caractère alphanumérique.
export const slugify = (texte: string): string =>
  unaccent(texte)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, SLUG_BASE_MAX_LENGTH)
    .replace(/^-+|-+$/g, '')
