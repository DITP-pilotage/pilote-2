// Retire les diacritiques (accents) d'une chaîne : « Zoé » → « Zoe ».
export const unaccent = (valeur: string): string =>
  valeur.normalize('NFD').replace(/\p{Diacritic}/gu, '')

// Normalise une chaîne pour une recherche insensible à la casse ET aux accents.
// À utiliser des deux côtés (texte indexé + terme saisi) pour comparer.
export const searchUnaccent = (valeur: string): string => unaccent(valeur).toLowerCase().trim()
