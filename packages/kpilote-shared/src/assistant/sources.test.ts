import { describe, expect, it } from 'vitest'

import { extraireReferences } from './sources'

describe('extraireReferences', () => {
  it('extrait un publicId indicateur depuis une clé publicId', () => {
    expect(extraireReferences({ publicId: 'IND-42', nom: 'Fraude fiscale' })).toEqual([
      { type: 'indicateur', publicId: 'IND-42' },
    ])
  })

  it('extrait depuis les clés typées imbriquées', () => {
    const sortie = { items: [{ indicateurId: 'IND-7' }, { collectionId: 'COL-3' }] }
    expect(extraireReferences(sortie)).toEqual([
      { type: 'indicateur', publicId: 'IND-7' },
      { type: 'collection', publicId: 'COL-3' },
    ])
  })

  it('ignore les valeurs qui ressemblent à un identifiant sous une clé non identifiante', () => {
    const sortie = { visibilite: 'PUBLIC', actions: ['READ', 'WRITE_DATA'], meteo: 'SOLEIL' }
    expect(extraireReferences(sortie)).toEqual([])
  })

  it('ignore une valeur mal formée sous une clé identifiante', () => {
    expect(extraireReferences({ indicateurId: 'quarante-deux' })).toEqual([])
  })

  it('dédoublonne sur le couple type + publicId', () => {
    const sortie = [{ publicId: 'IND-42' }, { indicateurId: 'IND-42' }]
    expect(extraireReferences(sortie)).toEqual([{ type: 'indicateur', publicId: 'IND-42' }])
  })

  it("résout le type d'un individu par sa clé, faute de préfixe discriminant", () => {
    expect(extraireReferences({ individuId: 'DEPT-84' })).toEqual([
      { type: 'individu', publicId: 'DEPT-84' },
    ])
  })

  it('reconnaît un modèle d’API d’individu, dont l’identifiant vit sous la clé id', () => {
    const individu = { id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' }
    expect(extraireReferences(individu)).toEqual([
      { type: 'individu', publicId: 'DEPT-84' },
      { type: 'referentiel', publicId: 'REF-DEPT' },
    ])
  })

  it('ne prend pas un id non préfixé pour un individu hors de ce contexte', () => {
    expect(extraireReferences({ id: 'PUBLIC', nom: 'Quelque chose' })).toEqual([])
  })

  it('renvoie un tableau vide sur une valeur scalaire ou nulle', () => {
    expect(extraireReferences('IND-42')).toEqual([])
    expect(extraireReferences(null)).toEqual([])
  })
})
