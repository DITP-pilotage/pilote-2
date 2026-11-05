import { describe, expect, it } from 'vitest'

import { appendTranscript } from './transcript'

describe('appendTranscript', () => {
  it('remplit un champ vide', () => {
    expect(appendTranscript('', ' Quelle est la tendance ')).toBe('Quelle est la tendance')
  })

  it('ajoute à la suite, séparé d’une espace', () => {
    expect(appendTranscript('Quelle est', 'la tendance')).toBe('Quelle est la tendance')
    expect(appendTranscript('Quelle est ', ' la tendance')).toBe('Quelle est la tendance')
  })

  it('ignore une transcription vide', () => {
    expect(appendTranscript('Quelle est', '  ')).toBe('Quelle est')
  })
})
