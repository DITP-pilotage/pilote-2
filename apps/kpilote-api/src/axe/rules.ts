import { err, ok, type Result } from 'neverthrow'

import { type ModalitesContext, type RequestedModalite } from '@/axe/requestedModalites'

export type AxeUtiliseError = { type: 'AXE_UTILISE'; indicateurs: string[] }

// Un indicateur qui déclare l'axe calcule ses totaux sur ses niveaux : en
// ajouter ou en retirer changerait ses résultats. Renommer reste permis.
export const checkNombreNiveauxModifiable = ({
  nombreNiveauxActuel,
  nombreNiveauxCible,
  indicateursDeclarants,
}: {
  // null : l'axe n'existe pas encore.
  nombreNiveauxActuel: number | null
  nombreNiveauxCible: number
  indicateursDeclarants: string[]
}): Result<void, AxeUtiliseError> => {
  if (nombreNiveauxActuel === null) return ok()
  if (nombreNiveauxActuel === nombreNiveauxCible) return ok()
  if (indicateursDeclarants.length === 0) return ok()
  return err({ type: 'AXE_UTILISE', indicateurs: indicateursDeclarants })
}

export type NiveauPorteModalitesError = { type: 'NIVEAU_PORTE_MODALITES'; ordres: number[] }

// Les niveaux au-delà du nombre cible sont supprimés ; un niveau qui porte des
// modalités ne peut pas l'être.
export const checkNiveauxSupprimables = ({
  nombreNiveauxCible,
  ordresPorteursDeModalites,
}: {
  nombreNiveauxCible: number
  ordresPorteursDeModalites: number[]
}): Result<void, NiveauPorteModalitesError> => {
  const ordres = ordresPorteursDeModalites.filter((ordre) => ordre > nombreNiveauxCible)
  if (ordres.length > 0) return err({ type: 'NIVEAU_PORTE_MODALITES', ordres })
  return ok()
}

export type ModalitesDeclareesError =
  | { type: 'MODALITE_INCONNUE'; modalites: string[] }
  | { type: 'AXE_NON_DECLARE'; modalites: string[] }
  | { type: 'MODALITES_MEME_AXE'; axe: string; modalites: string[] }

// Contrôles communs aux lectures et aux écritures : chaque modalité existe,
// appartient à un axe déclaré, et au plus une modalité par axe. Renvoie la
// modalité retenue pour chaque axe cité (axeId → modalité).
export const checkModalitesDeclarees = ({
  context,
  modalitePublicIds,
}: {
  context: ModalitesContext
  modalitePublicIds: ReadonlyArray<string>
}): Result<Map<string, RequestedModalite>, ModalitesDeclareesError> => {
  const requested = [...new Set(modalitePublicIds)]
  const unknown = requested.filter((publicId) => !context.modaliteByPublicId.has(publicId))
  if (unknown.length > 0) return err({ type: 'MODALITE_INCONNUE', modalites: unknown.sort() })

  const modalites = requested.map((publicId) => context.modaliteByPublicId.get(publicId)!)
  const declaredAxeIds = new Set(context.declaredAxes.map((axe) => axe.id))
  const outsideAxes = modalites.filter((modalite) => !declaredAxeIds.has(modalite.axeId))
  if (outsideAxes.length > 0) {
    return err({ type: 'AXE_NON_DECLARE', modalites: outsideAxes.map((m) => m.publicId).sort() })
  }

  const modaliteByAxe = new Map<string, RequestedModalite>()
  for (const modalite of modalites) {
    if (modaliteByAxe.has(modalite.axeId)) {
      const sameAxe = modalites.filter((m) => m.axeId === modalite.axeId).map((m) => m.publicId)
      return err({
        type: 'MODALITES_MEME_AXE',
        axe: modalite.axePublicId,
        modalites: sameAxe.sort(),
      })
    }
    modaliteByAxe.set(modalite.axeId, modalite)
  }
  return ok(modaliteByAxe)
}

export type SaisieModalitesError =
  | ModalitesDeclareesError
  | { type: 'MODALITE_MANQUANTE'; axes: string[] }
  | { type: 'MODALITE_NON_FEUILLE'; modalites: string[] }

// Une valeur se saisit sur une cellule complète : exactement une modalité
// feuille par axe déclaré (aucune pour un indicateur sans axe). Les niveaux
// parents et « Tous » se calculent, ils ne se saisissent pas (spec D9).
// Renvoie les modalités dans l'ordre de déclaration des axes.
export const checkCelluleComplete = ({
  context,
  modalitePublicIds,
}: {
  context: ModalitesContext
  modalitePublicIds: ReadonlyArray<string>
}): Result<RequestedModalite[], SaisieModalitesError> =>
  checkModalitesDeclarees({ context, modalitePublicIds }).andThen(
    (modaliteByAxe): Result<RequestedModalite[], SaisieModalitesError> => {
      const missingAxes = context.declaredAxes.filter((axe) => !modaliteByAxe.has(axe.id))
      if (missingAxes.length > 0) {
        return err({ type: 'MODALITE_MANQUANTE', axes: missingAxes.map((axe) => axe.publicId) })
      }
      const nonLeaves = [...modaliteByAxe.values()].filter((modalite) => !modalite.isLeaf)
      if (nonLeaves.length > 0) {
        return err({
          type: 'MODALITE_NON_FEUILLE',
          modalites: nonLeaves.map((modalite) => modalite.publicId).sort(),
        })
      }
      return ok(context.declaredAxes.map((axe) => modaliteByAxe.get(axe.id)!))
    },
  )

