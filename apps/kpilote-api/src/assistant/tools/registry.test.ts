import { NOMS_OUTILS } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import { resoudreOutils } from '@/assistant/tools/registry'

const requeteur = () => Promise.resolve(new Response('{}'))

describe('resoudreOutils', () => {
  it('expose treize outils pour la surface ask-libre', () => {
    expect(Object.keys(resoudreOutils('ask-libre', requeteur))).toHaveLength(13)
  })

  it('couvre exactement les noms déclarés dans le contrat partagé', () => {
    const noms = Object.keys(resoudreOutils('ask-libre', requeteur)).sort()
    expect(noms).toEqual([...NOMS_OUTILS].sort())
  })

  it('donne une description non vide à chaque outil', () => {
    const outils = resoudreOutils('ask-libre', requeteur)
    expect(Object.values(outils).every((outil) => (outil.description ?? '').length > 0)).toBe(true)
  })

  it("n'expose pas les routes que get_synthese_indicateur compose déjà", () => {
    const noms = Object.keys(resoudreOutils('ask-libre', requeteur))
    expect(noms).not.toContain('get_indicateur_taux_progression')
    expect(noms).not.toContain('get_indicateur_objectifs')
  })
})
