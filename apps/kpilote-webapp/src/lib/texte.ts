/**
 * Normalise un texte pour la recherche : retire les accents/diacritiques et
 * passe en minuscules. Permet un filtrage insensible à la casse ET aux accents
 * (ex: `chomage` matche `Chômage`).
 */
export const normaliserTexte = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
