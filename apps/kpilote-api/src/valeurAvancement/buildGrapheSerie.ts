import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import {
  type ArbreModalites,
  type AxeCalcul,
  construireArbreModalites,
  descendreUnNiveau,
  estFeuille,
  type ModaliteCalcul,
  type Selection,
} from '@/axe/modalites'
import {
  combinaisonObserveeDe,
  type CombinaisonObservee,
  estObservee,
  observerCombinaisons,
} from '@/axe/observationsIndividu'
import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { cleCellule, type SaisiesCellule } from '@/valeurAvancement/cellule'
import {
  type AgregationNoeud,
  type GrapheSerie,
  type IndividuRef,
  type Noeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Construit le graphe de résolution consommé par `resolveSerieNoeud`, pour
// tout indicateur, avec ou sans axe. Fonctions pures ; règle et schémas dans
// la spec multifiltre, §5.
//
// Un nœud est un individu et une sélection : pour chaque axe, une modalité, ou
// « Tous » si l'axe est absent de la sélection. Pour un nœud, on applique la
// première règle qui convient (`deciderRegle`) :
//
// 1. L'individu se calcule à partir de ses individus enfants (il en a, et la
//    fonction de son référentiel n'est pas NONE) : ses enfants sont la même
//    sélection pour chacun d'eux, combinés avec la fonction du référentiel. Les
//    axes se combinent donc avant la hiérarchie des individus (chemin 1,
//    PIL-1963).
// 2. Sinon, un axe reste à détailler (à « Tous » ou sur une modalité parente) :
//    on le descend d'un niveau dans l'arbre de ses modalités, en ne gardant que
//    les sélections observées pour cet individu (cube creux), combinées avec la
//    fonction de l'axe. Parmi plusieurs axes, on détaille le dernier déclaré :
//    le premier déclaré se combine ainsi en premier, au plus près des saisies
//    (point n°2, PIL-1963).
// 3. Sinon, la sélection est complète (une modalité feuille par axe, aucune
//    sans axe) : le nœud est saisi.
//
// Sans axe, la règle 2 ne s'applique jamais : on retrouve le calcul historique
// sur la combinaison vide.

type Regle =
  | {
      type: 'agregationIndividus'
      fonction: FonctionAgregation
      enfants: ReadonlyArray<IndividuRef>
    }
  | { type: 'agregationAxe'; axe: AxeCalcul; selections: ReadonlyArray<Selection> }
  | { type: 'saisie' }

// Entrées de la construction, en lecture seule.
type Contexte = {
  axes: ReadonlyArray<AxeCalcul>
  arbre: ArbreModalites
  hierarchie: {
    enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
    fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
    referentielParIndividu: ReadonlyMap<string, string>
  }
  observeesParIndividu: ReadonlyMap<string, ReadonlyArray<CombinaisonObservee>>
  saisiesParCellule: ReadonlyMap<string, ReadonlyArray<SaisieTronquee>>
}

// Le graphe en cours de construction, rempli au fil des nœuds.
type GrapheEnConstruction = {
  agregationParNoeud: Map<string, AgregationNoeud>
  saisiesParNoeud: Map<string, ReadonlyArray<SaisieTronquee>>
  construits: Set<string>
}

export const buildGrapheSerie = ({
  individus,
  enfantsParParent,
  fonctionAgregationParReferentiel,
  axes,
  modalites,
  cellules,
  modalitesParCombinaison,
}: {
  individus: Iterable<IndividuRef>
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  // Dans l'ordre de déclaration ; vide pour un indicateur sans axe.
  axes: ReadonlyArray<AxeCalcul>
  modalites: ReadonlyArray<ModaliteCalcul>
  // Les saisies chargées, par cellule (individu × combinaison).
  cellules: ReadonlyArray<SaisiesCellule>
  // combinaisonId → (axeId → modaliteId) ; vide pour un indicateur sans axe.
  modalitesParCombinaison: ReadonlyMap<string, ReadonlyMap<string, string>>
}): { graphe: GrapheSerie; noeud: (individu: IndividuRef, selection?: Selection) => Noeud } => {
  // Une combinaison est observée pour un individu dès qu'elle porte une saisie.
  const cellulesSaisies = cellules.filter((cellule) => cellule.saisies.length > 0)
  const contexte: Contexte = {
    axes,
    arbre: construireArbreModalites(modalites),
    hierarchie: {
      enfantsParParent,
      fonctionAgregationParReferentiel,
      referentielParIndividu: new Map([...individus].map((i) => [i.id, i.referentielId])),
    },
    observeesParIndividu: observerCombinaisons({
      cellules: cellulesSaisies,
      modalitesParCombinaison,
    }),
    saisiesParCellule: new Map(
      cellulesSaisies.map((cellule) => [cleCellule(cellule), cellule.saisies]),
    ),
  }
  const graphe: GrapheEnConstruction = {
    agregationParNoeud: new Map(),
    saisiesParNoeud: new Map(),
    construits: new Set(),
  }
  return {
    // Mêmes Maps que la construction : elles se remplissent à chaque appel de `noeud`.
    graphe: {
      agregationParNoeud: graphe.agregationParNoeud,
      saisiesParNoeud: graphe.saisiesParNoeud,
    },
    // Construction à la demande, à partir des nœuds cibles.
    noeud: (individu, selection = new Map()) =>
      construireNoeud({ contexte, graphe, individu, selection }),
  }
}

const construireNoeud = ({
  contexte,
  graphe,
  individu,
  selection,
}: {
  contexte: Contexte
  graphe: GrapheEnConstruction
  individu: IndividuRef
  selection: Selection
}): Noeud => {
  const noeud = noeudDe({ contexte, individu, selection })
  if (graphe.construits.has(noeud.cle)) return noeud
  graphe.construits.add(noeud.cle)

  const regle = deciderRegle({ contexte, individu, selection })
  switch (regle.type) {
    case 'agregationIndividus':
      graphe.agregationParNoeud.set(noeud.cle, {
        fonction: regle.fonction,
        enfants: regle.enfants.map((enfant) =>
          construireNoeud({ contexte, graphe, individu: enfant, selection }),
        ),
      })
      break
    case 'agregationAxe':
      graphe.agregationParNoeud.set(noeud.cle, {
        fonction: regle.axe.fonction,
        enfants: regle.selections.map((detail) =>
          construireNoeud({ contexte, graphe, individu, selection: detail }),
        ),
      })
      break
    case 'saisie': {
      const saisies = saisiesDe({ contexte, individu, selection })
      if (saisies) graphe.saisiesParNoeud.set(noeud.cle, saisies)
      break
    }
  }
  return noeud
}

const deciderRegle = ({
  contexte,
  individu,
  selection,
}: {
  contexte: Contexte
  individu: IndividuRef
  selection: Selection
}): Regle => {
  const fonction = getFonctionAgregationActive(individu.id, contexte.hierarchie)
  if (fonction) {
    return {
      type: 'agregationIndividus',
      fonction,
      enfants: contexte.hierarchie.enfantsParParent.get(individu.id) ?? [],
    }
  }
  const axe = axeADetailler({ contexte, selection })
  if (axe) {
    const observees = contexte.observeesParIndividu.get(individu.id) ?? []
    return {
      type: 'agregationAxe',
      axe,
      selections: descendreUnNiveau({ arbre: contexte.arbre, axe, selection }).filter((detail) =>
        estObservee({ arbre: contexte.arbre, observees, selection: detail }),
      ),
    }
  }
  return { type: 'saisie' }
}

const noeudDe = ({
  contexte: { axes, arbre },
  individu,
  selection,
}: {
  contexte: Contexte
  individu: IndividuRef
  selection: Selection
}): Noeud => ({
  cle: [individu.id, ...axes.map((axe) => selection.get(axe.id) ?? '*')].join('~'),
  individuPublicId: individu.publicId,
  modalites: axes.flatMap((axe) => {
    const modaliteId = selection.get(axe.id)
    const modalite = modaliteId === undefined ? undefined : arbre.modaliteParId.get(modaliteId)
    return modalite ? [modalite.publicId] : []
  }),
})

// Dernier axe déclaré encore à détailler : à « Tous » ou sur une modalité parente.
const axeADetailler = ({
  contexte: { axes, arbre },
  selection,
}: {
  contexte: Contexte
  selection: Selection
}): AxeCalcul | undefined =>
  axes.findLast((axe) => {
    const modaliteId = selection.get(axe.id)
    return modaliteId === undefined || !estFeuille({ arbre, modaliteId })
  })

// Saisies d'une sélection complète : celles de la combinaison observée qui lui
// correspond exactement (sans axe, la combinaison vide).
const saisiesDe = ({
  contexte: { axes, observeesParIndividu, saisiesParCellule },
  individu,
  selection,
}: {
  contexte: Contexte
  individu: IndividuRef
  selection: Selection
}): ReadonlyArray<SaisieTronquee> | undefined => {
  const observee = combinaisonObserveeDe({
    axes,
    observees: observeesParIndividu.get(individu.id) ?? [],
    selection,
  })
  return observee
    ? saisiesParCellule.get(
        cleCellule({ individuId: individu.id, combinaisonId: observee.combinaisonId }),
      )
    : undefined
}
