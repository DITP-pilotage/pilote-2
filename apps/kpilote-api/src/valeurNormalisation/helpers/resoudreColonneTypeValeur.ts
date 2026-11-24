// Valide la colonne « type de valeur » proposée par Albert : elle n'est retenue
// que si son nom est non vide ET correspond à un header réel du fichier. Albert
// remplit parfois ce champ optionnel avec un nom vide ou halluciné ; sans ce
// garde-fou, la passe 1b filtrerait un set vide et effacerait tout l'import.
export const resoudreColonneTypeValeur = ({
  colonneTypeValeur,
  headers,
}: {
  colonneTypeValeur: { nom: string } | undefined
  headers: ReadonlyArray<string>
}): string | null => {
  const nom = colonneTypeValeur?.nom.trim()
  if (!nom) return null
  return headers.includes(nom) ? nom : null
}
