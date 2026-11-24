import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type CiblesSaisie } from '@pilote/kpilote-shared/valeurImport'
import { sortBy, uniqBy } from 'es-toolkit'

import { type AxeWithModalites } from '@/lib/axes/selection'

// Même ensemble que celui que l'API charge pour Albert : les individus des
// référentiels de l'indicateur, et, pour chaque axe, ses modalités feuilles
// (celles qu'aucune modalité n'a pour parent), triés par identifiant.
export const buildCiblesSaisie = ({
  individus,
  axes,
}: {
  // Tous les individus des référentiels de l'indicateur, doublons possibles.
  individus: ReadonlyArray<IndividuApiModel>
  // Dans l'ordre de déclaration de l'indicateur, avec l'arbre complet des modalités.
  axes: ReadonlyArray<AxeWithModalites>
}): CiblesSaisie => ({
  individus: sortBy(
    uniqBy(individus, (individu) => individu.id),
    [(individu) => individu.id],
  ).map((individu) => ({ id: individu.id, nom: individu.nom, referentiel: individu.referentiel })),
  axes: axes.map((axe) => ({ id: axe.id, nom: axe.nom, modalites: leafModalitesOf(axe) })),
})

const leafModalitesOf = (axe: AxeWithModalites): CiblesSaisie['axes'][number]['modalites'] => {
  const parentIds = new Set(axe.modalites.map((modalite) => modalite.parent))
  const leaves = axe.modalites.filter((modalite) => !parentIds.has(modalite.id))
  return sortBy(leaves, [(modalite) => modalite.id]).map((modalite) => ({
    id: modalite.id,
    nom: modalite.nom,
  }))
}
