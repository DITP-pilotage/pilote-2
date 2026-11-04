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

const unitSuffix = (unite: string | null): string => {
  if (!unite) return ''
  return unite.toLocaleLowerCase('fr-FR') === 'pourcentage' ? ' %' : ` ${unite}`
}

// Intl écrit les milliers avec une espace insécable étroite, que le sous-agent recopie mal.
const number = (value: number): string => NUMBER.format(value).replace(/\s/gu, ' ')

export const formatValeur = (valeur: number | null, unite: string | null): string =>
  valeur === null ? 'non renseignée' : `${number(valeur)}${unitSuffix(unite)}`

export const formatTaux = (taux: number | null): string =>
  taux === null ? 'non calculé' : `${Math.round(taux)} %`

export const formatEcart = (ecart: number | null, unite: string | null): string => {
  if (ecart === null) return 'non calculé'
  const sign = ecart < 0 ? MINUS : ecart > 0 ? '+' : ''
  return `${sign}${number(Math.abs(ecart))}${ecart === 0 ? '' : unitSuffix(unite)}`
}

export const formatDate = (date: string): string => DATE.format(new Date(date))
