import { describe, expect, it } from 'vitest'

import { toUtilisateurApiModel } from '@/utilisateur/utils'

const baseRow = (identites: Array<{ provider: 'proconnect' | 'keycloak' }> = []) => ({
  id: '00000000-0000-0000-0000-000000000010',
  email: 'jane.doe@example.gouv.fr',
  nom: 'Doe',
  prenom: 'Jane',
  service: 'DITP',
  fonction: 'Agent',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-06-01T00:00:00.000Z'),
  identites: identites.map((i) => ({
    provider: i.provider,
    providerSub: `sub-${i.provider}`,
    utilisateurId: '00000000-0000-0000-0000-000000000010',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
  })),
})

describe('toUtilisateurApiModel', () => {
  it('utilisateur sans identité → status=en_attente, providers=[]', () => {
    const model = toUtilisateurApiModel(baseRow([]))
    expect(model.status).toBe('en_attente')
    expect(model.providers).toEqual([])
    expect(model.email).toBe('jane.doe@example.gouv.fr')
    expect(model.createdAt).toBe('2024-01-01T00:00:00Z')
    expect(model.updatedAt).toBe('2024-06-01T00:00:00Z')
  })

  it('une identité proconnect → status=actif, providers=[proconnect]', () => {
    const model = toUtilisateurApiModel(baseRow([{ provider: 'proconnect' }]))
    expect(model.status).toBe('actif')
    expect(model.providers).toEqual(['proconnect'])
  })

  it('deux identités → providers ordre stable proconnect avant keycloak', () => {
    const model = toUtilisateurApiModel(
      baseRow([{ provider: 'keycloak' }, { provider: 'proconnect' }]),
    )
    expect(model.status).toBe('actif')
    expect(model.providers).toEqual(['proconnect', 'keycloak'])
  })
})
