import { describe, expect, it } from 'vitest'

import { htmlToPlainText } from '@/commentaire/utils'

describe('htmlToPlainText', () => {
  it('strip les balises et normalise les espaces', () => {
    expect(htmlToPlainText('<p>Bonjour <strong>monde</strong></p>')).toBe('Bonjour monde')
  })

  it('remplace les &nbsp; et trim', () => {
    expect(htmlToPlainText('<p>a&nbsp;&nbsp;b</p>  ')).toBe('a b')
  })

  it('gère la chaîne vide', () => {
    expect(htmlToPlainText('')).toBe('')
  })
})
