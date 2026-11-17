import { type ArbreModalites, type AxeCalcul, descendDe, type Selection } from '@/axe/modalites'
import { type Cellule } from '@/valeurAvancement/cellule'

// Ce qui a été saisi pour un individu, toutes dates confondues (le « cube
// creux ») : seules les modalités observées au moins une fois sont attendues.

// Combinaison qui porte au moins une valeur pour un individu : une modalité
// feuille par axe (aucune pour la combinaison vide).
export type CombinaisonObservee = {
  combinaisonId: string
  modaliteParAxe: ReadonlyMap<string, string>
}

// Les combinaisons observées de chaque individu, à partir des cellules qui
// portent au moins une saisie. Une combinaison absente de
// `modalitesParCombinaison` n'a pas de modalité (la combinaison vide).
export const observerCombinaisons = ({
  cellules,
  modalitesParCombinaison,
}: {
  cellules: ReadonlyArray<Cellule>
  modalitesParCombinaison: ReadonlyMap<string, ReadonlyMap<string, string>>
}): Map<string, CombinaisonObservee[]> => {
  const observeesParIndividu = new Map<string, CombinaisonObservee[]>()
  for (const { individuId, combinaisonId } of cellules) {
    const observees = observeesParIndividu.get(individuId) ?? []
    observees.push({
      combinaisonId,
      modaliteParAxe: modalitesParCombinaison.get(combinaisonId) ?? new Map(),
    })
    observeesParIndividu.set(individuId, observees)
  }
  return observeesParIndividu
}

// Une sélection est attendue si une combinaison observée de l'individu tombe
// dessous : sur chaque axe choisi, sa modalité est la modalité choisie ou l'une
// de ses descendantes.
export const estObservee = ({
  arbre,
  observees,
  selection,
}: {
  arbre: ArbreModalites
  observees: ReadonlyArray<CombinaisonObservee>
  selection: Selection
}): boolean =>
  observees.some((observee) =>
    [...selection].every(([axeId, modaliteId]) => {
      const modaliteObservee = observee.modaliteParAxe.get(axeId)
      return (
        modaliteObservee !== undefined &&
        descendDe({ arbre, modaliteId: modaliteObservee, ancetre: modaliteId })
      )
    }),
  )

// La combinaison observée qui correspond exactement à une sélection complète
// (sans axe : la combinaison vide).
export const combinaisonObserveeDe = ({
  axes,
  observees,
  selection,
}: {
  axes: ReadonlyArray<AxeCalcul>
  observees: ReadonlyArray<CombinaisonObservee>
  selection: Selection
}): CombinaisonObservee | undefined =>
  observees.find((observee) =>
    axes.every((axe) => observee.modaliteParAxe.get(axe.id) === selection.get(axe.id)),
  )
