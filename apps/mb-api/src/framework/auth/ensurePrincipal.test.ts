import { describe, expect, it } from 'vitest'

import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { type Principal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const ID = '00000000-0000-0000-0000-000000000001'

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
