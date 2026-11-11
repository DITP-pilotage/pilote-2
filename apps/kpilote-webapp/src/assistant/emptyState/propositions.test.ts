import { describe, expect, it } from 'vitest'

import { propositionsFor } from './propositions'

const ids = (page: Parameters<typeof propositionsFor>[0]) =>
  propositionsFor(page).map((proposition) => proposition.id)

describe('propositionsFor', () => {
  it('propose sur la page d’un indicateur ce qu’on fait d’un indicateur', () => {
    expect(ids({ indicateurId: 'ind-047' })).toEqual([
      'synthese_indicateur',
      'dashboard_indicateur',
      'comparaison_indicateur',
      'calcul_indicateur',
    ])
  })

  it('propose sur la page d’une collection ce qu’on fait d’une collection', () => {
    expect(ids({ collectionId: 'sante' })).toEqual([
      'synthese_collection',
      'ecarts_collection',
      'dashboard_collection',
      'comparaison_collection',
    ])
  })

  it('propose ailleurs de trouver, synthétiser, comparer ou se faire aider', () => {
    expect(ids(undefined)).toEqual(['trouver', 'synthese', 'comparaison', 'aide'])
    expect(ids({})).toEqual(['trouver', 'synthese', 'comparaison', 'aide'])
  })

  it('désigne l’entité affichée sans en répéter l’identifiant', () => {
    const [synthese] = propositionsFor({ indicateurId: 'ind-047' })
    expect(synthese?.message).toBe('Fais la synthèse de cet indicateur.')
    expect(synthese?.message).not.toContain('ind-047')
  })

  it('reprend l’individu sélectionné', () => {
    const [synthese] = propositionsFor({ indicateurId: 'ind-047', individuId: 'dept-22' })
    expect(synthese?.message).toBe('Fais la synthèse de cet indicateur sur l’individu sélectionné.')
  })

  it('pré-remplit ce qui demande une précision, envoie le reste', () => {
    const modes = Object.fromEntries(
      propositionsFor({ indicateurId: 'ind-047' }).map((p) => [p.id, p.mode]),
    )
    expect(modes).toEqual({
      synthese_indicateur: 'send',
      dashboard_indicateur: 'send',
      comparaison_indicateur: 'fill',
      calcul_indicateur: 'send',
    })
  })
})
