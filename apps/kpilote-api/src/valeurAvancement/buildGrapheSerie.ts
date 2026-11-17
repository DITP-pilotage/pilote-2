import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { cleCellule } from '@/valeurAvancement/cellule'
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

export type AxeCalcul = {
  id: string
  fonction: Extract<FonctionAgregation, 'SUM' | 'AVG'>
}

export type ModaliteCalcul = {
  id: string
  publicId: string
  axeId: string
  parentId: string | null
}

// Combinaison qui porte au moins une valeur pour un individu : une modalité
// feuille par axe (aucune pour la combinaison vide).
export type CombinaisonObservee = {
  combinaisonId: string
  modaliteParAxe: ReadonlyMap<string, string>
}

// axeId → modaliteId ; un axe absent vaut « Tous ».
export type Selection = ReadonlyMap<string, string>

type Regle =
  | {
      type: 'agregationIndividus'
      fonction: FonctionAgregation
      enfants: ReadonlyArray<IndividuRef>
    }
  | { type: 'agregationAxe'; axe: AxeCalcul; selections: ReadonlyArray<Selection> }
  | { type: 'saisie' }

export const buildGrapheSerie = ({
  individus,
  enfantsParParent,
  fonctionAgregationParReferentiel,
  axes,
  modalites,
  observeesParIndividu,
  saisiesParCellule,
}: {
  individus: Iterable<IndividuRef>
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  // Dans l'ordre de déclaration ; vide pour un indicateur sans axe.
  axes: ReadonlyArray<AxeCalcul>
  modalites: ReadonlyArray<ModaliteCalcul>
  observeesParIndividu: ReadonlyMap<string, ReadonlyArray<CombinaisonObservee>>
  // Saisies par cellule (`cleCellule`).
  saisiesParCellule: ReadonlyMap<string, ReadonlyArray<SaisieTronquee>>
}): { graphe: GrapheSerie; noeud: (individu: IndividuRef, selection?: Selection) => Noeud } => {
  const arbre = arbreModalites(modalites)
  const hierarchie = {
    enfantsParParent,
    fonctionAgregationParReferentiel,
    referentielParIndividu: new Map([...individus].map((i) => [i.id, i.referentielId])),
  }
  const observationsParIndividu = new Map<string, ObservationsIndividu>()
  const observationsDe = (individuId: string): ObservationsIndividu => {
    const dejaLues = observationsParIndividu.get(individuId)
    if (dejaLues) return dejaLues
    const observations = observationsIndividu({
      observees: observeesParIndividu.get(individuId) ?? [],
      axes,
      arbre,
    })
    observationsParIndividu.set(individuId, observations)
    return observations
  }

  // Dernier axe déclaré encore à détailler : à « Tous » ou sur une modalité parente.
  const axeADetailler = (selection: Selection): AxeCalcul | undefined =>
    axes.findLast((axe) => {
      const modaliteId = selection.get(axe.id)
      return modaliteId === undefined || !arbre.estFeuille(modaliteId)
    })

  // Descend l'axe d'un niveau : « Tous » donne les modalités racines, une
  // modalité parente ses modalités enfants.
  const descendreUnNiveau = (selection: Selection, axe: AxeCalcul): Selection[] => {
    const modaliteId = selection.get(axe.id)
    const modalitesEnfants =
      modaliteId === undefined ? arbre.racines(axe.id) : arbre.enfants(modaliteId)
    return modalitesEnfants.map((enfant) => new Map([...selection, [axe.id, enfant]]))
  }

  const deciderRegle = (individu: IndividuRef, selection: Selection): Regle => {
    const fonction = getFonctionAgregationActive(individu.id, hierarchie)
    if (fonction) {
      return {
        type: 'agregationIndividus',
        fonction,
        enfants: enfantsParParent.get(individu.id) ?? [],
      }
    }
    const axe = axeADetailler(selection)
    if (axe) {
      const observations = observationsDe(individu.id)
      return {
        type: 'agregationAxe',
        axe,
        selections: descendreUnNiveau(selection, axe).filter(observations.contient),
      }
    }
    return { type: 'saisie' }
  }

  const noeudDe = (individu: IndividuRef, selection: Selection): Noeud => ({
    cle: [individu.id, ...axes.map((axe) => selection.get(axe.id) ?? '*')].join('~'),
    individuPublicId: individu.publicId,
    modalites: axes.flatMap((axe) => {
      const modaliteId = selection.get(axe.id)
      return modaliteId === undefined ? [] : [arbre.publicId(modaliteId)]
    }),
  })

  const agregationParNoeud = new Map<string, AgregationNoeud>()
  const saisiesParNoeud = new Map<string, ReadonlyArray<SaisieTronquee>>()
  const construits = new Set<string>()

  // Construction à la demande, à partir des nœuds cibles.
  const construire = (individu: IndividuRef, selection: Selection): Noeud => {
    const noeud = noeudDe(individu, selection)
    if (construits.has(noeud.cle)) return noeud
    construits.add(noeud.cle)

    const regle = deciderRegle(individu, selection)
    switch (regle.type) {
      case 'agregationIndividus':
        agregationParNoeud.set(noeud.cle, {
          fonction: regle.fonction,
          enfants: regle.enfants.map((enfant) => construire(enfant, selection)),
        })
        break
      case 'agregationAxe':
        agregationParNoeud.set(noeud.cle, {
          fonction: regle.axe.fonction,
          enfants: regle.selections.map((detail) => construire(individu, detail)),
        })
        break
      case 'saisie': {
        const combinaisonId = observationsDe(individu.id).combinaisonDe(selection)
        const saisies =
          combinaisonId === undefined
            ? undefined
            : saisiesParCellule.get(cleCellule({ individuId: individu.id, combinaisonId }))
        if (saisies) saisiesParNoeud.set(noeud.cle, saisies)
        break
      }
    }
    return noeud
  }

  return {
    graphe: { agregationParNoeud, saisiesParNoeud },
    noeud: (individu, selection = new Map()) => construire(individu, selection),
  }
}

