import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  inputComposeVueSchema,
  inputIdIndicateurSchema,
  inputRechercheSchema,
  LIBELLES_OUTILS,
  NOMS_OUTILS,
  type KpiloteUITools,
  type NomOutil,
} from './tools'

describe('NOMS_OUTILS', () => {
  it('décrit treize outils aux noms uniques', () => {
    expect(NOMS_OUTILS).toHaveLength(13)
    expect(new Set(NOMS_OUTILS).size).toBe(13)
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

describe('compose_vue', () => {
  it('exige au moins un territoire : sans lui, aucune donnée n’est lisible', () => {
    const base = { demande: 'montre-moi la progression', indicateurs: ['IND-1'] }
    expect(inputComposeVueSchema.safeParse(base).success).toBe(false)
    expect(inputComposeVueSchema.safeParse({ ...base, individus: ['DEPT-84'] }).success).toBe(true)
  })

  it('borne le contexte pour ne pas noyer le sous-agent', () => {
    expect(
      inputComposeVueSchema.safeParse({
        demande: 'tout',
        individus: ['DEPT-84'],
        indicateurs: Array.from({ length: 9 }, (_, index) => `IND-${index + 1}`),
      }).success,
    ).toBe(false)
  })
})
