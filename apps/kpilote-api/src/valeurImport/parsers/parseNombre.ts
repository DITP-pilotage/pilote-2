import { safeStringify } from '@/valeurImport/helpers/safeStringify'

export type ParseNombreResult = { ok: true; valeur: number } | { ok: false; raison: string }

// Normalise un nombre saisi en convention FR avant `Number()` :
// - retire tout blanc (espaces normaux, insécables, fines — matchés par \s) et les
//   symboles d'unité collés (% € $ £), fréquents dans les exports tableur ;
// - résout séparateur de milliers vs décimal par la position : le dernier `.`/`,`
//   rencontré est le décimal, l'autre est un séparateur de milliers.
// Ambiguïté non levée (assumée) : `1.234` sans virgule est lu `1.234`, pas `1234`.
const normaliserNombreFr = (texte: string): string => {
  const sansUnite = texte.replace(/\s/g, '').replace(/[%€$£]/g, '')

  const dernierPoint = sansUnite.lastIndexOf('.')
  const derniereVirgule = sansUnite.lastIndexOf(',')

  if (dernierPoint !== -1 && derniereVirgule !== -1) {
    return derniereVirgule > dernierPoint
      ? sansUnite.replace(/\./g, '').replace(',', '.') // virgule décimale, point millier
      : sansUnite.replace(/,/g, '') // point décimal, virgule millier
  }
  if (derniereVirgule !== -1) {
    return sansUnite.replace(/,/g, '.') // virgule décimale FR
  }
  return sansUnite
}

export const parseNombre = (value: unknown): ParseNombreResult => {
  if (value === null || value === undefined) {
    return { ok: false, raison: 'Cellule vide.' }
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { ok: false, raison: 'Nombre non fini.' }
    return { ok: true, valeur: value }
  }

  const brut = safeStringify(value).trim()
  if (!brut) return { ok: false, raison: 'Cellule vide.' }

  const texte = normaliserNombreFr(brut)
  const valeur = Number(texte)
  if (texte === '' || !Number.isFinite(valeur)) {
    return { ok: false, raison: `« ${brut} » n'est pas un nombre.` }
  }
  return { ok: true, valeur }
}
