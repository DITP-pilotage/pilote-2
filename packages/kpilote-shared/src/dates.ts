import { z } from 'zod'

import { unaccent } from './texte'

export const isValidCalendarDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, yearStr, monthStr, dayStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format ISO YYYY-MM-DD')
  .refine(isValidCalendarDate, 'Date calendaire invalide')
  .describe('Date au format ISO YYYY-MM-DD.')

export const dateTruncSchema = z
  .enum(['day', 'week', 'month', 'quarter', 'year'])
  .describe(
    'Granularité temporelle de troncature appliquée aux dates des points. `day` = pas de ' +
      'troncature ; `week` = lundi ISO 8601 ; `month` = 1er du mois ; `quarter` = 1er des ' +
      'trimestres calendaires (janvier, avril, juillet, octobre) ; `year` = 1er janvier. ' +
      'Quand plusieurs saisies tombent dans le même bucket pour un individu, la plus récente ' +
      'est retenue.',
  )
export type DateTrunc = z.infer<typeof dateTruncSchema>

// Ordre du plus fin au plus grossier — utilisé pour valider que la granularité
// d'un côté (ex. objectifs) n'est pas plus fine que celle de l'autre (ex.
// valeurs) : un objectif qui change plus souvent que les mesures n'a pas de
// sens car aucune valeur ne pourrait évaluer sa progression.
const DATE_TRUNC_ORDER: Record<DateTrunc, number> = {
  day: 1,
  week: 2,
  month: 3,
  quarter: 4,
  year: 5,
}

export const isCoarserOrEqual = (a: DateTrunc, b: DateTrunc): boolean =>
  DATE_TRUNC_ORDER[a] >= DATE_TRUNC_ORDER[b]

const pad = (value: number): string => String(value).padStart(2, '0')

// Écrit une date ISO `YYYY-MM-DD` à partir de ses composantes, sans la valider
// (`isValidCalendarDate` pour cela).
export const formatIsoDate = ({
  year,
  month,
  day,
}: {
  year: number
  month: number
  day: number
}): string => `${year}-${pad(month)}-${pad(day)}`

// Lecture d'une date écrite à la française (fichier, saisie libre) vers ISO
// `YYYY-MM-DD`. Chaque forme a son
// parseur ; en cas de doute on renvoie `null`, jamais une date devinée. Une
// période (trimestre, mois, année) donne son premier jour.

const toIso = ({ annee, mois, jour }: { annee: number; mois: number; jour: number }) => {
  const iso = formatIsoDate({ year: annee, month: mois, day: jour })
  return isValidCalendarDate(iso) ? iso : null
}

// Années plausibles : 1900 à 2099. La borne évite de prendre un identifiant
// (`1234`, `Zone 5000`) pour une année.
const ANNEE_PLAUSIBLE = /(?<!\d)(?:19|20)\d{2}(?!\d)/g

const findAnnees = (texte: string): number[] => (texte.match(ANNEE_PLAUSIBLE) ?? []).map(Number)

// `2024-03-15`, ou un horodatage ISO dont on garde la date écrite.
const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[t ]\d{2}:\d{2}.*)?$/

const parseIso = (texte: string): string | null => {
  const match = ISO.exec(texte)
  if (!match) return null
  return toIso({ annee: Number(match[1]), mois: Number(match[2]), jour: Number(match[3]) })
}

// `15/03/2025`, `15-03-2025`, `15.03.2025` : jour puis mois, à la française.
const JOUR_MOIS_ANNEE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/

const parseJourMoisAnnee = (texte: string): string | null => {
  const match = JOUR_MOIS_ANNEE.exec(texte)
  if (!match) return null
  return toIso({ annee: Number(match[3]), mois: Number(match[2]), jour: Number(match[1]) })
}

