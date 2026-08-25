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

// `onResolved` se déclenche aussi quand seuls les search params changent — or
// filtres, pagination et recherche vivent dans l'URL. Sans ce filtre, un tri de
// tableau compterait en page vue ce que le plan de taggage mesure en événement.
// `fromLocation` est absent au premier chargement : cette page vue doit partir.
export const trackPageViews = (router: AnyRouter): void => {
  router.subscribe('onResolved', ({ fromLocation, pathChanged }) => {
    if (fromLocation && !pathChanged) return
    // `title` omis : `document.title` est figé tant que PIL-1724 n'a pas donné
    // un titre à chaque route.
    analytics.trackPageView({ path: routePattern(router) })
  })
}
