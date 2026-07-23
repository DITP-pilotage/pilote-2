import type { ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'

import { aDesModificationsNonPubliees, construireArbre } from './arbre'

const article = (over: Partial<ArticleCentreAideApiModel>): ArticleCentreAideApiModel => ({
  id: 'x',
  type: 'PAGE',
  parentId: null,
  ordre: 0,
  estPublie: true,
  estMasque: false,
  titre: 't',
  titreAffiche: 't',
  contenu: 'c',
  titreBrouillon: 't',
  titreAfficheBrouillon: 't',
  contenuBrouillon: 'c',
  createdAt: '2026-07-23T00:00:00.000Z',
  updatedAt: '2026-07-23T00:00:00.000Z',
  ...over,
})

it('reconstruit l’arbre et trie les frères par ordre', () => {
  const arbre = construireArbre([
    article({ id: 'racine', type: 'GROUPE', ordre: 0 }),
    article({ id: 'b', parentId: 'racine', ordre: 1 }),
    article({ id: 'a', parentId: 'racine', ordre: 0 }),
  ])
  expect(arbre).toHaveLength(1)
  expect(arbre[0]!.id).toBe('racine')
  expect(arbre[0]!.enfants.map((noeud) => noeud.id)).toEqual(['a', 'b'])
})

it('détecte les modifications non publiées', () => {
  expect(aDesModificationsNonPubliees(article({ estPublie: false }))).toBe(true)
  expect(
    aDesModificationsNonPubliees(article({ estPublie: true, contenuBrouillon: 'c', contenu: 'c' })),
  ).toBe(false)
  expect(
    aDesModificationsNonPubliees(
      article({ estPublie: true, contenuBrouillon: 'neuf', contenu: 'c' }),
    ),
  ).toBe(true)
})
