import { formatIso, trouverAnneesPlausibles } from '@/valeurImport/parsers/helpers'

// Accents retirés + minuscules, pour matcher `février`/`fevrier`/`Février` pareil.
const normaliser = (texte: string): string =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// Clés normalisées (sans accent). Formes longues + abréviations courantes.
const MOIS_NUM: Record<string, number> = {
  janvier: 1,
  janv: 1,
  fevrier: 2,
  fevr: 2,
  fev: 2,
  mars: 3,
  avril: 4,
  avr: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  juil: 7,
  aout: 8,
  septembre: 9,
  sept: 9,
  sep: 9,
  octobre: 10,
  oct: 10,
  novembre: 11,
  nov: 11,
  decembre: 12,
  dec: 12,
}

// Formes numériques strictes (ancrées) : `MM/YYYY`, `MM-YYYY`, `YYYY-MM`, `YYYY/MM`.
// Ancrées volontairement pour ne pas grignoter un `15/03/2025` (→ chrono).
const parseNumerique = (texte: string): string | null => {
  const moisAnnee = /^(\d{1,2})[/-](\d{4})$/.exec(texte)
  if (moisAnnee) {
    const mois = Number(moisAnnee[1])
    return mois >= 1 && mois <= 12
      ? formatIso({ annee: Number(moisAnnee[2]), mois, jour: 1 })
      : null
  }
  const anneeMois = /^(\d{4})[/-](\d{1,2})$/.exec(texte)
  if (anneeMois) {
    const mois = Number(anneeMois[2])
    return mois >= 1 && mois <= 12
      ? formatIso({ annee: Number(anneeMois[1]), mois, jour: 1 })
      : null
  }
  return null
}

// Mois + année (`janvier 2026`, `2026 janvier`, `janv 2026`) ou forme numérique.
// Le mois en lettres est cherché comme token entier (3–9 lettres) pour éviter les
// faux positifs par sous-chaîne. Garde single-match sur l'année et le mois.
export const parseMois = (texte: string): string | null => {
  const t = normaliser(texte)

  const numerique = parseNumerique(t)
  if (numerique) return numerique

  const annees = trouverAnneesPlausibles(t)
  if (annees.length !== 1) return null

  // Si un nombre autre que l'année est présent (probable jour, ex. « 15 mars 2025 »),
  // on laisse chrono gérer la date complète plutôt que de tronquer au 1er du mois.
  const nombres = t.match(/\d+/g) ?? []
  if (nombres.length !== 1) return null

  const mois = new Set<number>()
  for (const m of t.matchAll(/(?<![a-z])([a-z]{3,9})(?![a-z])/g)) {
    const num = MOIS_NUM[m[1]!]
    if (num) mois.add(num)
  }
  if (mois.size !== 1) return null

  return formatIso({ annee: annees[0]!, mois: [...mois][0]!, jour: 1 })
}
