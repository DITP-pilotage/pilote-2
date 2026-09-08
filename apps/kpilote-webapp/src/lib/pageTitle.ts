import type { AnyRouter } from '@tanstack/react-router'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    // `null` sur les routes de mise en page : elles n'ont pas de titre propre et
    // laissent la main à leur enfant. Le champ étant requis, une nouvelle route
    // ne compile pas tant qu'elle n'a pas tranché son titre.
    title: string | null
    // Déclaré en méthode plutôt qu'en propriété : la bivariance des méthodes
    // laisse chaque route annoter `loaderData` avec le type de son loader.
    documentTitle?(this: void, loaderData: unknown): string | undefined
  }
}

const SUFFIXE = 'KPilote'

const titledMatch = (router: AnyRouter) => {
  for (const match of [...router.state.matches].reverse()) {
    const { title, documentTitle } = match.staticData
    if (title !== null) return { title, documentTitle, loaderData: match.loaderData }
  }
  return undefined
}

// Titre générique du type de page. C'est lui qui part dans `action_name`, jamais
// le libellé d'un indicateur ou d'une collection : le rapport « Titres de page »
// garde une ligne par type de page, et aucun contenu métier ne sort de l'app.
export const routeTitle = (router: AnyRouter): string | undefined => titledMatch(router)?.title

// L'onglet et l'historique, eux, portent le libellé réel quand la route en
// expose un : c'est ce qui rend deux entrées d'historique distinguables et donne
// aux lecteurs d'écran une annonce utile à la navigation.
const composeDocumentTitle = (router: AnyRouter): string => {
  const resolved = titledMatch(router)
  if (!resolved) return SUFFIXE

  // `loaderData` est absent quand le loader a échoué : on retombe alors sur le
  // titre générique plutôt que de garder celui de la page précédente.
  const libelle =
    (resolved.loaderData === undefined
      ? undefined
      : resolved.documentTitle?.(resolved.loaderData)) ?? resolved.title

  return `${libelle} — ${SUFFIXE}`
}

export const syncDocumentTitle = (router: AnyRouter): void => {
  router.subscribe('onResolved', () => {
    document.title = composeDocumentTitle(router)
  })
}
