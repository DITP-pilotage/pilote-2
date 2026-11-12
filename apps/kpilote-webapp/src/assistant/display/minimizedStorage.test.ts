import { afterEach, describe, expect, it } from 'vitest'

import { clearMinimized, readMinimized, writeMinimized } from './minimizedStorage'

const ID = '0f1c9a52-3c1c-4a52-9a8e-2b1f2c3d4e5f'

describe('conversation masquée', () => {
  afterEach(() => sessionStorage.clear())

  it('relit la conversation masquée, puis l’oublie', () => {
    writeMinimized(ID)
    expect(readMinimized()).toEqual({ id: ID })

    clearMinimized()
    expect(readMinimized()).toBeNull()
  })

  it('efface une entrée invalide', () => {
    sessionStorage.setItem('kpilote-assistant:conversation', '{"id":"pas-un-uuid"}')

    expect(readMinimized()).toBeNull()
    expect(sessionStorage.getItem('kpilote-assistant:conversation')).toBeNull()
  })
})