export type ModaliteAutreAxeError = { type: 'MODALITE_AUTRE_AXE'; axe: string }

// Le publicId d'une modalité est unique pour tous les axes : on ne recrée pas
// sous un axe une modalité qui appartient à un autre.
export const checkModaliteDansAxe = ({
  axeId,
  existante,
}: {
  axeId: string
  // null : la modalité n'existe pas encore.
  existante: { axeId: string; axePublicId: string } | null
}): Result<void, ModaliteAutreAxeError> => {
  if (existante === null) return ok()
  if (existante.axeId !== axeId)
    return err({ type: 'MODALITE_AUTRE_AXE', axe: existante.axePublicId })
  return ok()
}

export type ChangementParentInterditError = {
  type: 'CHANGEMENT_PARENT_INTERDIT'
  parentActuel: string | null
}

// Le niveau d'une modalité se déduit de son parent et se fixe à la création :
// une modification ne change que le nom.
export const checkParentInchange = ({
  parentActuel,
  parentCible,
}: {
  parentActuel: string | null
  parentCible: string | null
}): Result<void, ChangementParentInterditError> => {
  if (parentActuel !== parentCible) return err({ type: 'CHANGEMENT_PARENT_INTERDIT', parentActuel })
  return ok()
}

export type ParentModaliteError =
  { type: 'PARENT_INCONNU' } | { type: 'PARENT_AUTRE_AXE'; axe: string }

// Une modalité sans parent est au premier niveau, sinon un niveau sous son
// parent, qui appartient au même axe. Renvoie le parent et l'ordre du niveau.
export const checkParentModalite = ({
  axeId,
  parentPublicId,
  parent,
}: {
  axeId: string
  parentPublicId: string | null
  parent: { id: string; axeId: string; axePublicId: string; ordre: number } | null
}): Result<{ parentId: string | null; ordre: number }, ParentModaliteError> => {
  if (parentPublicId === null) return ok({ parentId: null, ordre: 1 })
  if (!parent) return err({ type: 'PARENT_INCONNU' })
  if (parent.axeId !== axeId) return err({ type: 'PARENT_AUTRE_AXE', axe: parent.axePublicId })
  return ok({ parentId: parent.id, ordre: parent.ordre + 1 })
}

export type NiveauInexistantError = { type: 'NIVEAU_INEXISTANT'; ordre: number }

export const checkNiveauExiste = <N extends { ordre: number }>({
  niveaux,
  ordre,
}: {
  niveaux: ReadonlyArray<N>
  ordre: number
}): Result<N, NiveauInexistantError> => {
  const niveau = niveaux.find((candidat) => candidat.ordre === ordre)
  if (!niveau) return err({ type: 'NIVEAU_INEXISTANT', ordre })
  return ok(niveau)
}

export type ParentPorteValeursError = {
  type: 'PARENT_PORTE_VALEURS'
  parent: string
  valeurs: number
}

// Une modalité qui a des enfants se calcule à partir d'eux : ses propres
// saisies ne sont plus lues (`buildGrapheSerie`). Lui ajouter un premier enfant
// ferait baisser les totaux sans prévenir. Une modalité déjà parente ne lit
// déjà plus ses saisies : un enfant de plus ne change rien.
export const checkParentSansValeur = ({
  parent,
}: {
  // null : la modalité est créée au premier niveau.
  parent: { publicId: string; nombreValeurs: number; nombreEnfants: number } | null
}): Result<void, ParentPorteValeursError> => {
  if (parent === null) return ok()
  if (parent.nombreEnfants > 0) return ok()
  if (parent.nombreValeurs === 0) return ok()
  return err({
    type: 'PARENT_PORTE_VALEURS',
    parent: parent.publicId,
    valeurs: parent.nombreValeurs,
  })
}

export type ModaliteNonSupprimableError =
  | { type: 'MODALITE_A_DES_ENFANTS'; enfants: string[] }
  | { type: 'MODALITE_UTILISEE'; valeurs: number }

// On ne supprime qu'une feuille ; supprimer une modalité qui précise des
// valeurs les rendrait orphelines.
export const checkModaliteSupprimable = ({
  enfants,
  nombreValeurs,
}: {
  enfants: string[]
  nombreValeurs: number
}): Result<void, ModaliteNonSupprimableError> => {
  if (enfants.length > 0) return err({ type: 'MODALITE_A_DES_ENFANTS', enfants })
  if (nombreValeurs > 0) return err({ type: 'MODALITE_UTILISEE', valeurs: nombreValeurs })
  return ok()
}
