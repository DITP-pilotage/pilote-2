import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { perimetreInput, TOOL_NAMES, TOOLS } from './tools'

describe('TOOLS', () => {
  it('déclare un libellé et un kind pour chaque outil', () => {
    expect(
      TOOL_NAMES.filter(
        (name) =>
          TOOLS[name].label.length === 0 || !['source', 'interface'].includes(TOOLS[name].kind),
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
