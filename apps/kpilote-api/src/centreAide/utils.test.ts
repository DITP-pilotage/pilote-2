import { describe, expect, it } from 'vitest'

import { htmlToPlainText } from '@/centreAide/utils'

describe('htmlToPlainText', () => {
  it('strip les balises et normalise les espaces', () => {
    expect(htmlToPlainText('<p>Bonjour <strong>monde</strong></p>')).toBe('Bonjour monde')
  })

  it('sépare les blocs pour ne pas coller les mots', () => {
    expect(htmlToPlainText('<p>un</p><p>deux</p><ul><li>trois</li></ul>')).toBe('un deux trois')
  })

  it('conserve le titre des accordéons (data-title) pour la recherche', () => {
    expect(
      htmlToPlainText('<div data-type="accordion-item" data-title="Prérequis">contenu</div>'),
    ).toBe('Prérequis contenu')
  })

  it('décode les entités courantes', () => {
    expect(htmlToPlainText('<p>a&nbsp;&amp;&nbsp;b &lt;ok&gt;</p>')).toBe('a & b <ok>')
  })

  it('gère la chaîne vide', () => {
    expect(htmlToPlainText('')).toBe('')
  })
})
