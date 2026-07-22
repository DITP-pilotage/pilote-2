// Conversion d'une cellule xlsx (string | number | boolean | Date | null…) en texte.
// Partagé entre les deux projections d'une matrice (rows strictes / records bruts).
export const celluleVersTexte = (cellule: unknown): string => {
  if (cellule == null) return ''
  if (typeof cellule === 'string') return cellule
  if (typeof cellule === 'number' || typeof cellule === 'boolean' || typeof cellule === 'bigint') {
    return String(cellule)
  }
  return ''
}
