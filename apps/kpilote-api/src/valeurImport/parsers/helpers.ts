import { Temporal } from '@js-temporal/polyfill'

export const formatIso = ({
  annee,
  mois,
  jour,
}: {
  annee: number
  mois: number
  jour: number
}): string => Temporal.PlainDate.from({ year: annee, month: mois, day: jour }).toString()

// Années « plausibles » : 1900–2099. Le bornage évite de confondre un identifiant
// (`1234`, `Zone 5000`) avec une année lors de l'extraction depuis une chaîne bruitée.
const ANNEE_PLAUSIBLE = /(?<!\d)(?:19|20)\d{2}(?!\d)/g

export const trouverAnneesPlausibles = (texte: string): number[] => {
  const matches = texte.match(ANNEE_PLAUSIBLE)
  return matches ? matches.map(Number) : []
}
