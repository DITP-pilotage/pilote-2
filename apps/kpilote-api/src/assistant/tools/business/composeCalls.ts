import { type SyntheseBranch } from '@pilote/kpilote-shared/assistant/tools'

import { type Fetcher } from '@/assistant/tools/fetcher'

/**
 * Joue plusieurs appels documentés en parallèle et les assemble sous un seul objet.
 *
 * Les queries sous-jacentes prennent un `params` typé par leur schéma de query string :
 * passer par les routes évite de le reconstruire, et applique les mêmes habilitations.
 *
 * Une branche en échec porte SA RAISON plutôt qu'un `null` nu — sans quoi le modèle lit un
 * refus de droit comme « pas de données » et l'affirme à l'utilisateur.
 */
/** Un appel documenté, rendu soit en données soit avec sa raison d'indisponibilité. */
export const readBranch = async (
  fetcher: Fetcher,
  url: string,
): Promise<SyntheseBranch<unknown>> => {
  const response = await fetcher(url)
  if (response.ok) {
    const data: unknown = await response.json()
    return { data }
  }
  return {
    unavailable:
      response.status === 403
        ? `Accès refusé (statut ${response.status}) : l'utilisateur n'a pas les droits sur cette donnée.`
        : `Donnée non récupérée (statut ${response.status}).`,
  }
}

/** Ce qu'on renvoie pour une branche qui exige un territoire quand aucun n'a été fourni. */
export const WITHOUT_TERRITOIRE = {
  unavailable:
    "Cette donnée est lue pour un territoire donné, et aucun n'a été fourni. Demande à l'utilisateur lequel l'intéresse, puis rappelle cet outil avec `individuId`.",
} as const

export const composeCalls = async <T extends Record<string, SyntheseBranch<unknown>>>(
  fetcher: Fetcher,
  calls: Record<keyof T & string, string>,
): Promise<T> => {
  const entries = Object.entries(calls) as Array<[keyof T & string, string]>

  const branches = await Promise.all(entries.map(([, url]) => readBranch(fetcher, url)))

  return Object.fromEntries(entries.map(([key], index) => [key, branches[index]])) as T
}
