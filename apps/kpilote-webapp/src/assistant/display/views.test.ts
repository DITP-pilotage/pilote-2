import { describe, expect, it } from 'vitest'

import { boundPanelWidth, boundWindowSize, effectiveView, viewsFor } from './views'

describe('vues de l’assistant', () => {
  it('propose les vues qui tiennent sur l’écran', () => {
    expect(viewsFor('narrow')).toEqual(['fullscreen'])
    expect(viewsFor('medium')).toEqual(['floating', 'fullscreen'])
    expect(viewsFor('wide')).toEqual(['floating', 'sidePanel', 'fullscreen'])
  })

  it('replie de proche en proche une vue qui ne tient pas, sans l’oublier', () => {
    expect(effectiveView('sidePanel', 'medium')).toBe('floating')
    expect(effectiveView('sidePanel', 'narrow')).toBe('fullscreen')
    expect(effectiveView('sidePanel', 'wide')).toBe('sidePanel')
    expect(effectiveView('minimized', 'narrow')).toBe('minimized')
  })

  it('borne le panneau et laisse sa place à la page', () => {
    expect(boundPanelWidth(1000, 2000)).toBe(720)
    expect(boundPanelWidth(100, 2000)).toBe(400)
    expect(boundPanelWidth(700, 1500)).toBe(600)
    expect(boundPanelWidth(700, 1000)).toBe(400)
  })

  it('garde la fenêtre dans l’écran', () => {
    expect(boundWindowSize({ width: 2000, height: 2000 }, { width: 1440, height: 900 })).toEqual({
      width: 720,
      height: 868,
    })
    expect(boundWindowSize({ width: 100, height: 100 }, { width: 1440, height: 900 })).toEqual({
      width: 360,
      height: 400,
    })
  })
})
