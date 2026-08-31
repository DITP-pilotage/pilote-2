import { describe, expect, it } from 'vitest'

import { COLONNES_PAR_LARGEUR, TYPES_VIGNETTE, vignetteSchema, vueSchema } from './vignettes'

const vignetteValide = {
  type: 'vignette_avancement_indicateur',
  indicateurId: 'IND-1',
  individuId: 'DEPT-84',
}

describe('vignetteSchema', () => {
  it('accepte une vignette dont les références sont bien formées', () => {
    const resultat = vignetteSchema.safeParse(vignetteValide)
    expect(resultat.success).toBe(true)
    expect(resultat.success && resultat.data.largeur).toBe('tiers')
  })

  it('rejette un identifiant incohérent avec le type de référence attendu', () => {
    expect(vignetteSchema.safeParse({ ...vignetteValide, indicateurId: 'COL-1' }).success).toBe(
      false,
    )
  })

  it('exige le territoire : une donnée d’indicateur est toujours indexée par individu', () => {
    const { individuId: _individuId, ...sansTerritoire } = vignetteValide
    expect(vignetteSchema.safeParse(sansTerritoire).success).toBe(false)
  })

  it('rejette un type de vignette hors catalogue', () => {
    expect(
      vignetteSchema.safeParse({ ...vignetteValide, type: 'vignette_camembert' }).success,
    ).toBe(false)
  })

  it('décrit huit vignettes', () => {
    expect(TYPES_VIGNETTE).toHaveLength(8)
    expect(new Set(TYPES_VIGNETTE).size).toBe(8)
  })

  it('n’expose aucun enum qui changerait la nature de ce qui est affiché', () => {
    // Seule `largeur` est un enum, et elle ne décrit qu'un périmètre d'affichage.
    for (const option of vignetteSchema.options) {
      const clesEnum = Object.entries(option.shape)
        .filter(([cle]) => cle !== 'type')
        .filter(([, valeur]) => {
          const def = (valeur as unknown as { def?: { innerType?: unknown } }).def
          const cible = def?.innerType ?? valeur
          return 'options' in (cible as object)
        })
        .map(([cle]) => cle)
      expect(clesEnum).toEqual(['largeur'])
    }
  })
})

describe('vueSchema', () => {
  it('accepte une vue avec un titre et des vignettes', () => {
    expect(
      vueSchema.safeParse({ titre: 'Fraude fiscale', vignettes: [vignetteValide] }).success,
    ).toBe(true)
  })

  it('rejette une vue vide', () => {
    expect(vueSchema.safeParse({ titre: 'Vide', vignettes: [] }).success).toBe(false)
  })

  it('borne une vue à douze vignettes', () => {
    const vignettes = Array.from({ length: 13 }, () => vignetteValide)
    expect(vueSchema.safeParse({ titre: 'Trop', vignettes }).success).toBe(false)
  })
})

describe('COLONNES_PAR_LARGEUR', () => {
  it('découpe une grille de six colonnes', () => {
    expect(COLONNES_PAR_LARGEUR).toEqual({ tiers: 2, moitie: 3, pleine: 6 })
  })
})
