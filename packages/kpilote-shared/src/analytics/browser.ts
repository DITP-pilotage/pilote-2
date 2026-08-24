import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig, AnalyticsEvent, AnalyticsPageView } from './schema'

export type Analytics = {
  trackPageView: (pageView: AnalyticsPageView) => void
  trackEvent: (event: AnalyticsEvent) => void
}

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null
  enabled: boolean
  doNotTrack: boolean
  send?: (url: string) => void
}

const ANALYTICS_ETEINT: Analytics = {
  trackPageView: () => {},
  trackEvent: () => {},
}

const envoyer = (url: string): void => {
  if (navigator.sendBeacon(url)) return
  void fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {})
}

export const createBrowserAnalytics = (options: BrowserAnalyticsOptions): Analytics => {
  const { config, enabled, doNotTrack } = options
  if (!config || !enabled || doNotTrack) return ANALYTICS_ETEINT

  const send = options.send ?? envoyer
  const endpoint = `${config.matomoUrl.replace(/\/$/, '')}/matomo.php`

  const emettre = (query: string): void => {
    try {
      send(`${endpoint}?${query}`)
    } catch {
      // L'analytics ne peut pas casser l'application.
    }
  }

  return {
    trackPageView: (pageView) => emettre(buildPageViewRequest(pageView, config)),
    trackEvent: (event) => emettre(buildEventRequest(event, config)),
  }
}
