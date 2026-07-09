import { safeStringify } from '@/valeurImport/helpers/safeStringify'

export type ParseNombreResult = { ok: true; valeur: number } | { ok: false; raison: string }

// POC : on assume locale FR. trim + virgule → point + Number().
// Pas de gestion des séparateurs de milliers, suffixes, parenthèses.
// Si on rencontre des cas réels, on étendra ou on demandera à Albert le format
// de colonne via le plan.
export const parseNombre = (value: unknown): ParseNombreResult => {
  if (value === null || value === undefined) {
    return { ok: false, raison: 'Cellule vide.' }
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { ok: false, raison: 'Nombre non fini.' }
    return { ok: true, valeur: value }
  }
  const texte = safeStringify(value).trim().replace(',', '.')
  if (!texte) return { ok: false, raison: 'Cellule vide.' }
  const valeur = Number(texte)
  if (!Number.isFinite(valeur)) {
    return { ok: false, raison: `« ${texte} » n'est pas un nombre.` }
  }
  return { ok: true, valeur }
}
