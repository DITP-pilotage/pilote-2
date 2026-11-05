import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig, AnalyticsEvent, AnalyticsPage, AnalyticsPageView } from './schema'

export type InactiveAnalyticsReason = 'not-configured' | 'disabled' | 'do-not-track'

export type AnalyticsStatus = { active: true } | { active: false; reason: InactiveAnalyticsReason }

export type Analytics = {
  status: AnalyticsStatus
  trackPageView: (pageView: AnalyticsPageView) => void
  trackEvent: (event: AnalyticsEvent) => void
  /** Clé de contexte → numéro de dimension Matomo ; libère les envois mis en attente. */
  setDimensionSlots: (slots: Record<string, number>) => void
}

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null
  enabled: boolean
  doNotTrack: boolean
  /** Retient les envois jusqu'au premier `setDimensionSlots`, pour qu'ils portent les dimensions. */
  waitForDimensions?: boolean
  send?: (url: string) => void
}

const noopAnalytics = (reason: InactiveAnalyticsReason): Analytics => ({
  status: { active: false, reason },
  trackPageView: () => {},
  trackEvent: () => {},
  setDimensionSlots: () => {},
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

  // L'émetteur retient la dernière page vue pour en rattacher les événements
  // suivants : eux seuls ne savent pas d'où ils partent. Les événements émis
  // avant la première page vue restent sans page, comme aujourd'hui.
  let currentPage: AnalyticsPage | undefined
  let currentConfig = config
  // Les requêtes sont construites à l'envoi : celles mises en attente prennent les dimensions.
  let waiting: Array<() => string> | null = options.waitForDimensions ? [] : null

  const schedule = (build: () => string): void => {
    if (waiting) waiting.push(build)
    else emit(build())
  }

  return {
    status: { active: true },
    trackPageView: (pageView) => {
      currentPage = pageView
      schedule(() => buildPageViewRequest(pageView, currentConfig))
    },
    trackEvent: (event) => {
      const page = currentPage
      schedule(() => buildEventRequest(event, currentConfig, page))
    },
    setDimensionSlots: (slots) => {
      currentConfig = { ...config, dimensionSlots: { ...config.dimensionSlots, ...slots } }
      const pending = waiting ?? []
      waiting = null
      for (const build of pending) emit(build())
    },
  }
}
