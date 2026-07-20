import ky from 'ky'

export const bffClient = ky.create({
  prefix: new URL('/api/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
})

export const authClient = ky.create({
  prefix: new URL('/auth/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
})
