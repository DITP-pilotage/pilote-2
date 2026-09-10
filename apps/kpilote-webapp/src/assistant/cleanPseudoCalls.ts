import { TOOL_NAMES } from '@pilote/kpilote-shared/assistant/tools'

// Les modèles reproduisent parfois la syntaxe d'appel d'outil vue à l'entraînement, et le
// bloc apparaît en texte brut à l'utilisateur. Filet de sécurité, alimenté par le contrat
// partagé : la liste ne peut pas diverger de celle que le serveur enregistre — chez ppg,
// elle a divergé de quatre outils.
const CALL_START = new RegExp(`^\\s*(?:${TOOL_NAMES.join('|')})\\s*\\(`)

const parenthesisBalance = (line: string): number =>
  [...line].reduce((balance, character) => {
    if (character === '(') return balance + 1
    if (character === ')') return balance - 1
    return balance
  }, 0)

export const cleanPseudoCalls = (text: string): string => {
  const kept: string[] = []
  let depth = 0
  let insideCall = false

  for (const line of text.split('\n')) {
    if (insideCall) {
      depth += parenthesisBalance(line)
      if (depth <= 0) {
        insideCall = false
        depth = 0
      }
      continue
    }
    if (CALL_START.test(line)) {
      depth = parenthesisBalance(line)
      if (depth > 0) insideCall = true
      continue
    }
    kept.push(line)
  }

  return kept
    .join('\n')
    .replace(/(\n\s*---\s*)+\s*$/u, '')
    .trim()
}
