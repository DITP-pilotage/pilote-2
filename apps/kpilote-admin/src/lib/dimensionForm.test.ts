import { describe, expect, it } from 'vitest'

import { dimensionFormError } from './dimensionForm'

const existing = [{ cle: 'conversation_id', slot: 3, nom: 'Conversation' }]

describe('dimensionFormError', () => {
  it('accepte une nouvelle clé valide', () => {
    expect(
      dimensionFormError({ cle: 'llm_call_id', slot: '4', nom: 'Appel' }, existing, null),
    ).toBeNull()
  })

  it('refuse d’ajouter une clé déjà associée, au lieu de l’écraser', () => {
    expect(
      dimensionFormError({ cle: 'conversation_id', slot: '5', nom: 'Autre' }, existing, null),
    ).toBe('« conversation_id » est déjà associée à la dimension 3 : modifiez-la dans le tableau.')
  })

  it('laisse modifier la clé en cours d’édition', () => {
    expect(
      dimensionFormError(
        { cle: 'conversation_id', slot: '5', nom: 'Conversation' },
        existing,
        'conversation_id',
      ),
    ).toBeNull()
  })

  it('refuse une clé, un numéro ou un libellé invalides', () => {
    expect(dimensionFormError({ cle: 'Cle', slot: '1', nom: 'X' }, [], null)).not.toBeNull()
    expect(dimensionFormError({ cle: 'cle', slot: '0', nom: 'X' }, [], null)).not.toBeNull()
    expect(dimensionFormError({ cle: 'cle', slot: '1.5', nom: 'X' }, [], null)).not.toBeNull()
    expect(dimensionFormError({ cle: 'cle', slot: '1', nom: ' ' }, [], null)).not.toBeNull()
  })
})
