import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { auth } from '@/auth'

describe('auth singleton', () => {
  beforeEach(() => {
    localStorage.clear()
    auth.logout()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('démarre non authentifié', () => {
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('login() authentifie et persiste en localStorage', () => {
    auth.login()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual({
      name: 'Marie Curie',
      email: 'marie@pilote-mb.fr',
    })
    expect(localStorage.getItem('mb-auth')).not.toBeNull()
  })

  it('logout() déconnecte et nettoie localStorage', () => {
    auth.login()
    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(localStorage.getItem('mb-auth')).toBeNull()
  })
})
