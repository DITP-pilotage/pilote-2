// Mappe une valeur d'input texte vers `null` quand elle est vide (après trim),
// sinon renvoie la chaîne trimmée. Utilisé pour convertir les champs de
// formulaire (« vide = effacer ») vers les bodies d'API nullable.
export const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
