import { describe, expect, it } from 'vitest'

import { COLUMNS_BY_WIDTH, TILE_TYPES, tileSchema, viewSchema } from './tiles'

const validTile = {
  type: 'tile_avancement_indicateur',
  indicateurId: 'IND-1',
  individuId: 'DEPT-84',
}

describe('tileSchema', () => {
  it('accepte une tuile dont les références sont bien formées', () => {
    const resultat = tileSchema.safeParse(validTile)
    expect(resultat.success).toBe(true)
    expect(resultat.success && resultat.data.width).toBe('third')
  })

  it('rejette un identifiant incohérent avec le type de référence attendu', () => {
    expect(tileSchema.safeParse({ ...validTile, indicateurId: 'COL-1' }).success).toBe(false)
  })

  it("exige le territoire : une donnée d'indicateur est toujours indexée par individu", () => {
    const { individuId: _individuId, ...withoutTerritoire } = validTile
    expect(tileSchema.safeParse(withoutTerritoire).success).toBe(false)
  })

  it('rejette un type de tuile hors catalogue', () => {
    expect(tileSchema.safeParse({ ...validTile, type: 'tile_camembert' }).success).toBe(false)
  })

  it('décrit huit tuiles', () => {
    expect(TILE_TYPES).toHaveLength(8)
    expect(new Set(TILE_TYPES).size).toBe(8)
  })

  it("n'expose aucun enum qui changerait la nature de ce qui est affiché", () => {
    // Seule `width` est un enum, et elle ne décrit qu'un périmètre d'affichage.
    for (const option of tileSchema.options) {
      const enumKeys = Object.entries(option.shape)
        .filter(([key]) => key !== 'type')
        .filter(([, value]) => {
          const def = (value as unknown as { def?: { innerType?: unknown } }).def
          const target = def?.innerType ?? value
          return 'options' in (target as object)
        })
        .map(([key]) => key)
      expect(enumKeys).toEqual(['width'])
    }
  })
})

describe('viewSchema', () => {
  it('accepte une vue avec un titre et des tuiles', () => {
    expect(viewSchema.safeParse({ title: 'Fraude fiscale', tiles: [validTile] }).success).toBe(true)
  })

  it('rejette une vue vide', () => {
    expect(viewSchema.safeParse({ title: 'Vide', tiles: [] }).success).toBe(false)
  })

  it('borne une vue à douze tuiles', () => {
    const tiles = Array.from({ length: 13 }, () => validTile)
    expect(viewSchema.safeParse({ title: 'Trop', tiles }).success).toBe(false)
  })
})

describe('COLUMNS_BY_WIDTH', () => {
  it('découpe une grille de six colonnes', () => {
    expect(COLUMNS_BY_WIDTH).toEqual({ third: 2, half: 3, full: 6 })
  })
})
