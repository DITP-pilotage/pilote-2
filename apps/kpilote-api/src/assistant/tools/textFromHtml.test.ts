import { describe, expect, it } from 'vitest'

import { textFromHtml } from '@/assistant/tools/textFromHtml'

describe('textFromHtml', () => {
  it('convertit le HTML saisi en texte', () => {
    expect(textFromHtml('<p>Un</p><p>Deux<br>Trois</p>')).toBe('Un\n\nDeux\nTrois')
  })

  it('décode les entités et marque les listes', () => {
    expect(textFromHtml('<ul><li>A &amp; B</li><li>C&nbsp;D</li></ul>')).toBe('• A & B\n• C D')
  })
})
