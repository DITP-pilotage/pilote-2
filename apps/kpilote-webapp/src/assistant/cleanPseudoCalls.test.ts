import { TOOL_NAMES } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import { cleanPseudoCalls } from './cleanPseudoCalls'

describe('cleanPseudoCalls', () => {
  it('supprime un appel écrit en pseudo-code sur une ligne', () => {
    expect(cleanPseudoCalls('Voici :\nget_synthese_indicateur({"id": "IND-1"})\nRésultat.')).toBe(
      'Voici :\nRésultat.',
    )
  })

  it('supprime un appel étalé sur plusieurs lignes', () => {
    const text = 'Avant\nsearch_indicateurs({\n  query: "fraude"\n})\nAprès'
    expect(cleanPseudoCalls(text)).toBe('Avant\nAprès')
  })

  it("laisse intact un texte qui mentionne un outil sans l'appeler", () => {
    const text = "J'ai utilisé get_synthese_indicateur pour récupérer la fiche."
    expect(cleanPseudoCalls(text)).toBe(text)
  })

  it('couvre tous les outils du contrat, pas une liste recopiée', () => {
    expect(TOOL_NAMES.map((name) => cleanPseudoCalls(`${name}({"a": 1})`))).toEqual(
      TOOL_NAMES.map(() => ''),
    )
  })

  it('retire les séparateurs de fin sans exploser sur une longue suite', () => {
    const text = `Réponse${'\n---\n '.repeat(20000)}x`
    const started = performance.now()
    cleanPseudoCalls(text)
    expect(performance.now() - started).toBeLessThan(200)
    expect(cleanPseudoCalls('Réponse\n---\n\n---\n')).toBe('Réponse')
  })
})
