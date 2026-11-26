// Retire les diacritiques (accents) d'une chaîne : « Zoé » → « Zoe ».
export const unaccent = (valeur: string): string =>
  valeur.normalize('NFD').replace(/\p{Diacritic}/gu, '')

// Normalise une chaîne pour une recherche insensible à la casse ET aux accents.
// À utiliser des deux côtés (texte indexé + terme saisi) pour comparer.
export const searchUnaccent = (valeur: string): string => unaccent(valeur).toLowerCase().trim()

// Clé de comparaison d'un libellé : sans accents, en minuscules, ponctuation
// réduite à des espaces. « Bouches-du-Rhône » et « bouches du rhone » ont la même.
export const normalizeForMatch = (valeur: string): string =>
  unaccent(valeur)
    .toLowerCase()
    .replaceAll(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()

// Une chaîne vide ou absente devient `null`, sinon la chaîne sans blancs aux
// bords : pour les champs de formulaire (« vide = effacer ») et les cellules de fichier.
export const emptyToNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

// Choisit la forme selon le nombre. Les deux formes sont données en entier pour
// les pluriels irréguliers et les groupes (« valeur prête » / « valeurs prêtes »).
export const pluralize = ({
  count,
  singular,
  plural,
}: {
  count: number
  singular: string
  plural: string
}): string => (count > 1 ? plural : singular)

// Découpe une liste séparée par des virgules (paramètre d'URL, filtre CSV), en
// retirant les blancs aux bords et les segments vides : « a, ,b, » → ['a', 'b'].
export const splitCsv = (valeur: string | undefined): string[] =>
  (valeur ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

// Inverse de splitCsv. Une liste vide donne `undefined`, pour omettre le paramètre.
export const joinCsv = (valeurs: ReadonlyArray<string>): string | undefined =>
  valeurs.length > 0 ? valeurs.join(',') : undefined
