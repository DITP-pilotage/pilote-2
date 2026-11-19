import { describe, expect, it } from 'vitest'

import {
  checkArticleSupprimable,
  checkParentEstUnGroupe,
  checkSansDeplacementCirculaire,
} from '@/centreAide/rules'

describe.concurrent('checkArticleSupprimable', () => {
  it('accepte un article en corbeille', () => {
    expect(checkArticleSupprimable({ statut: 'CORBEILLE' }).isOk()).toBe(true)
  })

  it('rejette un article actif', () => {
    const result = checkArticleSupprimable({ statut: 'ACTIF' })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'ARTICLE_HORS_CORBEILLE' })
  })
})

describe.concurrent('checkParentEstUnGroupe', () => {
  it('accepte la racine', () => {
    expect(checkParentEstUnGroupe({ parentId: null, parent: undefined }).isOk()).toBe(true)
  })

  it('accepte un groupe actif', () => {
    expect(checkParentEstUnGroupe({ parentId: 'g', parent: { type: 'GROUPE' } }).isOk()).toBe(true)
  })

  it('rejette un parent introuvable parmi les articles actifs', () => {
    const result = checkParentEstUnGroupe({ parentId: 'g', parent: undefined })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'PARENT_INTROUVABLE' })
  })

  it('rejette un parent qui n’est pas un groupe', () => {
    const result = checkParentEstUnGroupe({ parentId: 'a', parent: { type: 'PAGE' } })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'PARENT_PAS_UN_GROUPE' })
  })
})

describe.concurrent('checkSansDeplacementCirculaire', () => {
  it('accepte un parent qui ne descend pas de l’article', () => {
    const result = checkSansDeplacementCirculaire({
      articleId: 'a',
      cheminDuParent: ['g', 'racine'],
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette l’article comme son propre parent', () => {
    const result = checkSansDeplacementCirculaire({ articleId: 'a', cheminDuParent: ['a'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'DEPLACEMENT_CIRCULAIRE' })
  })

  it('rejette un parent qui descend de l’article', () => {
    const result = checkSansDeplacementCirculaire({ articleId: 'a', cheminDuParent: ['g', 'a'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'DEPLACEMENT_CIRCULAIRE' })
  })
})
