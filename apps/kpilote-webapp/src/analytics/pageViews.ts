import type { AnyRouter } from '@tanstack/react-router'

import { analytics } from '@/analytics/tracker'

// Les identifiants de route portent les segments de mise en page sans chemin
// (`/_authenticated/indicateurs/$id`) : on les retire pour n'envoyer que le
// motif public, sans jamais exposer d'identifiant métier dans l'URL.
const routePattern = (router: AnyRouter): string => {
  const { matches } = router.state
  const last = matches[matches.length - 1]
  if (!last || last.routeId === '__root__') return '/'
  return last.routeId.replace(/\/_[^/]+/g, '') || '/'
}

export const trackPageViews = (router: AnyRouter): void => {
  router.subscribe('onResolved', () => {
    analytics.trackPageView({ path: routePattern(router), title: document.title })
  })
}
