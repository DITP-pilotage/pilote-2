import { searchUnaccent } from '@pilote/kpilote-shared/texte'

// Filtre de `cmdk` par sous-chaîne, insensible à la casse et aux accents :
// prévisible, contrairement au score flou par défaut de cmdk. L'appelant peut
// donc passer le texte brut d'un élément : la normalisation se fait ici.
export const commandFilter = (itemValue: string, query: string): number => {
  const needle = searchUnaccent(query)
  if (!needle) return 1
  return searchUnaccent(itemValue).includes(needle) ? 1 : 0
}
