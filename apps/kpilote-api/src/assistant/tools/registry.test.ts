import { TOOL_NAMES } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import { resolveTools } from '@/assistant/tools/registry'

const requeteur = () => Promise.resolve(new Response('{}'))

describe('resolveTools', () => {
  it('expose treize outils pour la surface ask-libre', () => {
    expect(Object.keys(resolveTools('ask-libre', requeteur, 'openweight-large'))).toHaveLength(13)
  })

  it('couvre exactement les noms déclarés dans le contrat partagé', () => {
    const noms = Object.keys(resolveTools('ask-libre', requeteur, 'openweight-large')).sort()
    expect(noms).toEqual([...TOOL_NAMES].sort())
  })

  it('donne une description non vide à chaque outil', () => {
    const outils = resolveTools('ask-libre', requeteur, 'openweight-large')
    expect(Object.values(outils).every((outil) => (outil.description ?? '').length > 0)).toBe(true)
  })

  it("n'expose pas les routes que get_synthese_indicateur compose déjà", () => {
    const noms = Object.keys(resolveTools('ask-libre', requeteur, 'openweight-large'))
    expect(noms).not.toContain('get_indicateur_taux_progression')
    expect(noms).not.toContain('get_indicateur_objectifs')
  })
})
