import { type Principal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

export const isOidcUser = (principal: Principal): boolean => principal.kind === 'user'

export const isApiKey = (principal: Principal): boolean => principal.kind === 'apiKey'

export const isApiKeyAdmin = (principal: Principal): boolean =>
  principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.ADMIN

export const isApiKeyContributor = (principal: Principal): boolean =>
  principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.CONTRIBUTOR
