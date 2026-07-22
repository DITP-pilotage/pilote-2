import { formatIso, trouverAnneesPlausibles } from '@/valeurImport/parsers/helpers'

// Marqueurs de trimestre, cherchés n'importe où dans la chaîne :
// - `Q1` / `T3` (lettre non précédée d'un mot/chiffre, chiffre 1-4 non suivi d'un chiffre)
const TRIMESTRE_QT = /(?<![a-z0-9])[qt]\s*([1-4])(?!\d)/gi
// - `1er trimestre`, `4e trim.`, `trimestre 2`
const TRIMESTRE_MOT =
  /([1-4])\s*(?:er|re|ere|ère|e|ème|eme)?\s*trim(?:\.|estre)?|trim(?:\.|estre)?\s*([1-4])/gi

// Trimestre + année, dans n'importe quel ordre (`Q4 2023`, `2023 T4`,
// `4e trimestre 2023`). N'accepte que si exactement une année plausible et un seul
// trimestre sont trouvés — sinon `null` (ambiguïté laissée à la revue).
export const parseQuarter = (texte: string): string | null => {
  const annees = trouverAnneesPlausibles(texte)
  if (annees.length !== 1) return null

  const trimestres = new Set<number>()
  for (const m of texte.matchAll(TRIMESTRE_QT)) trimestres.add(Number(m[1]))
  for (const m of texte.matchAll(TRIMESTRE_MOT)) trimestres.add(Number(m[1] ?? m[2]))
  if (trimestres.size !== 1) return null

  const trimestre = [...trimestres][0]!
  return formatIso({ annee: annees[0]!, mois: (trimestre - 1) * 3 + 1, jour: 1 })
}
