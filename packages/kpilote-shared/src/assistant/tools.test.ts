import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  inputIdIndicateurSchema,
  inputRechercheSchema,
  LIBELLES_OUTILS,
  NOMS_OUTILS,
  type KpiloteUITools,
  type NomOutil,
} from './tools'

describe('NOMS_OUTILS', () => {
  it('décrit douze outils aux noms uniques', () => {
    expect(NOMS_OUTILS).toHaveLength(12)
    expect(new Set(NOMS_OUTILS).size).toBe(12)
  })

  it('porte un libellé pour chaque outil', () => {
    expect(NOMS_OUTILS.every((nom) => (LIBELLES_OUTILS[nom] ?? '').length > 0)).toBe(true)
  })

  it("n'expose aucun libellé orphelin", () => {
    expect(Object.keys(LIBELLES_OUTILS).sort()).toEqual([...NOMS_OUTILS].sort())
  })

  it('déclare une entrée KpiloteUITools par outil — sans quoi le front perd le typage', () => {
    expectTypeOf<keyof KpiloteUITools>().toEqualTypeOf<NomOutil>()
  })
})

describe('schémas d’entrée', () => {
  it('rejette un identifiant indicateur mal formé', () => {
    expect(inputIdIndicateurSchema.safeParse({ id: 'IND-quarante-deux' }).success).toBe(false)
    expect(inputIdIndicateurSchema.safeParse({ id: 'IND-42' }).success).toBe(true)
  })

  it('exige une requête de recherche non vide', () => {
    expect(inputRechercheSchema.safeParse({ requete: '' }).success).toBe(false)
    expect(inputRechercheSchema.safeParse({ requete: 'fraude fiscale' }).success).toBe(true)
  })
})
