import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'

// Un axe déclaré sur l'indicateur, avec les seules modalités sur lesquelles
// on saisit : les feuilles (spec D9).
export type AxePourImport = {
  publicId: string
  nom: string
  modalitesFeuilles: Array<{ publicId: string; nom: string }>
}

// Dans l'ordre de déclaration sur l'indicateur. Vide pour un indicateur sans axe.
export const listAxesForIndicateur = (
  indicateurPublicId: string,
): ResultAsync<AxePourImport[], never> =>
  ResultAsync.fromSafePromise(
    db().indicateurAxe.findMany({
      where: { indicateur: { publicId: indicateurPublicId } },
      include: {
        axe: {
          include: {
            modalites: { where: { enfants: { none: {} } }, orderBy: { publicId: 'asc' } },
          },
        },
      },
      orderBy: { ordre: 'asc' },
    }),
  ).map((declarations) =>
    declarations.map(({ axe }) => ({
      publicId: axe.publicId,
      nom: axe.nom,
      modalitesFeuilles: axe.modalites.map((modalite) => ({
        publicId: modalite.publicId,
        nom: modalite.nom,
      })),
    })),
  )
