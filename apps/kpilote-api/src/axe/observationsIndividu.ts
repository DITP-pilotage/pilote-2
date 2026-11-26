import { toMap } from '@pilote/kpilote-shared/record'
import { groupBy, mapValues } from 'es-toolkit'

import { type ArbreModalites, type AxeCalcul, descendsFrom, type Selection } from '@/axe/modalites'
import { type Cellule } from '@/valeurAvancement/cellule'

// Ce qui a été saisi pour un individu, toutes dates confondues (le « cube
// creux ») : seules les modalités observées au moins une fois sont attendues.

// Combinaison qui porte au moins une valeur pour un individu : une modalité
// feuille par axe (aucune pour la combinaison vide).
export type ObservedCombinaison = {
  combinaisonId: string
  modaliteByAxe: ReadonlyMap<string, string>
}

// Les combinaisons observées de chaque individu, à partir des cellules qui
// portent au moins une saisie. Une combinaison absente de
// `modalitesByCombinaison` n'a pas de modalité (la combinaison vide).
export const groupObservedCombinaisons = ({
  cellules,
  modalitesByCombinaison,
}: {
  cellules: ReadonlyArray<Cellule>
  modalitesByCombinaison: ReadonlyMap<string, ReadonlyMap<string, string>>
}): Map<string, ObservedCombinaison[]> =>
  toMap(
    mapValues(
      groupBy(cellules, (cellule) => cellule.individuId),
      (cellulesIndividu) =>
        cellulesIndividu.map(({ combinaisonId }) => ({
          combinaisonId,
          modaliteByAxe: modalitesByCombinaison.get(combinaisonId) ?? new Map<string, string>(),
        })),
    ),
  )

// Une sélection est attendue si une combinaison observée de l'individu tombe
// dessous : sur chaque axe choisi, sa modalité est la modalité choisie ou l'une
// de ses descendantes.
export const isObserved = ({
  arbre,
  observed,
  selection,
}: {
  arbre: ArbreModalites
  observed: ReadonlyArray<ObservedCombinaison>
  selection: Selection
}): boolean =>
  observed.some((combinaison) =>
    [...selection].every(([axeId, modaliteId]) => {
      const observedModalite = combinaison.modaliteByAxe.get(axeId)
      return (
        observedModalite !== undefined &&
        descendsFrom({ arbre, modaliteId: observedModalite, ancestor: modaliteId })
      )
    }),
  )

// La combinaison observée qui correspond exactement à une sélection complète
// (sans axe : la combinaison vide).
export const findObservedCombinaison = ({
  axes,
  observed,
  selection,
}: {
  axes: ReadonlyArray<AxeCalcul>
  observed: ReadonlyArray<ObservedCombinaison>
  selection: Selection
}): ObservedCombinaison | undefined =>
  observed.find((combinaison) =>
    axes.every((axe) => combinaison.modaliteByAxe.get(axe.id) === selection.get(axe.id)),
  )
