import type { AnalyticsConfig } from '@pilote/kpilote-shared/analytics'
import { createBrowserAnalytics } from '@pilote/kpilote-shared/analytics/browser'

import { env } from '@/env'

const respecteDoNotTrack = (): boolean =>
  typeof navigator !== 'undefined' &&
  (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes')

const config: AnalyticsConfig | null =
  env.matomoUrl && env.matomoSiteId
    ? {
        matomoUrl: env.matomoUrl,
        siteId: env.matomoSiteId,
        appUrl: window.location.origin,
        globalContexte: {
          app_area: 'webapp',
        },
      }
    : null

export const analytics = createBrowserAnalytics({
  config,
  enabled: import.meta.env.PROD && env.analyticsEnabled,
  doNotTrack: respecteDoNotTrack(),
})
