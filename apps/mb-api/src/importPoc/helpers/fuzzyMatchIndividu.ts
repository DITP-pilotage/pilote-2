export type IndividuCandidate = { publicId: string; nom: string }

export type FuzzyMatchResult =
  | { kind: 'matched'; publicId: string; score: number; confiance: 'haute' | 'basse' }
  | { kind: 'unmatched'; meilleurCandidat?: { publicId: string; score: number } }

const SCORE_HAUTE_CONFIANCE = 0.85
const SCORE_MIN_BASSE_CONFIANCE = 0.6

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const levenshtein = (left: string, right: string): number => {
  if (left === right) return 0
  if (left.length === 0) return right.length
  if (right.length === 0) return left.length

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index)
  const currentRow = new Array<number>(right.length + 1)

  for (let i = 1; i <= left.length; i += 1) {
    currentRow[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left.charAt(i - 1) === right.charAt(j - 1) ? 0 : 1
      currentRow[j] = Math.min(
        currentRow[j - 1]! + 1,
        previousRow[j]! + 1,
        previousRow[j - 1]! + cost,
      )
    }
    for (let j = 0; j <= right.length; j += 1) previousRow[j] = currentRow[j]!
  }

  return previousRow[right.length]!
}

const similarity = (left: string, right: string): number => {
  const max = Math.max(left.length, right.length)
  if (max === 0) return 1
  return 1 - levenshtein(left, right) / max
}

export const fuzzyMatchIndividu = ({
  libelle,
  publicIdPropose,
  candidats,
}: {
  libelle: string
  publicIdPropose?: string
  candidats: ReadonlyArray<IndividuCandidate>
}): FuzzyMatchResult => {
  // Confiance maximale : Albert a proposé un publicId qui figure dans le référentiel
  if (publicIdPropose) {
    const exact = candidats.find((candidat) => candidat.publicId === publicIdPropose)
    if (exact) return { kind: 'matched', publicId: exact.publicId, score: 1, confiance: 'haute' }
  }

  const cible = normalize(libelle)
  if (!cible) return { kind: 'unmatched' }

  let meilleur: { publicId: string; score: number } | undefined
  for (const candidat of candidats) {
    const score = Math.max(
      similarity(cible, normalize(candidat.nom)),
      similarity(cible, normalize(candidat.publicId)),
    )
    if (!meilleur || score > meilleur.score) {
      meilleur = { publicId: candidat.publicId, score }
    }
  }

  if (!meilleur) return { kind: 'unmatched' }
  if (meilleur.score >= SCORE_HAUTE_CONFIANCE) {
    return { kind: 'matched', publicId: meilleur.publicId, score: meilleur.score, confiance: 'haute' }
  }
  if (meilleur.score >= SCORE_MIN_BASSE_CONFIANCE) {
    return { kind: 'matched', publicId: meilleur.publicId, score: meilleur.score, confiance: 'basse' }
  }
  return { kind: 'unmatched', meilleurCandidat: meilleur }
}
