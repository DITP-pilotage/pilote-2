import { describe, expect, it } from 'vitest'

import { flattenLatex } from './flattenLatex'

describe('flattenLatex', () => {
  it('aplatit une moyenne écrite en LaTeX en calcul lisible', () => {
    expect(flattenLatex('\\[ \\frac{66,64 + 68,83 + 66,64}{3} \\;\\approx\\; 67,37 \\]')).toBe(
      ' (66,64 + 68,83 + 66,64) / 3 ≈ 67,37 ',
    )
  })

  it('retire les délimiteurs de bloc et de ligne', () => {
    expect(flattenLatex('\\[ 3 \\times 4 \\] et \\( x \\leq 5 \\)')).toBe(' 3 × 4 et x ≤ 5 ')
  })

  it('ne touche pas à un texte sans commande', () => {
    const text = 'Moyenne : 67,37 % (calculée sur 3 indicateurs).'
    expect(flattenLatex(text)).toBe(text)
  })
})