// Les modalités des axes, rangées en arbre (une forêt par axe).
type ArbreModalites = {
  racines: (axeId: string) => ReadonlyArray<string>
  enfants: (modaliteId: string) => ReadonlyArray<string>
  estFeuille: (modaliteId: string) => boolean
  // `modaliteId` est `ancetre` ou l'un de ses descendants.
  descendDe: (modaliteId: string, ancetre: string) => boolean
  publicId: (modaliteId: string) => string
}

const arbreModalites = (modalites: ReadonlyArray<ModaliteCalcul>): ArbreModalites => {
  const parId = new Map(modalites.map((m) => [m.id, m]))
  const racinesParAxe = new Map<string, string[]>()
  const enfantsParModalite = new Map<string, string[]>()
  for (const modalite of modalites) {
    const [index, cle] =
      modalite.parentId === null
        ? [racinesParAxe, modalite.axeId]
        : [enfantsParModalite, modalite.parentId]
    index.set(cle, [...(index.get(cle) ?? []), modalite.id])
  }

  const enfants = (modaliteId: string) => enfantsParModalite.get(modaliteId) ?? []
  return {
    racines: (axeId) => racinesParAxe.get(axeId) ?? [],
    enfants,
    estFeuille: (modaliteId) => enfants(modaliteId).length === 0,
    descendDe: (modaliteId, ancetre) => {
      for (let id: string | null = modaliteId; id !== null; id = parId.get(id)?.parentId ?? null) {
        if (id === ancetre) return true
      }
      return false
    },
    publicId: (modaliteId) => parId.get(modaliteId)?.publicId ?? modaliteId,
  }
}

// Ce qui a été saisi pour un individu (le cube creux) : seules les sélections
// qui couvrent au moins une combinaison observée sont attendues.
type ObservationsIndividu = {
  // Une combinaison observée tombe sous la sélection : sur chaque axe choisi,
  // sa modalité est la modalité choisie ou l'une de ses descendantes.
  contient: (selection: Selection) => boolean
  // La combinaison observée d'une sélection complète.
  combinaisonDe: (selection: Selection) => string | undefined
}

const observationsIndividu = ({
  observees,
  axes,
  arbre,
}: {
  observees: ReadonlyArray<CombinaisonObservee>
  axes: ReadonlyArray<AxeCalcul>
  arbre: ArbreModalites
}): ObservationsIndividu => ({
  contient: (selection) =>
    observees.some((observee) =>
      [...selection].every(([axeId, modaliteId]) => {
        const modaliteObservee = observee.modaliteParAxe.get(axeId)
        return modaliteObservee !== undefined && arbre.descendDe(modaliteObservee, modaliteId)
      }),
    ),
  combinaisonDe: (selection) =>
    observees.find((observee) =>
      axes.every((axe) => observee.modaliteParAxe.get(axe.id) === selection.get(axe.id)),
    )?.combinaisonId,
})
