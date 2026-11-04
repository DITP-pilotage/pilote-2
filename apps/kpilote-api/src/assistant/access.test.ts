import { describe, expect, it } from 'vitest'

import { checkAssistantAccess } from '@/assistant/access'
import { ApiKeyRole } from '@/generated/prisma/enums'

describe('checkAssistantAccess', () => {
  it('ouvre l’assistant aux utilisateurs', () => {
    expect(
      checkAssistantAccess({
        kind: 'user',
        user: { id: 'u', email: 'a@b.fr', prenom: 'A', nom: 'B' },
      }),
    ).toBe(true)
  })

  it('le refuse aux clés API', () => {
    expect(
      checkAssistantAccess({
        kind: 'apiKey',
        apiKey: { id: 'k', label: 'cle', role: ApiKeyRole.ADMIN },
      }),
    ).toBe(false)
  })
})
