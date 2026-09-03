import { describe, expect, it } from 'vitest'

import { extractReferences } from './sources'

describe('extractReferences', () => {
  it('extrait un publicId indicateur depuis une clé publicId', () => {
    expect(extractReferences({ publicId: 'IND-42', nom: 'Fraude fiscale' })).toEqual([
      { type: 'indicateur', publicId: 'IND-42' },
    ])
  })

  it('extrait depuis les clés typées imbriquées', () => {
    const output = { items: [{ indicateurId: 'IND-7' }, { collectionId: 'COL-3' }] }
    expect(extractReferences(output)).toEqual([
      { type: 'indicateur', publicId: 'IND-7' },
      { type: 'collection', publicId: 'COL-3' },
    ])
  })

  it('ignore les valeurs qui ressemblent à un identifiant sous une clé non identifiante', () => {
    const output = { visibilite: 'PUBLIC', actions: ['READ', 'WRITE_DATA'], meteo: 'SOLEIL' }
    expect(extractReferences(output)).toEqual([])
  })

  it('ignore une valeur mal formée sous une clé identifiante', () => {
    expect(extractReferences({ indicateurId: 'quarante-deux' })).toEqual([])
  })

  it('dédoublonne sur le couple type + publicId', () => {
    const output = [{ publicId: 'IND-42' }, { indicateurId: 'IND-42' }]
    expect(extractReferences(output)).toEqual([{ type: 'indicateur', publicId: 'IND-42' }])
  })

  it("résout le type d'un individu par sa clé, faute de préfixe discriminant", () => {
    expect(extractReferences({ individuId: 'DEPT-84' })).toEqual([
      { type: 'individu', publicId: 'DEPT-84' },
    ])
  })

  it("reconnaît un modèle d'API d'individu, dont l'identifiant vit sous la clé id", () => {
    const individu = { id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' }
    expect(extractReferences(individu)).toEqual([
      { type: 'individu', publicId: 'DEPT-84' },
      { type: 'referentiel', publicId: 'REF-DEPT' },
    ])
  })

  it('ne prend pas un id non préfixé pour un individu hors de ce contexte', () => {
    expect(extractReferences({ id: 'PUBLIC', nom: 'Quelque chose' })).toEqual([])
  })

  it('renvoie un tableau vide sur une valeur scalaire ou nulle', () => {
    expect(extractReferences('IND-42')).toEqual([])
    expect(extractReferences(null)).toEqual([])
  })
})
