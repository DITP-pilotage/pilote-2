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

// Calcul de « Tous » (la marginale) et des modalités parentes d'un indicateur
// à axes : construit le graphe de résolution consommé par `resolveSerieNoeud`.
// Fonctions pures ; règle et schémas dans la spec multifiltre, §5.
//
// Un nœud est un individu et une sélection : pour chaque axe, une modalité, ou
// « Tous » si l'axe est absent de la sélection. Pour un nœud, dans l'ordre :
//
// 1. L'individu se calcule à partir d'individus plus petits (il a des enfants
//    et la fonction de son référentiel n'est pas NONE) : ses enfants sont les
//    mêmes nœuds pour chacun d'eux, combinés avec la fonction du référentiel.
//    Les axes se combinent donc avant le territoire (chemin 1, PIL-1963).
// 2. Sinon, un axe est à « Tous » ou sur une modalité parente : on le détaille
//    d'un cran (premier niveau sous « Tous », enfants sous une modalité
//    parente), en ne gardant que les modalités observées au moins une fois pour
//    cet individu (cube creux), combinées avec la fonction de l'axe. Parmi
//    plusieurs axes, on détaille le dernier déclaré : le premier déclaré se
//    combine ainsi en premier, au plus près des saisies (point n°2, PIL-1963).
// 3. Sinon, tous les axes sont sur une modalité feuille : le nœud est saisi.

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
// feuille par axe.
export type CombinaisonObservee = {
  combinaisonId: string
  modaliteParAxe: ReadonlyMap<string, string>
}

// axeId → modaliteId ; un axe absent vaut « Tous ».
export type Selection = ReadonlyMap<string, string>

export const buildGrapheAxes = ({
  enfantsParParent,
  fonctionAgregationParReferentiel,
  axes,
  modalites,
  observeesParIndividu,
  saisiesParCellule,
}: {
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  // Dans l'ordre de déclaration.
  axes: ReadonlyArray<AxeCalcul>
  modalites: ReadonlyArray<ModaliteCalcul>
  observeesParIndividu: ReadonlyMap<string, ReadonlyArray<CombinaisonObservee>>
  // Saisies par cellule complète (`cleCellule`).
  saisiesParCellule: ReadonlyMap<string, ReadonlyArray<SaisieTronquee>>
}): { graphe: GrapheSerie; noeud: (individu: IndividuRef, selection?: Selection) => Noeud } => {
  const modaliteParId = new Map(modalites.map((m) => [m.id, m]))
  const enfantsDeModalite = new Map<string, string[]>()
  const racinesParAxe = new Map<string, string[]>()
  for (const modalite of modalites) {
    if (modalite.parentId === null) {
      racinesParAxe.set(modalite.axeId, [...(racinesParAxe.get(modalite.axeId) ?? []), modalite.id])
    } else {
      const freres = enfantsDeModalite.get(modalite.parentId) ?? []
      enfantsDeModalite.set(modalite.parentId, [...freres, modalite.id])
    }
  }

  // `modaliteId` est `ancetre` ou l'un de ses descendants.
  const descendDe = (modaliteId: string, ancetre: string): boolean => {
    for (
      let id: string | null = modaliteId;
      id !== null;
      id = modaliteParId.get(id)?.parentId ?? null
    ) {
      if (id === ancetre) return true
    }
    return false
  }

  const correspond = (observee: CombinaisonObservee, selection: Selection): boolean =>
    [...selection].every(([axeId, modaliteId]) => {
      const observe = observee.modaliteParAxe.get(axeId)
      return observe !== undefined && descendDe(observe, modaliteId)
    })

  const referentielParIndividu = new Map<string, string>()
  const enregistrerIndividu = (individu: IndividuRef) =>
    referentielParIndividu.set(individu.id, individu.referentielId)
  const territoire = { enfantsParParent, fonctionAgregationParReferentiel, referentielParIndividu }

  const noeudDe = (individu: IndividuRef, selection: Selection): Noeud => ({
    cle: [individu.id, ...axes.map((axe) => selection.get(axe.id) ?? '*')].join('~'),
    individuPublicId: individu.publicId,
    modalites: axes.flatMap((axe) => {
      const modaliteId = selection.get(axe.id)
      const publicId = modaliteId ? modaliteParId.get(modaliteId)?.publicId : undefined
      return publicId ? [publicId] : []
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
    enregistrerIndividu(individu)
    for (const enfant of enfantsParParent.get(individu.id) ?? []) enregistrerIndividu(enfant)

    // 1. Territoire.
    const fonctionTerritoire = getFonctionAgregationActive(individu.id, territoire)
    if (fonctionTerritoire) {
      const enfants = (enfantsParParent.get(individu.id) ?? []).map((enfant) =>
        construire(enfant, selection),
      )
      agregationParNoeud.set(noeud.cle, { fonction: fonctionTerritoire, enfants })
      return noeud
    }

    // 2. Dernier axe déclaré pas encore sur une modalité feuille.
    const axe = [...axes].reverse().find((candidat) => {
      const modaliteId = selection.get(candidat.id)
      return modaliteId === undefined || (enfantsDeModalite.get(modaliteId)?.length ?? 0) > 0
    })
    const observees = observeesParIndividu.get(individu.id) ?? []
    if (axe) {
      const modaliteId = selection.get(axe.id)
      const candidates =
        modaliteId === undefined
          ? (racinesParAxe.get(axe.id) ?? [])
          : (enfantsDeModalite.get(modaliteId) ?? [])
      const enfants = candidates
        .map((candidate) => new Map([...selection, [axe.id, candidate]]))
        .filter((detail) => observees.some((observee) => correspond(observee, detail)))
        .map((detail) => construire(individu, detail))
      agregationParNoeud.set(noeud.cle, { fonction: axe.fonction, enfants })
      return noeud
    }

    // 3. Saisie de la combinaison complète.
    const observee = observees.find((candidate) =>
      axes.every((a) => candidate.modaliteParAxe.get(a.id) === selection.get(a.id)),
    )
    if (observee) {
      const saisies = saisiesParCellule.get(
        cleCellule({ individuId: individu.id, combinaisonId: observee.combinaisonId }),
      )
      if (saisies) saisiesParNoeud.set(noeud.cle, saisies)
    }
    return noeud
  }

  return {
    graphe: { agregationParNoeud, saisiesParNoeud },
    noeud: (individu, selection = new Map()) => construire(individu, selection),
  }
}