// `Q1`, `T3` : la lettre n'est pas précédée d'un mot, le chiffre n'est pas suivi d'un chiffre.
const TRIMESTRE_LETTRE = /(?<![a-z0-9])[qt]\s*([1-4])(?!\d)/gi
// `1er trimestre`, `4e trim.`, `trimestre 2`.
const TRIMESTRE_MOT =
  /([1-4])\s*(?:er|re|ere|e|eme)?\s*trim(?:\.|estre)?|trim(?:\.|estre)?\s*([1-4])(?!\d)/gi

// Un trimestre et une année, dans n'importe quel ordre. Refusé s'il y a
// plusieurs années ou plusieurs trimestres.
const parseTrimestre = (texte: string): string | null => {
  const annees = findAnnees(texte)
  if (annees.length !== 1) return null
  const trimestres = new Set<number>()
  for (const match of texte.matchAll(TRIMESTRE_LETTRE)) trimestres.add(Number(match[1]))
  for (const match of texte.matchAll(TRIMESTRE_MOT)) trimestres.add(Number(match[1] ?? match[2]))
  const [trimestre] = [...trimestres]
  if (trimestres.size !== 1 || trimestre === undefined) return null
  return toIso({ annee: annees[0]!, mois: (trimestre - 1) * 3 + 1, jour: 1 })
}

const MOIS_BY_NOM: Record<string, number> = {
  janvier: 1,
  janv: 1,
  jan: 1,
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

const MOIS_ANNEE = /^(\d{1,2})[/-](\d{4})$/
const ANNEE_MOIS = /^(\d{4})[/-](\d{1,2})$/

const parseMoisNumerique = (texte: string): string | null => {
  const moisAnnee = MOIS_ANNEE.exec(texte)
  if (moisAnnee) return toIso({ annee: Number(moisAnnee[2]), mois: Number(moisAnnee[1]), jour: 1 })
  const anneeMois = ANNEE_MOIS.exec(texte)
  if (anneeMois) return toIso({ annee: Number(anneeMois[1]), mois: Number(anneeMois[2]), jour: 1 })
  return null
}

const findMois = (texte: string): number[] => {
  const mois = new Set<number>()
  for (const match of texte.matchAll(/(?<![a-z])([a-z]{3,9})(?![a-z])/g)) {
    const numero = MOIS_BY_NOM[match[1]!]
    if (numero !== undefined) mois.add(numero)
  }
  return [...mois]
}

// `janvier 2026`, `janv 2026`, `03/2025`, `2025-03`, et la date complète en
// toutes lettres `15 mars 2025` ou `1er janvier 2025`.
const parseMois = (texte: string): string | null => {
  const numerique = parseMoisNumerique(texte)
  if (numerique) return numerique

  const annees = findAnnees(texte)
  const mois = findMois(texte)
  if (annees.length !== 1 || mois.length !== 1) return null

  // Un seul autre nombre que l'année : c'est le jour.
  const autresNombres = (texte.match(/\d+/g) ?? []).map(Number).filter((n) => n !== annees[0])
  if (autresNombres.length > 1) return null
  return toIso({ annee: annees[0]!, mois: mois[0]!, jour: autresNombres[0] ?? 1 })
}

// Dernier recours : une année seule dans le texte (`2023`, `Émissions 2021 en kt`).
const parseAnnee = (texte: string): string | null => {
  const annees = findAnnees(texte)
  if (annees.length !== 1) return null
  return toIso({ annee: annees[0]!, mois: 1, jour: 1 })
}

// L'ordre compte : une forme précise l'emporte sur l'année seule.
export const parseDateFr = (value: string | number | null): string | null => {
  if (value === null) return null
  const texte = unaccent(String(value)).toLowerCase().trim()
  if (!texte) return null
  // Une date écrite en entier mais impossible (31/02, mois 13) reste illisible :
  // on ne la rattrape pas par son année.
  if (ISO.test(texte)) return parseIso(texte)
  if (JOUR_MOIS_ANNEE.test(texte)) return parseJourMoisAnnee(texte)
  return parseTrimestre(texte) ?? parseMois(texte) ?? parseAnnee(texte)
}
