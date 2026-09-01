import { NOMS_OUTILS } from '@pilote/kpilote-shared/assistant/tools'

// Les modèles reproduisent parfois la syntaxe d'appel d'outil vue à l'entraînement, et le
// bloc apparaît en texte brut à l'utilisateur. Filet de sécurité, alimenté par le contrat
// partagé : la liste ne peut pas diverger de celle que le serveur enregistre — chez ppg,
// elle a divergé de quatre outils.
const DEBUT_APPEL = new RegExp(`^\\s*(?:${NOMS_OUTILS.join('|')})\\s*\\(`)

const soldeParentheses = (ligne: string): number =>
  [...ligne].reduce((solde, caractere) => {
    if (caractere === '(') return solde + 1
    if (caractere === ')') return solde - 1
    return solde
  }, 0)

export const nettoyerPseudoAppels = (texte: string): string => {
  const conservees: string[] = []
  let profondeur = 0
  let dansUnAppel = false

  for (const ligne of texte.split('\n')) {
    if (dansUnAppel) {
      profondeur += soldeParentheses(ligne)
      if (profondeur <= 0) {
        dansUnAppel = false
        profondeur = 0
      }
      continue
    }
    if (DEBUT_APPEL.test(ligne)) {
      profondeur = soldeParentheses(ligne)
      if (profondeur > 0) dansUnAppel = true
      continue
    }
    conservees.push(ligne)
  }

  return conservees
    .join('\n')
    .replace(/(\n\s*---\s*)+\s*$/u, '')
    .trim()
}
