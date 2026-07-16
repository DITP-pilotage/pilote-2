import { formatIso, trouverAnneesPlausibles } from '@/valeurImport/parsers/helpers'

// Dernier recours de la cascade : extrait une année plausible (`2023`,
// `Émissions 2021 en kt`) → 1er janvier. Refuse si plusieurs années sont présentes
// (`2020-2023`) pour ne pas trancher une ambiguïté au hasard.
export const parseAnnee = (texte: string): string | null => {
  const annees = trouverAnneesPlausibles(texte)
  if (annees.length !== 1) return null
  return formatIso({ annee: annees[0]!, mois: 1, jour: 1 })
}
