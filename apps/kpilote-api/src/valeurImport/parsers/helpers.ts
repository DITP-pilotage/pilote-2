const pad2 = (n: number): string => String(n).padStart(2, '0')

export const formatIso = ({
  annee,
  mois,
  jour,
}: {
  annee: number
  mois: number
  jour: number
}): string => `${annee}-${pad2(mois)}-${pad2(jour)}`

// Années « plausibles » : 1900–2099. Le bornage évite de confondre un identifiant
// (`1234`, `Zone 5000`) avec une année lors de l'extraction depuis une chaîne bruitée.
const ANNEE_PLAUSIBLE = /(?<!\d)(?:19|20)\d{2}(?!\d)/g

export const trouverAnneesPlausibles = (texte: string): number[] => {
  const matches = texte.match(ANNEE_PLAUSIBLE)
  return matches ? matches.map(Number) : []
}
