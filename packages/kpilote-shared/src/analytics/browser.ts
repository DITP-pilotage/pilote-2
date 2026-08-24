import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig, AnalyticsEvent, AnalyticsPageView } from './schema'

export type InactiveAnalyticsReason = 'not-configured' | 'disabled' | 'do-not-track'

export type AnalyticsStatus = { active: true } | { active: false; reason: InactiveAnalyticsReason }

export type Analytics = {
  status: AnalyticsStatus
  trackPageView: (pageView: AnalyticsPageView) => void
  trackEvent: (event: AnalyticsEvent) => void
}

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null
  enabled: boolean
  doNotTrack: boolean
  send?: (url: string) => void
}

const noopAnalytics = (reason: InactiveAnalyticsReason): Analytics => ({
  status: { active: false, reason },
  trackPageView: () => {},
  trackEvent: () => {},
})

const sendBeacon = (url: string): void => {
  if (navigator.sendBeacon(url)) return
  void fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {})
}

export const createBrowserAnalytics = (options: BrowserAnalyticsOptions): Analytics => {
  const { config, enabled, doNotTrack } = options
  if (!config) return noopAnalytics('not-configured')
  if (!enabled) return noopAnalytics('disabled')
  if (doNotTrack) return noopAnalytics('do-not-track')

  const send = options.send ?? sendBeacon
  const endpoint = `${config.matomoUrl.replace(/\/$/, '')}/matomo.php`

  const emit = (query: string): void => {
    try {
      send(`${endpoint}?${query}`)
    } catch {
      // L'analytics ne peut pas casser l'application.
    }
  }

  return {
    status: { active: true },
    trackPageView: (pageView) => emit(buildPageViewRequest(pageView, config)),
    trackEvent: (event) => emit(buildEventRequest(event, config)),
  }
}
