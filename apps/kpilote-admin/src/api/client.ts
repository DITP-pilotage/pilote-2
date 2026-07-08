import ky from 'ky'

export const bffClient = ky.create({
  prefixUrl: new URL('/api/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
})

export const authClient = ky.create({
  prefixUrl: new URL('/auth/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
})
