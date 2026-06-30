import * as chrono from 'chrono-node'

import { safeStringify } from '@/importPoc/helpers/safeStringify'

export type FormatDate = 'iso' | 'fr-libre' | 'quarter' | 'annee'

export type ParseDateResult = { ok: true; iso: string } | { ok: false; raison: string }

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/
const ANNEE_REGEX = /^(\d{4})$/
const QUARTER_REGEX = /^\s*(?:[QT]\s*(\d)|(\d)\s*(?:er\s*)?(?:trimestre|trim\.?))\s*(\d{4})\s*$/i
const MOIS_FR_REGEX =
  /^(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})$/i
const MM_SLASH_YYYY_REGEX = /^(\d{1,2})\/(\d{4})$/
const YYYY_DASH_MM_REGEX = /^(\d{4})-(\d{1,2})$/

const MOIS_FR_VERS_NUM: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
}

const pad2 = (n: number): string => String(n).padStart(2, '0')
const formatIso = (year: number, month: number, day: number): string =>
  `${year}-${pad2(month)}-${pad2(day)}`

const tryAnnee = (texte: string): ParseDateResult | null => {
  const match = ANNEE_REGEX.exec(texte)
  if (!match) return null
  return { ok: true, iso: formatIso(Number(match[1]), 1, 1) }
}

const tryQuarter = (texte: string): ParseDateResult | null => {
  const match = QUARTER_REGEX.exec(texte)
  if (!match) return null
  const trimestre = Number(match[1] ?? match[2])
  if (trimestre < 1 || trimestre > 4) return null
  return { ok: true, iso: formatIso(Number(match[3]), (trimestre - 1) * 3 + 1, 1) }
}

const tryMoisFr = (texte: string): ParseDateResult | null => {
  const match = MOIS_FR_REGEX.exec(texte)
  if (!match) return null
  const mois = MOIS_FR_VERS_NUM[match[1]!.toLowerCase()]
  if (!mois) return null
  return { ok: true, iso: formatIso(Number(match[2]), mois, 1) }
}

const tryMmSlashYyyy = (texte: string): ParseDateResult | null => {
  const match = MM_SLASH_YYYY_REGEX.exec(texte)
  if (!match) return null
  const mois = Number(match[1])
  if (mois < 1 || mois > 12) return null
  return { ok: true, iso: formatIso(Number(match[2]), mois, 1) }
}

const tryYyyyDashMm = (texte: string): ParseDateResult | null => {
  const match = YYYY_DASH_MM_REGEX.exec(texte)
  if (!match) return null
  const mois = Number(match[2])
  if (mois < 1 || mois > 12) return null
  return { ok: true, iso: formatIso(Number(match[1]), mois, 1) }
}

const tryChronoFr = (texte: string): ParseDateResult | null => {
  const parsed = chrono.fr.parseDate(texte, undefined, { forwardDate: false })
  if (!parsed) return null
  return {
    ok: true,
    iso: formatIso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()),
  }
}

// Cascade pour le mode 'fr-libre' (colonne potentiellement hétérogène).
// Les regex strictes passent en premier pour garantir la sémantique « 1er du
// mois/trimestre/année » sans dépendre du jour courant utilisé par chrono pour
// imputer les composantes manquantes.
const tryAllFrLibre = (texte: string): ParseDateResult | null =>
  tryAnnee(texte) ??
  tryQuarter(texte) ??
  tryMoisFr(texte) ??
  tryMmSlashYyyy(texte) ??
  tryYyyyDashMm(texte) ??
  tryChronoFr(texte)

export const parseDate = (value: unknown, format: FormatDate): ParseDateResult => {
  if (value === null || value === undefined) {
    return { ok: false, raison: 'Cellule vide.' }
  }
  const texte = safeStringify(value).trim()
  if (!texte) return { ok: false, raison: 'Cellule vide.' }

  switch (format) {
    case 'iso':
      if (!ISO_REGEX.test(texte)) {
        return { ok: false, raison: `« ${texte} » n'est pas au format YYYY-MM-DD.` }
      }
      return { ok: true, iso: texte }

    case 'annee': {
      const result = tryAnnee(texte)
      return result ?? { ok: false, raison: `« ${texte} » n'est pas une année à 4 chiffres.` }
    }

    case 'quarter': {
      const result = tryQuarter(texte)
      return (
        result ?? {
          ok: false,
          raison: `« ${texte} » n'est pas un trimestre reconnu (ex: Q1 2023, T2 2023, 1er trimestre 2023).`,
        }
      )
    }

    case 'fr-libre': {
      const result = tryAllFrLibre(texte)
      return (
        result ?? {
          ok: false,
          raison: `« ${texte} » n'a pas pu être interprété comme une date (formats supportés : YYYY, Q1 YYYY, janvier YYYY, MM/YYYY, YYYY-MM, ou tout format reconnu par chrono-node FR).`,
        }
      )
    }
  }
}
