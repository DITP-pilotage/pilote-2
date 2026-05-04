export type RefreshResponseBody = {
  accessToken: string
  expiresIn: number | null
}

export const buildRefreshResponse = (
  override: Partial<RefreshResponseBody> = {},
): RefreshResponseBody => ({
  accessToken: 'access-test',
  expiresIn: 60,
  ...override,
})

export type LogoutResponseBody = {
  logoutUrl: string | null
}

export const buildLogoutResponse = (
  override: Partial<LogoutResponseBody> = {},
): LogoutResponseBody => ({
  logoutUrl: null,
  ...override,
})
