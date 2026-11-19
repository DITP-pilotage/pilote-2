import { describe, expect, it } from 'vitest'

import {
  ensureAdmin,
  ensureAdminOrOidcUser,
  ensureAuteur,
  ensurePrincipal,
  isApiKey,
  isApiKeyAdmin,
  isApiKeyContributor,
  isOidcUser,
} from '@/framework/auth/principalPredicates'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { type Principal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

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

const ID = '00000000-0000-0000-0000-000000000001'

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

describe('ensurePrincipal', () => {
  it('laisse passer quand le prédicat est vrai (clé ADMIN)', () => {
    expect(() => runAsAdmin(ID, () => ensurePrincipal(isApiKeyAdmin, 'nope'))).not.toThrow()
  })

  it('rejette (ForbiddenError) une clé CONTRIBUTOR sur un prédicat strict ADMIN', () => {
    expect(() => runAsContributor(ID, () => ensurePrincipal(isApiKeyAdmin, 'nope'))).toThrow(
      ForbiddenError,
    )
  })

  it('rejette (ForbiddenError) un utilisateur OIDC sur un prédicat strict ADMIN', () => {
    expect(() => runAsUser(ID, () => ensurePrincipal(isApiKeyAdmin, 'nope'))).toThrow(
      ForbiddenError,
    )
  })

  it('supporte la composition OU (clé ADMIN ou utilisateur OIDC)', () => {
    const predicate = (p: Principal) => isApiKeyAdmin(p) || isOidcUser(p)
    expect(() => runAsUser(ID, () => ensurePrincipal(predicate, 'nope'))).not.toThrow()
    expect(() => runAsAdmin(ID, () => ensurePrincipal(predicate, 'nope'))).not.toThrow()
    expect(() => runAsContributor(ID, () => ensurePrincipal(predicate, 'nope'))).toThrow(
      ForbiddenError,
    )
  })

  it('lève UnauthorizedError sans principal', () => {
    expect(() => ensurePrincipal(isApiKeyAdmin, 'nope')).toThrow(UnauthorizedError)
  })
})

describe('ensureAdmin', () => {
  it('laisse passer une clé ADMIN', () => {
    expect(() => runAsAdmin(ID, () => ensureAdmin())).not.toThrow()
  })

  it('rejette (ForbiddenError) une clé CONTRIBUTOR et un utilisateur OIDC', () => {
    expect(() => runAsContributor(ID, () => ensureAdmin())).toThrow(ForbiddenError)
    expect(() => runAsUser(ID, () => ensureAdmin())).toThrow(ForbiddenError)
  })
})

describe('ensureAdminOrOidcUser', () => {
  it('laisse passer une clé ADMIN et un utilisateur OIDC', () => {
    expect(() => runAsAdmin(ID, () => ensureAdminOrOidcUser())).not.toThrow()
    expect(() => runAsUser(ID, () => ensureAdminOrOidcUser())).not.toThrow()
  })

  it('rejette (ForbiddenError) une clé CONTRIBUTOR', () => {
    expect(() => runAsContributor(ID, () => ensureAdminOrOidcUser())).toThrow(ForbiddenError)
  })
})

describe('ensureAuteur', () => {
  const AUTRE_ID = '00000000-0000-0000-0000-000000000002'

  it("laisse passer l'auteur", () => {
    expect(() =>
      runAsUser(ID, () => ensureAuteur({ createdBy: ID, message: 'nope' })),
    ).not.toThrow()
  })

  it("rejette (ForbiddenError) un autre principal, même ADMIN, avec le message de l'appelant", () => {
    expect(() =>
      runAsAdmin(ID, () => ensureAuteur({ createdBy: AUTRE_ID, message: 'nope' })),
    ).toThrow(new ForbiddenError('nope'))
  })
})
