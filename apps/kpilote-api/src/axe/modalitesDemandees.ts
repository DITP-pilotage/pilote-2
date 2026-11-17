import { err, ok, type Result } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'

// Modalités citées par un appel (lecture `modalites=` ou écriture `modalites`),
// confrontées aux axes que l'indicateur déclare. Le chargement est fait une
// fois, pour une écriture comme pour un lot entier ; les contrôles sont purs.

export type AxeDeclare = { id: string; publicId: string }

export type ModaliteDemandee = {
  id: string
  publicId: string
  axeId: string
  axePublicId: string
  estFeuille: boolean
}

export type ContexteModalites = {
  // Dans l'ordre de déclaration sur l'indicateur.
  axesDeclares: ReadonlyArray<AxeDeclare>
  // Les modalités citées qui existent (toutes, pas seulement celles des axes déclarés).
  modaliteParPublicId: ReadonlyMap<string, ModaliteDemandee>
}

export const chargerContexteModalites = async ({
  indicateurId,
  modalitePublicIds,
}: {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}): Promise<ContexteModalites> => {
  const [declarations, modalites] = await Promise.all([
    db().indicateurAxe.findMany({
      where: { indicateurId },
      include: { axe: true },
      orderBy: { ordre: 'asc' },
    }),
    modalitePublicIds.length === 0
      ? []
      : db().modalite.findMany({
          where: { publicId: { in: [...new Set(modalitePublicIds)] } },
          include: { axe: true, _count: { select: { enfants: true } } },
        }),
  ])
  return {
    axesDeclares: declarations.map(({ axe }) => ({ id: axe.id, publicId: axe.publicId })),
    modaliteParPublicId: new Map(
      modalites.map((modalite) => [
        modalite.publicId,
        {
          id: modalite.id,
          publicId: modalite.publicId,
          axeId: modalite.axeId,
          axePublicId: modalite.axe.publicId,
          estFeuille: modalite._count.enfants === 0,
        },
      ]),
    ),
  }
}

export type LireModalitesError =
  | { type: 'MODALITE_INCONNUE'; modalites: string[] }
  | { type: 'AXE_NON_DECLARE'; modalites: string[] }
  | { type: 'MODALITES_MEME_AXE'; axe: string; modalites: string[] }

// Contrôles communs aux lectures et aux écritures : chaque modalité existe,
// appartient à un axe déclaré, et au plus une modalité par axe. Renvoie la
// modalité retenue pour chaque axe cité (axeId → modalité).
export const lireModalites = ({
  contexte,
  modalitePublicIds,
}: {
  contexte: ContexteModalites
  modalitePublicIds: ReadonlyArray<string>
}): Result<Map<string, ModaliteDemandee>, LireModalitesError> => {
  const demandees = [...new Set(modalitePublicIds)]
  const inconnues = demandees.filter((publicId) => !contexte.modaliteParPublicId.has(publicId))
  if (inconnues.length > 0) return err({ type: 'MODALITE_INCONNUE', modalites: inconnues.sort() })

  const modalites = demandees.map((publicId) => contexte.modaliteParPublicId.get(publicId)!)
  const axesDeclares = new Set(contexte.axesDeclares.map((axe) => axe.id))
  const horsAxes = modalites.filter((modalite) => !axesDeclares.has(modalite.axeId))
  if (horsAxes.length > 0) {
    return err({ type: 'AXE_NON_DECLARE', modalites: horsAxes.map((m) => m.publicId).sort() })
  }

  const parAxe = new Map<string, ModaliteDemandee>()
  for (const modalite of modalites) {
    if (parAxe.has(modalite.axeId)) {
      const memeAxe = modalites.filter((m) => m.axeId === modalite.axeId).map((m) => m.publicId)
      return err({
        type: 'MODALITES_MEME_AXE',
        axe: modalite.axePublicId,
        modalites: memeAxe.sort(),
      })
    }
    parAxe.set(modalite.axeId, modalite)
  }
  return ok(parAxe)
}

export type SaisieModalitesError =
  | LireModalitesError
  | { type: 'MODALITE_MANQUANTE'; axes: string[] }
  | { type: 'MODALITE_NON_FEUILLE'; modalites: string[] }

// Une valeur se saisit sur une cellule complète : exactement une modalité
// feuille par axe déclaré (aucune pour un indicateur sans axe). Les niveaux
// parents et « Tous » se calculent, ils ne se saisissent pas (spec D9).
// Renvoie les modalités dans l'ordre de déclaration des axes.
export const validerModalitesSaisie = ({
  contexte,
  modalitePublicIds,
}: {
  contexte: ContexteModalites
  modalitePublicIds: ReadonlyArray<string>
}): Result<ModaliteDemandee[], SaisieModalitesError> =>
  lireModalites({ contexte, modalitePublicIds }).andThen(
    (parAxe): Result<ModaliteDemandee[], SaisieModalitesError> => {
      const manquants = contexte.axesDeclares.filter((axe) => !parAxe.has(axe.id))
      if (manquants.length > 0) {
        return err({ type: 'MODALITE_MANQUANTE', axes: manquants.map((axe) => axe.publicId) })
      }
      const nonFeuilles = [...parAxe.values()].filter((modalite) => !modalite.estFeuille)
      if (nonFeuilles.length > 0) {
        return err({
          type: 'MODALITE_NON_FEUILLE',
          modalites: nonFeuilles.map((modalite) => modalite.publicId).sort(),
        })
      }
      return ok(contexte.axesDeclares.map((axe) => parAxe.get(axe.id)!))
    },
  )

export const messageModalitesError = (error: SaisieModalitesError): string => {
  switch (error.type) {
    case 'MODALITE_INCONNUE':
      return `Modalités inconnues : ${error.modalites.join(', ')}.`
    case 'AXE_NON_DECLARE':
      return `Ces modalités appartiennent à un axe que l’indicateur ne déclare pas : ${error.modalites.join(', ')}.`
    case 'MODALITES_MEME_AXE':
      return `Une seule modalité par axe : ${error.modalites.join(', ')} appartiennent toutes à l’axe ${error.axe}.`
    case 'MODALITE_MANQUANTE':
      return `Une valeur se saisit avec une modalité pour chaque axe de l’indicateur. Axes sans modalité : ${error.axes.join(', ')}.`
    case 'MODALITE_NON_FEUILLE':
      return `Une valeur se saisit sur des modalités feuilles ; ces modalités se calculent à partir de leurs enfants : ${error.modalites.join(', ')}.`
  }
}
