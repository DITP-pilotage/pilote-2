import { isValidCalendarDate } from '@pilote/kpilote-shared/dates'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
// datetime ISO 8601 : date + T/espace + heure, offset optionnel (Z ou ±HH:MM).
const DATETIME = /^(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/

const PARIS_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// Interprète les dates au format ISO. Une date nue est renvoyée telle quelle ;
// un datetime porteur d'un offset (Z ou ±HH:MM) est résolu comme un instant absolu
// puis ramené à la date calendaire en Europe/Paris — d'où un `2022-12-31T23:00:00Z`
// devient `2023-01-01`. Un datetime « flottant » (sans offset) garde sa date écrite.
export const parseIsoDate = (texte: string): string | null => {
  if (DATE_ONLY.test(texte)) {
    return isValidCalendarDate(texte) ? texte : null
  }

  const match = DATETIME.exec(texte)
  if (!match) return null

  const [, datePart, offset] = match
  if (!offset) {
    return isValidCalendarDate(datePart!) ? datePart! : null
  }

  const instant = new Date(texte)
  if (Number.isNaN(instant.getTime())) return null
  // en-CA formate en YYYY-MM-DD.
  return PARIS_FORMAT.format(instant)
}
