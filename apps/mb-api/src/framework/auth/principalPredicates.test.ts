import { describe, expect, it } from 'vitest'

import {
  isApiKey,
  isApiKeyAdmin,
  isApiKeyContributor,
  isOidcUser,
} from '@/framework/auth/principalPredicates'
import { type Principal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

const adminKey: Principal = {
  kind: 'apiKey',
  apiKey: { id: 'a', label: 'k', role: ApiKeyRole.ADMIN },
}
const contributorKey: Principal = {
  kind: 'apiKey',
  apiKey: { id: 'a', label: 'k', role: ApiKeyRole.CONTRIBUTOR },
}
const user: Principal = {
  kind: 'user',
  user: { id: 'u', email: 'e@e.fr', prenom: 'p', nom: 'n' },
}

describe('principalPredicates', () => {
  it('isOidcUser', () => {
    expect(isOidcUser(user)).toBe(true)
    expect(isOidcUser(adminKey)).toBe(false)
  })
  it('isApiKey', () => {
    expect(isApiKey(adminKey)).toBe(true)
    expect(isApiKey(user)).toBe(false)
  })
  it('isApiKeyAdmin', () => {
    expect(isApiKeyAdmin(adminKey)).toBe(true)
    expect(isApiKeyAdmin(contributorKey)).toBe(false)
    expect(isApiKeyAdmin(user)).toBe(false)
  })
  it('isApiKeyContributor', () => {
    expect(isApiKeyContributor(contributorKey)).toBe(true)
    expect(isApiKeyContributor(adminKey)).toBe(false)
    expect(isApiKeyContributor(user)).toBe(false)
  })
})
