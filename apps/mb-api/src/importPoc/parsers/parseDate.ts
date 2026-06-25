import * as chrono from 'chrono-node'

import { safeStringify } from '@/importPoc/helpers/safeStringify'

export type FormatDate = 'iso' | 'fr-libre' | 'quarter' | 'annee'

export type ParseDateResult =
  | { ok: true; iso: string }
  | { ok: false; raison: string }

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/
const ANNEE_REGEX = /^(\d{4})$/
const QUARTER_REGEX = /^\s*(?:[QT]\s*(\d)|(\d)\s*(?:er\s*)?(?:trimestre|trim\.?))\s*(\d{4})\s*$/i

const pad2 = (n: number): string => String(n).padStart(2, '0')
const formatIso = (year: number, month: number, day: number): string =>
  `${year}-${pad2(month)}-${pad2(day)}`

export const parseDate = (value: unknown, format: FormatDate): ParseDateResult => {
  if (value === null || value === undefined) {
    return { ok: false, raison: 'Cellule vide.' }
  }
  const texte = safeStringify(value).trim()
  if (!texte) return { ok: false, raison: 'Cellule vide.' }

  switch (format) {
    case 'iso':
      if (!ISO_REGEX.test(texte)) return { ok: false, raison: `« ${texte} » n'est pas au format YYYY-MM-DD.` }
      return { ok: true, iso: texte }

    case 'annee': {
      const match = ANNEE_REGEX.exec(texte)
      if (!match) return { ok: false, raison: `« ${texte} » n'est pas une année à 4 chiffres.` }
      return { ok: true, iso: formatIso(Number(match[1]), 1, 1) }
    }

    case 'quarter': {
      const match = QUARTER_REGEX.exec(texte)
      if (!match) return { ok: false, raison: `« ${texte} » n'est pas un trimestre reconnu (ex: Q1 2023, T2 2023, 1er trimestre 2023).` }
      const trimestre = Number(match[1] ?? match[2])
      const annee = Number(match[3])
      if (trimestre < 1 || trimestre > 4) {
        return { ok: false, raison: `Trimestre « ${trimestre} » invalide (1..4 attendu).` }
      }
      const mois = (trimestre - 1) * 3 + 1
      return { ok: true, iso: formatIso(annee, mois, 1) }
    }

    case 'fr-libre': {
      const parsed = chrono.fr.parseDate(texte, undefined, { forwardDate: false })
      if (!parsed) return { ok: false, raison: `« ${texte} » n'a pas pu être interprétée comme une date française.` }
      return {
        ok: true,
        iso: formatIso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()),
      }
    }
  }
}
