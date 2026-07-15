import { describe, expect, test } from 'vitest'
import { validationErrorApiModelSchema } from './error'

describe('error schemas', () => {
  test('valide un VALIDATION_ERROR structuré', () => {
    const parsed = validationErrorApiModelSchema.safeParse({
      code: 'VALIDATION_ERROR',
      message: 'Les données fournies sont invalides',
      details: {
        issues: [
          { path: ['items', 2, 'date'], message: 'Date calendaire invalide', code: 'custom' },
        ],
      },
    })
    expect(parsed.success).toBe(true)
  })
})
