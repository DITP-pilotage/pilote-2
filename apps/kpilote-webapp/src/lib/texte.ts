/**
 * Normalise un texte pour la recherche : retire les accents/diacritiques, unifie
 * les apostrophes/guillemets typographiques (’ ‘ ‛ → ') et passe en minuscules.
 * Permet un filtrage insensible à la casse, aux accents ET au type d'apostrophe
 * (ex: `chomage` matche `Chômage`, `l'action` matche `l’action`).
 */
export const normaliserTexte = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[‘’‛ʼ]/g, "'")
    .toLowerCase()
