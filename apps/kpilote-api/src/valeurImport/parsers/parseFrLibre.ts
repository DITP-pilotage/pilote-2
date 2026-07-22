import * as chrono from 'chrono-node'
import { isValidCalendarDate } from '@pilote/kpilote-shared/dates'

import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import { formatIso } from '@/valeurImport/parsers/helpers'
import { parseAnnee } from '@/valeurImport/parsers/parseAnnee'
import { parseIsoDate } from '@/valeurImport/parsers/parseIsoDate'
import { parseMois } from '@/valeurImport/parsers/parseMois'
import { parseQuarter } from '@/valeurImport/parsers/parseQuarter'

// chrono ne parse que des dates complètes (jour+mois+année ou ISO) et renvoie `null`
// sur toute forme de période — d'où sa place en filet après nos parsers dédiés. Les
// datetimes à offset sont déjà traités par parseIsoDate en amont, donc ici chrono ne
// voit que des dates naturelles sans fuseau : lire les composantes locales est stable.
const parseChronoFr = (texte: string): string | null => {
  const parsed = chrono.fr.parseDate(texte, undefined, { forwardDate: false })
  if (!parsed) return null
  const iso = formatIso({
    annee: parsed.getFullYear(),
    mois: parsed.getMonth() + 1,
    jour: parsed.getDate(),
  })
  return isValidCalendarDate(iso) ? iso : null
}

// Cascade best-effort : normalise toute date reconnaissable vers ISO `YYYY-MM-DD`
// (jamais d'heure), ou renvoie `null` si rien ne matche. Aucun throw : chaque étape
// renvoie `null` et laisse la suivante tenter. L'ordre garantit que les formes de
// période (trimestre, mois) l'emportent sur l'extraction d'année en dernier recours.
export const parseFrLibre = (value: unknown): string | null => {
  const texte = safeStringify(value).trim()
  if (!texte) return null

  return (
    parseIsoDate(texte) ??
    parseQuarter(texte) ??
    parseMois(texte) ??
    parseChronoFr(texte) ??
    parseAnnee(texte)
  )
}
