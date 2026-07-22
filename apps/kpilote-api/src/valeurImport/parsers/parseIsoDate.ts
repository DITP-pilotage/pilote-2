import { Temporal } from '@js-temporal/polyfill'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
// datetime ISO 8601 : date + T/espace + heure, offset optionnel (Z ou ±HH:MM).
const DATETIME = /^(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/

// Valide une date calendaire nue (rejette 2022-13-40, 2023-02-29…) via Temporal.
const toPlainDate = (texte: string): string | null => {
  try {
    return Temporal.PlainDate.from(texte, { overflow: 'reject' }).toString()
  } catch {
    return null
  }
}

// Interprète les dates au format ISO. Une date nue est renvoyée telle quelle ;
// un datetime porteur d'un offset (Z ou ±HH:MM) est résolu comme un instant absolu
// puis ramené à la date calendaire en Europe/Paris — d'où un `2022-12-31T23:00:00Z`
// devient `2023-01-01`. Un datetime « flottant » (sans offset) garde sa date écrite.
export const parseIsoDate = (texte: string): string | null => {
  if (DATE_ONLY.test(texte)) {
    return toPlainDate(texte)
  }

  const match = DATETIME.exec(texte)
  if (!match) return null

  const [, datePart, offset] = match
  if (!offset) {
    return toPlainDate(datePart!)
  }

  try {
    return Temporal.Instant.from(texte).toZonedDateTimeISO('Europe/Paris').toPlainDate().toString()
  } catch {
    return null
  }
}
