import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { perimetreInput, searchInput, TOOL_NAMES, TOOLS } from './tools'

describe('TOOLS', () => {
  it('déclare un libellé et un kind pour chaque outil', () => {
    expect(
      TOOL_NAMES.filter(
        (name) =>
          TOOLS[name].label.length === 0 ||
          !['source', 'interface', 'help', 'report', 'dashboard'].includes(TOOLS[name].kind),
      ),
    ).toEqual([])
  })

  it("expose des schémas d'entrée sans const, que gpt-oss ignore", () => {
    const schemas = [...TOOL_NAMES.map((name) => TOOLS[name].input), perimetreInput]
    const withConst = schemas.filter((schema) =>
      JSON.stringify(z.toJSONSchema(schema, { io: 'input' })).includes('"const"'),
    )
    expect(withConst).toEqual([])
  })
})

describe('searchInput', () => {
  it('refuse une requête démesurée', () => {
    expect(searchInput.safeParse({ query: 'a'.repeat(501) }).success).toBe(false)
  })
})

describe('consult_centre_aide', () => {
  it('est un outil d’aide, rendu à part des sources de données', () => {
    expect(TOOLS.consult_centre_aide.kind).toBe('help')
  })
})

describe('encarts', () => {
  it('write_synthese et write_comparaison sont des rédactions, hors des sources', () => {
    expect([TOOLS.write_synthese.kind, TOOLS.write_comparaison.kind]).toEqual(['report', 'report'])
  })

  it('une comparaison porte sur un sujet et un périmètre', () => {
    expect(
      TOOLS.write_comparaison.input.safeParse({
        sujet: { type: 'INDICATEUR', indicateurId: 'IND-1' },
        perimetre: { type: 'SELECTION', individuIds: ['DEPT-01', 'DEPT-02'] },
      }).success,
    ).toBe(true)
  })
})

describe('create_dashboard', () => {
  it('compose un tableau de bord, hors des sources', () => {
    expect(TOOLS.create_dashboard.kind).toBe('dashboard')
  })
})
