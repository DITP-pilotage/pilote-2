// Le sous-agent recopie une chaîne mieux qu'il ne reformate un nombre (constat PPG : il
// écrivait « 22 points » pour −22) : tout ce qu'il écrit lui arrive déjà formaté.

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const MINUS = '−'

const isPercent = (unite: string | null): boolean =>
  unite?.toLocaleLowerCase('fr-FR') === 'pourcentage'

const unitSuffix = (unite: string | null): string => {
  if (!unite) return ''
  return isPercent(unite) ? ' %' : ` ${unite}`
}

// Intl écrit les milliers avec une espace insécable étroite, que le sous-agent recopie mal.
const number = (value: number): string => NUMBER.format(value).replace(/\s/gu, ' ')

export const formatValeur = (valeur: number | null, unite: string | null): string =>
  valeur === null ? 'non renseignée' : `${number(valeur)}${unitSuffix(unite)}`

export const formatTaux = (taux: number | null): string =>
  taux === null ? 'non calculé' : `${Math.round(taux)} %`

// L'écart entre deux pourcentages se compte en points : « −1,5 % » se lirait comme relatif.
export const formatEcart = (ecart: number | null, unite: string | null): string => {
  if (ecart === null) return 'non calculé'
  const sign = ecart < 0 ? MINUS : ecart > 0 ? '+' : ''
  const magnitude = Math.abs(ecart)
  if (ecart === 0) return '0'
  const suffix = isPercent(unite) ? (magnitude >= 2 ? ' points' : ' point') : unitSuffix(unite)
  return `${sign}${number(magnitude)}${suffix}`
}

export const formatPonderation = (ponderation: number): string => number(ponderation)

/**
 * Un texte saisi par les équipes, ramené à une ligne bornée : il ne peut ni ouvrir une
 * section du prompt ni le noyer.
 */
export const formatCitation = (text: string, max: number): string => {
  const line = text
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
  return line.length > max ? `${line.slice(0, max)}…` : line
}

export const formatDate = (date: string): string => DATE.format(new Date(date))
