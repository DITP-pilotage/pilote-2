import { describe, expect, it } from 'vitest'

import { ensureApiKeyAdmin } from '@/framework/auth/ensureApiKeyAdmin'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { ForbiddenError } from '@/framework/errors/AppError'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

describe('ensureApiKeyAdmin', () => {
  it('laisse passer une clé API ADMIN', () => {
    expect(() =>
      runAsAdmin('00000000-0000-0000-0000-000000000001', ensureApiKeyAdmin),
    ).not.toThrow()
  })

  it('refuse une clé API CONTRIBUTOR', () => {
    expect(() =>
      runAsContributor('00000000-0000-0000-0000-000000000001', ensureApiKeyAdmin),
    ).toThrow(ForbiddenError)
  })

  it('laisse passer un utilisateur OIDC', () => {
    expect(() => runAsUser('00000000-0000-0000-0000-000000000002', ensureApiKeyAdmin)).not.toThrow()
  })

  it('refuse en absence de principal', () => {
    expect(() => ensureApiKeyAdmin()).toThrow(UnauthorizedError)
  })
})
