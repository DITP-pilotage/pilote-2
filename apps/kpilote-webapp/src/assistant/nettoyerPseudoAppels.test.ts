import { describe, expect, it } from 'vitest'

import { nettoyerPseudoAppels } from './nettoyerPseudoAppels'

describe('nettoyerPseudoAppels', () => {
  it('supprime un appel écrit en pseudo-code sur une ligne', () => {
    expect(nettoyerPseudoAppels('Voici :\nget_indicateur({"id": "IND-1"})\nRésultat.')).toBe(
      'Voici :\nRésultat.',
    )
  })

  it('supprime un appel étalé sur plusieurs lignes', () => {
    const texte = 'Avant\nsearch_indicateurs({\n  requete: "fraude"\n})\nAprès'
    expect(nettoyerPseudoAppels(texte)).toBe('Avant\nAprès')
  })

  it('laisse intact un texte qui mentionne un outil sans l’appeler', () => {
    const texte = "J'ai utilisé get_indicateur pour récupérer la fiche."
    expect(nettoyerPseudoAppels(texte)).toBe(texte)
  })

  it('couvre tous les outils du contrat, pas une liste recopiée', () => {
    expect(nettoyerPseudoAppels('get_referentiel_individus({"id": "REF-A"})')).toBe('')
  })
})
