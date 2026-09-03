import { type SyntheseBranch } from '@pilote/kpilote-shared/assistant/tools'

import { type Fetcher } from '@/assistant/tools/fetcher'

/**
 * Joue un appel documenté et rend soit ses données, soit la raison pour laquelle elles
 * manquent.
 *
 * Une branche en échec porte SA RAISON plutôt qu'un `null` nu — sans quoi le modèle lit un
 * refus de droit comme « pas de données » et l'affirme à l'utilisateur.
 *
 * `T` est la réponse documentée par la route, et n'est pas revalidée ici : c'est le même
 * parti pris que la couche dérivée, où ce sont les tests de route qui garantissent la
 * forme. Assumer la conversion À CET ENDROIT évite de la voir ressurgir en `as` chez
 * chaque appelant.
 */
export const readBranch = async <T>(fetcher: Fetcher, url: string): Promise<SyntheseBranch<T>> => {
  const response = await fetcher(url)
  if (response.ok) return { data: (await response.json()) as T }
  return {
    unavailable:
      response.status === 403
        ? `Accès refusé (statut ${response.status}) : l'utilisateur n'a pas les droits sur cette donnée.`
        : `Donnée non récupérée (statut ${response.status}).`,
  }
}

/**
 * Ce qu'on renvoie pour une branche qui exige un territoire quand aucun n'a été fourni.
 *
 * Typée `SyntheseBranch<never>` : la branche « indisponible » d'une union est valable quel
 * que soit le type de données attendu, donc cette constante se pose telle quelle dans
 * n'importe quelle synthèse.
 */
export const WITHOUT_TERRITOIRE: SyntheseBranch<never> = {
  unavailable:
    "Cette donnée est lue pour un territoire donné, et aucun n'a été fourni. Demande à l'utilisateur lequel l'intéresse, puis rappelle cet outil avec `individuId`.",
}
