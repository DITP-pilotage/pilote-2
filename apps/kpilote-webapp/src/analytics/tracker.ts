import {
  createBrowserAnalytics,
  type InactiveAnalyticsReason,
} from '@pilote/kpilote-shared/analytics/browser'
import type { AnalyticsConfig } from '@pilote/kpilote-shared/analytics/schema'

import { env } from '@/env'

const respectDoNotTrack = (): boolean =>
  typeof navigator !== 'undefined' &&
  (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes')

const config: AnalyticsConfig | null =
  env.matomoUrl && env.matomoSiteId
    ? {
        matomoUrl: env.matomoUrl,
        siteId: env.matomoSiteId,
        appUrl: window.location.origin,
        globalContext: {
          app_area: 'webapp',
        },
      }
    : null

export const analytics = createBrowserAnalytics({
  config,
  enabled: import.meta.env.PROD && env.analyticsEnabled,
  doNotTrack: respectDoNotTrack(),
})

const describeInactive = (reason: InactiveAnalyticsReason): string => {
  switch (reason) {
    case 'not-configured':
      return 'VITE_MATOMO_URL ou VITE_MATOMO_SITE_ID est absente du build'
    case 'disabled':
      return import.meta.env.PROD
        ? "VITE_ANALYTICS_ENABLED n'est pas à true dans le build"
        : 'build de développement'
    case 'do-not-track':
      return 'Do Not Track est actif dans le navigateur'
  }
}

// Les quatre garde-fous produisent tous le même émetteur muet. Sans cette ligne,
// « rien ne part » est indistinguable de « rien ne devait partir ».
console.info(
  analytics.status.active
    ? `[analytics] actif — ${env.matomoUrl} (site ${env.matomoSiteId})`
    : `[analytics] inactif — ${describeInactive(analytics.status.reason)}`,
)
