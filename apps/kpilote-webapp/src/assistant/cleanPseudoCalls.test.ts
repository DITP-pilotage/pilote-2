import { describe, expect, it } from 'vitest'

import { cleanPseudoCalls } from './cleanPseudoCalls'

describe('cleanPseudoCalls', () => {
  it('supprime un appel écrit en pseudo-code sur une ligne', () => {
    expect(cleanPseudoCalls('Voici :\nget_indicateur({"id": "IND-1"})\nRésultat.')).toBe(
      'Voici :\nRésultat.',
    )
  })

  it('supprime un appel étalé sur plusieurs lignes', () => {
    const text = 'Avant\nsearch_indicateurs({\n  query: "fraude"\n})\nAprès'
    expect(cleanPseudoCalls(text)).toBe('Avant\nAprès')
  })

  it("laisse intact un texte qui mentionne un outil sans l'appeler", () => {
    const text = "J'ai utilisé get_indicateur pour récupérer la fiche."
    expect(cleanPseudoCalls(text)).toBe(text)
  })

  it('couvre tous les outils du contrat, pas une liste recopiée', () => {
    expect(cleanPseudoCalls('get_referentiel_individus({"id": "REF-A"})')).toBe('')
  })
})
