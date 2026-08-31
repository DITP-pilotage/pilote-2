import { type BrancheSynthese } from '@pilote/kpilote-shared/assistant/tools'

import { type Requeteur } from '@/assistant/tools/requeteur'

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
export const lireBranche = async (
  requeteur: Requeteur,
  url: string,
): Promise<BrancheSynthese<unknown>> => {
  const reponse = await requeteur(url)
  if (reponse.ok) {
    const donnees: unknown = await reponse.json()
    return { donnees }
  }
  return {
    indisponible:
      reponse.status === 403
        ? `Accès refusé (statut ${reponse.status}) : l'utilisateur n'a pas les droits sur cette donnée.`
        : `Donnée non récupérée (statut ${reponse.status}).`,
  }
}

/** Ce qu'on renvoie pour une branche qui exige un territoire quand aucun n'a été fourni. */
export const SANS_TERRITOIRE = {
  indisponible:
    "Cette donnée est lue pour un territoire donné, et aucun n'a été fourni. Demande à l'utilisateur lequel l'intéresse, puis rappelle cet outil avec `individuId`.",
} as const

export const composerAppels = async <T extends Record<string, BrancheSynthese<unknown>>>(
  requeteur: Requeteur,
  appels: Record<keyof T & string, string>,
): Promise<T> => {
  const entrees = Object.entries(appels) as Array<[keyof T & string, string]>

  const branches = await Promise.all(entrees.map(([, url]) => lireBranche(requeteur, url)))

  return Object.fromEntries(entrees.map(([cle], index) => [cle, branches[index]])) as T
}
