import { describe, expect, it, vi } from 'vitest'

import { createBrowserAnalytics, type BrowserAnalyticsOptions } from './browser'
import type { AnalyticsConfig } from './schema'

const config: AnalyticsConfig = {
  matomoUrl: 'https://stats.beta.gouv.fr',
  siteId: '42',
  appUrl: 'https://kpilote.example',
}

const options = (surcharges: Partial<BrowserAnalyticsOptions>): BrowserAnalyticsOptions => ({
  config,
  enabled: true,
  doNotTrack: false,
  ...surcharges,
})

describe('createBrowserAnalytics', () => {
  it('émet vers matomo.php avec la query string construite', () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send })).trackPageView({ path: '/indicateurs/$id' })

    expect(send).toHaveBeenCalledTimes(1)
    const [url] = send.mock.calls[0] as [string]
    expect(url.startsWith('https://stats.beta.gouv.fr/matomo.php?')).toBe(true)
    expect(new URL(url).searchParams.get('url')).toBe('https://kpilote.example/indicateurs/$id')
  })

  it("supprime la barre oblique finale de l'URL Matomo", () => {
    const send = vi.fn()
    createBrowserAnalytics(
      options({ send, config: { ...config, matomoUrl: 'https://stats.beta.gouv.fr/' } }),
    ).trackEvent({ category: 'kpilote.error', action: 'error', name: 'mutation' })

    const [url] = send.mock.calls[0] as [string]
    expect(url.startsWith('https://stats.beta.gouv.fr/matomo.php?')).toBe(true)
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
