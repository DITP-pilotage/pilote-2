// Les modèles écrivent volontiers un calcul en LaTeX, que rien n'interprète ici : l'utilisateur
// lit « \frac{a}{b} » tel quel. Le prompt l'interdit ; ceci est le filet quand il l'oublie.
// On aplatit les commandes courantes en texte lisible, sans chercher l'exhaustivité.

const SYMBOLS: ReadonlyArray<[RegExp, string]> = [
  [/\\approx/gu, '≈'],
  [/\\times/gu, '×'],
  [/\\cdot/gu, '·'],
  [/\\leq?\b/gu, '≤'],
  [/\\geq?\b/gu, '≥'],
  [/\\neq?\b/gu, '≠'],
  [/\\pm/gu, '±'],
  [/\\%/gu, '%'],
  [/\\(?:,|;|!|quad|qquad)/gu, ' '],
]

// `\frac{a}{b}` sans accolades imbriquées : la forme que produit un calcul de moyenne.
const FRACTION = /\\frac\{([^{}]*)\}\{([^{}]*)\}/gu
const TEXT = /\\(?:text|mathrm|textbf)\{([^{}]*)\}/gu
const DELIMITERS = /\\\[|\\\]|\\\(|\\\)|\$\$/gu

export const flattenLatex = (text: string): string => {
  if (!/\\[a-zA-Z[\]()]|\$\$/u.test(text)) return text

  let result = text.replace(DELIMITERS, '').replace(TEXT, '$1')
  result = result.replace(FRACTION, (_match, numerator: string, denominator: string) => {
    const wrap = (part: string): string => (/[+-]/u.test(part) ? `(${part.trim()})` : part.trim())
    return `${wrap(numerator)} / ${wrap(denominator)}`
  })
  for (const [pattern, replacement] of SYMBOLS) result = result.replace(pattern, replacement)
  return result.replace(/[ \t]{2,}/gu, ' ')
}
