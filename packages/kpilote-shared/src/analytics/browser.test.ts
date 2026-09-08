import { describe, expect, it, vi } from 'vitest'

import { createBrowserAnalytics, type BrowserAnalyticsOptions } from './browser'
import type { AnalyticsConfig } from './schema'

// URLs volontairement non résolvables : `.test` est réservé par la RFC 2606,
// aucun test ne peut donc joindre une vraie instance Matomo par inadvertance.
const config: AnalyticsConfig = {
  matomoUrl: 'https://matomo.test',
  siteId: '42',
  appUrl: 'https://kpilote.test',
}

const options = (overrides: Partial<BrowserAnalyticsOptions>): BrowserAnalyticsOptions => ({
  config,
  enabled: true,
  doNotTrack: false,
  ...overrides,
})

describe('createBrowserAnalytics', () => {
  it('émet vers matomo.php avec la query string construite', () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send })).trackPageView({ path: '/indicateurs/$id' })

    expect(send).toHaveBeenCalledTimes(1)
    const [url] = send.mock.calls[0] as [string]
    expect(url.startsWith('https://matomo.test/matomo.php?')).toBe(true)
    expect(new URL(url).searchParams.get('url')).toBe('https://kpilote.test/indicateurs/$id')
  })

  it("supprime la barre oblique finale de l'URL Matomo", () => {
    const send = vi.fn()
    createBrowserAnalytics(
      options({ send, config: { ...config, matomoUrl: 'https://matomo.test/' } }),
    ).trackEvent({ category: 'kpilote.error', action: 'error', name: 'mutation' })

    const [url] = send.mock.calls[0] as [string]
    expect(url.startsWith('https://matomo.test/matomo.php?')).toBe(true)
  })

  it('rattache les événements à la dernière page vue', () => {
    const send = vi.fn()
    const analytics = createBrowserAnalytics(options({ send }))

    analytics.trackPageView({ path: '/indicateurs/$id', title: 'Indicateur' })
    analytics.trackEvent({ category: 'kpilote.indicateur', action: 'view', name: 'resultats' })

    const [url] = send.mock.calls[1] as [string]
    const sent = new URL(url).searchParams
    expect(sent.get('url')).toBe('https://kpilote.test/indicateurs/$id')
    expect(sent.get('action_name')).toBe('Indicateur')
  })

  it('émet sans page les événements qui précèdent la première page vue', () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send })).trackEvent({
      category: 'kpilote.error',
      action: 'error',
      name: 'mutation',
    })

    const [url] = send.mock.calls[0] as [string]
    expect(new URL(url).searchParams.has('url')).toBe(false)
  })

  it("n'émet rien sans configuration", () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send, config: null })).trackPageView({ path: '/' })
    expect(send).not.toHaveBeenCalled()
  })

  it("n'émet rien quand l'analytics est désactivé", () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send, enabled: false })).trackPageView({ path: '/' })
    expect(send).not.toHaveBeenCalled()
  })

  it("n'émet rien quand le Do Not Track est actif", () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send, doNotTrack: true })).trackPageView({ path: '/' })
    expect(send).not.toHaveBeenCalled()
  })

  it('expose un statut actif quand rien ne le bloque', () => {
    expect(createBrowserAnalytics(options({ send: vi.fn() })).status).toEqual({ active: true })
  })

  it("expose la condition qui l'a éteint", () => {
    expect(createBrowserAnalytics(options({ config: null })).status).toEqual({
      active: false,
      reason: 'not-configured',
    })
    expect(createBrowserAnalytics(options({ enabled: false })).status).toEqual({
      active: false,
      reason: 'disabled',
    })
    expect(createBrowserAnalytics(options({ doNotTrack: true })).status).toEqual({
      active: false,
      reason: 'do-not-track',
    })
  })

  it("n'expose jamais une erreur d'envoi à l'appelant", () => {
    const send = vi.fn(() => {
      throw new Error('réseau indisponible')
    })
    const analytics = createBrowserAnalytics(options({ send }))

    expect(() => analytics.trackPageView({ path: '/' })).not.toThrow()
    expect(() =>
      analytics.trackEvent({ category: 'kpilote.error', action: 'error', name: 'mutation' }),
    ).not.toThrow()
  })
})
