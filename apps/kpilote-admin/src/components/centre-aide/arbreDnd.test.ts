import type { ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'

import { aplatir, projeter, retirerDescendants } from './arbreDnd'

const art = (
  id: string,
  type: 'GROUPE' | 'PAGE',
  parentId: string | null,
  ordre: number,
): ArticleCentreAideApiModel => ({
  id,
  type,
  parentId,
  ordre,
  estPublie: true,
  estMasque: false,
  titre: id,
  titreAffiche: id,
  contenu: '',
  titreBrouillon: id,
  titreAfficheBrouillon: id,
  contenuBrouillon: '',
  createdAt: '2026-07-23T00:00:00.000Z',
  updatedAt: '2026-07-23T00:00:00.000Z',
  deletedAt: null,
})

// g1 (groupe) > [a, b] ; c à la racine
const articles = [
  art('g1', 'GROUPE', null, 0),
  art('a', 'PAGE', 'g1', 0),
  art('b', 'PAGE', 'g1', 1),
  art('c', 'PAGE', null, 1),
]

it('aplatit en DFS avec profondeur', () => {
  expect(aplatir(articles, new Set()).map((n) => [n.id, n.depth])).toEqual([
    ['g1', 0],
    ['a', 1],
    ['b', 1],
    ['c', 0],
  ])
})

it('masque les enfants d’un groupe replié', () => {
  expect(aplatir(articles, new Set(['g1'])).map((n) => n.id)).toEqual(['g1', 'c'])
})

it('retire les descendants d’un noeud', () => {
  const plat = aplatir(articles, new Set())
  expect(retirerDescendants(plat, 'g1').map((n) => n.id)).toEqual(['g1', 'c'])
})

it('projette « c » comme dernier enfant de g1 quand on l’indente sous b', () => {
  // On simule le drag de c sur la position de b, avec un décalage horizontal d'un cran.
  const plat = retirerDescendants(aplatir(articles, new Set()), 'c')
  const projection = projeter(plat, 'c', 'b', 20, 20)
  expect(projection.parentId).toBe('g1')
})

it('projette « a » à la racine quand on le désindente complètement', () => {
  const plat = retirerDescendants(aplatir(articles, new Set()), 'a')
  const projection = projeter(plat, 'a', 'g1', -40, 20)
  expect(projection.parentId).toBe(null)
  expect(projection.depth).toBe(0)
})

it('refuse de nicher sous une PAGE (reste au niveau frère)', () => {
  // Déplacer c juste après a (une PAGE) avec un gros décalage à droite : parent = g1, pas a.
  const plat = retirerDescendants(aplatir(articles, new Set()), 'c')
  const projection = projeter(plat, 'c', 'a', 200, 20)
  expect(projection.parentId).toBe('g1')
})
