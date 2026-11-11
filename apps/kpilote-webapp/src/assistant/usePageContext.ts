import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { useMatch } from '@tanstack/react-router'

/** Les entités affichées par la page courante, que l'assistant reçoit en contexte. */
export const usePageContext = (): PageContext | undefined => {
  const indicateur = useMatch({ from: '/_authenticated/indicateurs/$id', shouldThrow: false })
  const collection = useMatch({ from: '/_authenticated/collections/$id', shouldThrow: false })

  if (indicateur) {
    return {
      indicateurId: indicateur.params.id,
      ...(indicateur.search.individu ? { individuId: indicateur.search.individu } : {}),
    }
  }
  if (collection) {
    return {
      collectionId: collection.params.id,
      ...(collection.search.individu ? { individuId: collection.search.individu } : {}),
    }
  }
  return undefined
}
