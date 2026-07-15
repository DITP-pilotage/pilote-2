// Retire les diacritiques (accents) pour une recherche insensible aux accents.
// « Zoé » → « Zoe ». Utilisé pour alimenter le texte de recherche des Pickers cmdk.
export const sansAccents = (valeur: string): string =>
  valeur.normalize('NFD').replace(/\p{Diacritic}/gu, '')
