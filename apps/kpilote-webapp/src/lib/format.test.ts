import { describe, expect, it } from 'vitest'

import { formatMoisAnneeLongFr } from '@/lib/format'

describe('formatMoisAnneeLongFr', () => {
  it('formate une date ISO en mois-année long fr-FR', () => {
    expect(formatMoisAnneeLongFr('2024-12-01')).toBe('décembre 2024')
    expect(formatMoisAnneeLongFr('2025-06-15')).toBe('juin 2025')
  })
})
