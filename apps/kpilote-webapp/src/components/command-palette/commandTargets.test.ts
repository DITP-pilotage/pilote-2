import { describe, expect, it } from 'vitest'

import { actionTypeFromActionId, targetTypeFromCommandId } from './commandTargets'

describe('targetTypeFromCommandId', () => {
  it.each([
    ['indicateur:IND-506', 'indicateur'],
    ['indicateur:IND-506:metadonnees', 'indicateur'],
    ['collection:COL-001', 'collection'],
    ['nav:accueil', 'page'],
    ['centre-aide:article-1', 'article'],
    ['centre-aide-entry', 'article'],
    ['recent:indicateur:IND-506', 'indicateur'],
    ['recent:collection:COL-001', 'collection'],
    ['recent:article:art-1', 'article'],
  ])('%s cible un %s', (id, cible) => {
    expect(targetTypeFromCommandId(id)).toBe(cible)
  })
})

describe('actionTypeFromActionId', () => {
  it("prend le troisième segment de l'identifiant", () => {
    expect(actionTypeFromActionId('indicateur:IND-506:metadonnees')).toBe('metadonnees')
    expect(actionTypeFromActionId('collection:COL-001:gouvernance')).toBe('gouvernance')
  })

  it('ne casse pas sur un identifiant sans troisième segment', () => {
    expect(actionTypeFromActionId('nav:accueil')).toBe('inconnue')
  })
})
