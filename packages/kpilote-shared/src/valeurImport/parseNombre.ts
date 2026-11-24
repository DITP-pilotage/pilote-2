// Lecture d'un nombre de fichier, en convention française ou anglo-saxonne.
// Renvoie `null` si la cellule n'est pas un nombre.

// Le dernier séparateur rencontré (`.` ou `,`) est le séparateur décimal,
// l'autre sépare les milliers. Ambiguïté assumée : `1.234` se lit 1,234.
const normalizeSeparators = (texte: string): string => {
  const lastPoint = texte.lastIndexOf('.')
  const lastVirgule = texte.lastIndexOf(',')
  const hasPoint = lastPoint !== -1
  const hasVirgule = lastVirgule !== -1
  if (hasPoint && hasVirgule) {
    return lastVirgule > lastPoint
      ? texte.replaceAll('.', '').replace(',', '.')
      : texte.replaceAll(',', '')
  }
  if (hasVirgule) return texte.replaceAll(',', '.')
  return texte
}

export const parseNombre = (value: string | number | null): number | null => {
  if (value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  // Blancs (insécables compris) et unités collées, fréquents dans les exports de tableur.
  const texte = normalizeSeparators(value.replaceAll(/\s/g, '').replaceAll(/[%€$£]/g, ''))
  if (texte === '') return null
  const nombre = Number(texte)
  return Number.isFinite(nombre) ? nombre : null
}
