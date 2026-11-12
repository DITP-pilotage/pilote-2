import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  readPanelWidth,
  readViewPreference,
  readWindowSize,
  writePanelWidth,
  writeViewPreference,
  writeWindowSize,
} from './preferencesStorage'

describe('préférences de l’assistant', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('relit ce qui a été retenu', () => {
    writeViewPreference('sidePanel')
    writePanelWidth(560)
    writeWindowSize({ width: 500, height: 700 })

    expect(readViewPreference()).toBe('sidePanel')
    expect(readPanelWidth()).toBe(560)
    expect(readWindowSize()).toEqual({ width: 500, height: 700 })
  })

  it('ignore une valeur absente ou invalide', () => {
    expect(readViewPreference()).toBeNull()
    localStorage.setItem('kpilote-assistant:vue', 'plein-ecran')
    localStorage.setItem('kpilote-assistant:largeurPanneau', 'large')
    localStorage.setItem('kpilote-assistant:tailleFenetre', '{pas du json')

    expect(readViewPreference()).toBeNull()
    expect(readPanelWidth()).toBeNull()
    expect(readWindowSize()).toBeNull()
  })

  it('se passe d’un stockage indisponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqué')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqué')
    })

    expect(() => writeViewPreference('floating')).not.toThrow()
    expect(readViewPreference()).toBeNull()
  })
})
