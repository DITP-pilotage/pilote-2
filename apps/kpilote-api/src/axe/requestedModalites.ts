import { type SaisieModalitesError } from '@/axe/rules'
import { db } from '@/framework/persistence/dbStore'

// Modalités citées par un appel (lecture `modalites=` ou écriture `modalites`),
// confrontées aux axes que l'indicateur déclare. Le chargement est fait une
// fois, pour une écriture comme pour un lot entier ; les contrôles sont des
// règles pures (`checkModalitesDeclarees`, `checkCelluleComplete` dans `axe/rules.ts`).

export type DeclaredAxe = { id: string; publicId: string }

export type RequestedModalite = {
  id: string
  publicId: string
  axeId: string
  axePublicId: string
  isLeaf: boolean
}

export type ModalitesContext = {
  // Dans l'ordre de déclaration sur l'indicateur.
  declaredAxes: ReadonlyArray<DeclaredAxe>
  // Les modalités citées qui existent (toutes, pas seulement celles des axes déclarés).
  modaliteByPublicId: ReadonlyMap<string, RequestedModalite>
}

export const loadModalitesContext = async ({
  indicateurId,
  modalitePublicIds,
}: {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}): Promise<ModalitesContext> => {
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
    declaredAxes: declarations.map(({ axe }) => ({ id: axe.id, publicId: axe.publicId })),
    modaliteByPublicId: new Map(
      modalites.map((modalite) => [
        modalite.publicId,
        {
          id: modalite.id,
          publicId: modalite.publicId,
          axeId: modalite.axeId,
          axePublicId: modalite.axe.publicId,
          isLeaf: modalite._count.enfants === 0,
        },
      ]),
    ),
  }
}

export const modalitesErrorMessage = (error: SaisieModalitesError): string => {
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
