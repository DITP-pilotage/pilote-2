import { describe, expect, it } from 'vitest'
import {
  interpreterSelonSens,
  interpreterValeursExtremes,
} from '@/components/indicateurs/interpreterSelonSens'

describe('interpreterSelonSens', () => {
  it.each([
    { ecart: 3, sens: 'HAUSSE', attendu: 'favorable' },
    { ecart: -3, sens: 'HAUSSE', attendu: 'defavorable' },
    { ecart: 0, sens: 'HAUSSE', attendu: 'neutre' },
    { ecart: 3, sens: 'BAISSE', attendu: 'defavorable' },
    { ecart: 8 - 10, sens: 'BAISSE', attendu: 'favorable' }, // critère du ticket : 10 → 8
    { ecart: 0, sens: 'BAISSE', attendu: 'neutre' },
  ] as const)('$sens, écart $ecart → $attendu', ({ ecart, sens, attendu }) => {
    expect(interpreterSelonSens(ecart, sens)).toBe(attendu)
  })
})

describe('interpreterValeursExtremes', () => {
  it('interprète le maximum et le minimum selon le sens', () => {
    expect(interpreterValeursExtremes({ min: 4.1, max: 12.8 }, 'HAUSSE')).toEqual({
      max: 'favorable',
      min: 'defavorable',
    })
    expect(interpreterValeursExtremes({ min: 4.1, max: 12.8 }, 'BAISSE')).toEqual({
      max: 'defavorable',
      min: 'favorable',
    })
  })

  it("n'interprète pas un minimum égal au maximum (référentiel à un seul individu)", () => {
    expect(interpreterValeursExtremes({ min: 12.4, max: 12.4 }, 'BAISSE')).toEqual({
      max: 'neutre',
      min: 'neutre',
    })
  })
})
