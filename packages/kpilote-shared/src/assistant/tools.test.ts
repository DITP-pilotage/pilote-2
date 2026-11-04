import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { perimetreInput, searchInput, TOOL_NAMES, TOOLS } from './tools'

describe('TOOLS', () => {
  it('déclare un libellé et un kind pour chaque outil', () => {
    expect(
      TOOL_NAMES.filter(
        (name) =>
          TOOLS[name].label.length === 0 ||
          !['source', 'interface', 'help'].includes(TOOLS[name].kind),
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
