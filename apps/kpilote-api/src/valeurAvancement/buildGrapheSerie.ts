import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import {
  type ArbreModalites,
  type AxeCalcul,
  buildArbreModalites,
  descendOneLevel,
  isLeaf,
  type ModaliteCalcul,
  type Selection,
} from '@/axe/modalites'
import {
  findObservedCombinaison,
  type ObservedCombinaison,
  isObserved,
  groupObservedCombinaisons,
} from '@/axe/observationsIndividu'
import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { celluleKey, type SaisiesCellule } from '@/valeurAvancement/cellule'
import {
  type AgregationNoeud,
  type GrapheSerie,
  type IndividuRef,
  type Noeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieNoeud'

// Construit le graphe de résolution consommé par `resolveSerieNoeud`, pour
// tout indicateur, avec ou sans axe. Fonctions pures ; règle et schémas dans
// la spec multifiltre, §5.
//
// Un nœud est un individu et une sélection : pour chaque axe, une modalité, ou
// « Tous » si l'axe est absent de la sélection. Pour un nœud, on applique la
// première règle qui convient (`decideRule`) :
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

type Rule =
  | {
      type: 'agregationIndividus'
      fonction: FonctionAgregation
      enfants: ReadonlyArray<IndividuRef>
    }
  | { type: 'agregationAxe'; axe: AxeCalcul; selections: ReadonlyArray<Selection> }
  | { type: 'saisie' }

// Entrées de la construction, en lecture seule.
type Context = {
  axes: ReadonlyArray<AxeCalcul>
  arbre: ArbreModalites
  hierarchy: {
    enfantsByParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
    fonctionAgregationByReferentiel: ReadonlyMap<string, FonctionAgregation>
    referentielByIndividu: ReadonlyMap<string, string>
  }
  observedByIndividu: ReadonlyMap<string, ReadonlyArray<ObservedCombinaison>>
  saisiesByCellule: ReadonlyMap<string, ReadonlyArray<SaisieTronquee>>
}

// Le graphe en cours de construction, rempli au fil des nœuds.
type GrapheInProgress = {
  agregationByNoeud: Map<string, AgregationNoeud>
  saisiesByNoeud: Map<string, ReadonlyArray<SaisieTronquee>>
  built: Set<string>
}

export const buildGrapheSerie = ({
  individus,
  enfantsByParent,
  fonctionAgregationByReferentiel,
  axes,
  modalites,
  cellules,
  modalitesByCombinaison,
}: {
  individus: Iterable<IndividuRef>
  enfantsByParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationByReferentiel: ReadonlyMap<string, FonctionAgregation>
  // Dans l'ordre de déclaration ; vide pour un indicateur sans axe.
  axes: ReadonlyArray<AxeCalcul>
  modalites: ReadonlyArray<ModaliteCalcul>
  // Les saisies chargées, par cellule (individu × combinaison).
  cellules: ReadonlyArray<SaisiesCellule>
  // combinaisonId → (axeId → modaliteId) ; vide pour un indicateur sans axe.
  modalitesByCombinaison: ReadonlyMap<string, ReadonlyMap<string, string>>
}): {
  graphe: GrapheSerie
  noeud: (params: { individu: IndividuRef; selection?: Selection }) => Noeud
} => {
  // Une combinaison est observée pour un individu dès qu'elle porte une saisie.
  const cellulesSaisies = cellules.filter((cellule) => cellule.saisies.length > 0)
  const context: Context = {
    axes,
    arbre: buildArbreModalites(modalites),
    hierarchy: {
      enfantsByParent,
      fonctionAgregationByReferentiel,
      referentielByIndividu: new Map(
        [...individus].map((individu) => [individu.id, individu.referentielId]),
      ),
    },
    observedByIndividu: groupObservedCombinaisons({
      cellules: cellulesSaisies,
      modalitesByCombinaison,
    }),
    saisiesByCellule: new Map(
      cellulesSaisies.map((cellule) => [celluleKey(cellule), cellule.saisies]),
    ),
  }
  const graphe: GrapheInProgress = {
    agregationByNoeud: new Map(),
    saisiesByNoeud: new Map(),
    built: new Set(),
  }
  return {
    // Mêmes Maps que la construction : elles se remplissent à chaque appel de `noeud`.
    graphe: {
      agregationByNoeud: graphe.agregationByNoeud,
      saisiesByNoeud: graphe.saisiesByNoeud,
    },
    // Construction à la demande, à partir des nœuds cibles.
    noeud: ({ individu, selection = new Map() }) =>
      buildNoeud({ context, graphe, individu, selection }),
  }
}

const buildNoeud = ({
  context,
  graphe,
  individu,
  selection,
}: {
  context: Context
  graphe: GrapheInProgress
  individu: IndividuRef
  selection: Selection
}): Noeud => {
  const noeud = noeudOf({ context, individu, selection })
  if (graphe.built.has(noeud.key)) return noeud
  graphe.built.add(noeud.key)

  const rule = decideRule({ context, individu, selection })
  switch (rule.type) {
    case 'agregationIndividus':
      graphe.agregationByNoeud.set(noeud.key, {
        fonction: rule.fonction,
        enfants: rule.enfants.map((enfant) =>
          buildNoeud({ context, graphe, individu: enfant, selection }),
        ),
      })
      break
    case 'agregationAxe':
      graphe.agregationByNoeud.set(noeud.key, {
        fonction: rule.axe.fonction,
        enfants: rule.selections.map((detail) =>
          buildNoeud({ context, graphe, individu, selection: detail }),
        ),
      })
      break
    case 'saisie': {
      const saisies = findSaisies({ context, individu, selection })
      if (saisies) graphe.saisiesByNoeud.set(noeud.key, saisies)
      break
    }
  }
  return noeud
}

const decideRule = ({
  context,
  individu,
  selection,
}: {
  context: Context
  individu: IndividuRef
  selection: Selection
}): Rule => {
  const fonction = getFonctionAgregationActive({
    individuId: individu.id,
    hierarchy: context.hierarchy,
  })
  if (fonction) {
    return {
      type: 'agregationIndividus',
      fonction,
      enfants: context.hierarchy.enfantsByParent.get(individu.id) ?? [],
    }
  }
  const axe = findAxeToExpand({ context, selection })
  if (axe) {
    const observed = context.observedByIndividu.get(individu.id) ?? []
    return {
      type: 'agregationAxe',
      axe,
      selections: descendOneLevel({ arbre: context.arbre, axe, selection }).filter((detail) =>
        isObserved({ arbre: context.arbre, observed, selection: detail }),
      ),
    }
  }
  return { type: 'saisie' }
}

const noeudOf = ({
  context: { axes, arbre },
  individu,
  selection,
}: {
  context: Context
  individu: IndividuRef
  selection: Selection
}): Noeud => ({
  key: [individu.id, ...axes.map((axe) => selection.get(axe.id) ?? '*')].join('~'),
  individuPublicId: individu.publicId,
  modalites: axes.flatMap((axe) => {
    const modaliteId = selection.get(axe.id)
    const modalite = modaliteId === undefined ? undefined : arbre.modaliteById.get(modaliteId)
    return modalite ? [modalite.publicId] : []
  }),
})

// Dernier axe déclaré encore à détailler : à « Tous » ou sur une modalité parente.
const findAxeToExpand = ({
  context: { axes, arbre },
  selection,
}: {
  context: Context
  selection: Selection
}): AxeCalcul | undefined =>
  axes.findLast((axe) => {
    const modaliteId = selection.get(axe.id)
    return modaliteId === undefined || !isLeaf({ arbre, modaliteId })
  })

// Saisies d'une sélection complète : celles de la combinaison observée qui lui
// correspond exactement (sans axe, la combinaison vide).
const findSaisies = ({
  context: { axes, observedByIndividu, saisiesByCellule },
  individu,
  selection,
}: {
  context: Context
  individu: IndividuRef
  selection: Selection
}): ReadonlyArray<SaisieTronquee> | undefined => {
  const observed = findObservedCombinaison({
    axes,
    observed: observedByIndividu.get(individu.id) ?? [],
    selection,
  })
  return observed
    ? saisiesByCellule.get(
        celluleKey({ individuId: individu.id, combinaisonId: observed.combinaisonId }),
      )
    : undefined
}
