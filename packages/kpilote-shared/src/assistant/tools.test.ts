import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  composeViewInputSchema,
  indicateurIdInputSchema,
  searchInputSchema,
  TOOL_LABELS,
  TOOL_NAMES,
  type KpiloteUITools,
  type ToolName,
} from './tools'

describe('TOOL_NAMES', () => {
  it('décrit treize outils aux noms uniques', () => {
    expect(TOOL_NAMES).toHaveLength(13)
    expect(new Set(TOOL_NAMES).size).toBe(13)
  })

  it('porte un libellé pour chaque outil', () => {
    expect(TOOL_NAMES.every((name) => (TOOL_LABELS[name] ?? '').length > 0)).toBe(true)
  })

  it("n'expose aucun libellé orphelin", () => {
    expect(Object.keys(TOOL_LABELS).sort()).toEqual([...TOOL_NAMES].sort())
  })

  it('déclare une entrée KpiloteUITools par outil — sans quoi le front perd le typage', () => {
    expectTypeOf<keyof KpiloteUITools>().toEqualTypeOf<ToolName>()
  })
})

describe("schémas d'entrée", () => {
  it('rejette un identifiant indicateur mal formé', () => {
    expect(indicateurIdInputSchema.safeParse({ id: 'IND-quarante-deux' }).success).toBe(false)
    expect(indicateurIdInputSchema.safeParse({ id: 'IND-42' }).success).toBe(true)
  })

  it('exige une requête de recherche non vide', () => {
    expect(searchInputSchema.safeParse({ query: '' }).success).toBe(false)
    expect(searchInputSchema.safeParse({ query: 'fraude fiscale' }).success).toBe(true)
  })
})

describe('compose_view', () => {
  it("exige au moins un territoire : sans lui, aucune donnée n'est lisible", () => {
    const base = { request: 'montre-moi la progression', indicateurs: ['IND-1'] }
    expect(composeViewInputSchema.safeParse(base).success).toBe(false)
    expect(composeViewInputSchema.safeParse({ ...base, individus: ['DEPT-84'] }).success).toBe(true)
  })

  it('borne le contexte pour ne pas noyer le sous-agent', () => {
    expect(
      composeViewInputSchema.safeParse({
        request: 'tout',
        individus: ['DEPT-84'],
        indicateurs: Array.from({ length: 9 }, (_, index) => `IND-${index + 1}`),
      }).success,
    ).toBe(false)
  })
})
