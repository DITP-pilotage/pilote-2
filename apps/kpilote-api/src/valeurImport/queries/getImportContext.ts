import { type CiblesSaisie } from '@pilote/kpilote-shared/valeurImport'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'

// Ce dont l'import a besoin pour un indicateur : de quoi le nommer à Albert, et
// les cibles sur lesquelles on peut saisir (individus de ses référentiels,
// modalités feuilles de ses axes).
export type ImportContext = {
  indicateur: { nom: string; unite: string | null }
  cibles: CiblesSaisie
}

const loadImportContext = async ({
  indicateurPublicId,
}: {
  indicateurPublicId: string
}): Promise<ImportContext> => {
  // Seul un principal qui peut écrire les valeurs de l'indicateur prépare un import.
  const { indicateur } = await resolveIndicateurForWriteData({ indicateurPublicId })

  const [details, individus, declarations] = await Promise.all([
    db().indicateur.findUniqueOrThrow({ where: { id: indicateur.id } }),
    db().individu.findMany({
      where: { referentiel: { indicateurs: { some: { indicateurId: indicateur.id } } } },
      include: { referentiel: true },
      orderBy: { publicId: 'asc' },
    }),
    db().indicateurAxe.findMany({
      where: { indicateurId: indicateur.id },
      include: {
        axe: {
          include: {
            // On ne saisit que sur les modalités feuilles.
            modalites: { where: { enfants: { none: {} } }, orderBy: { publicId: 'asc' } },
          },
        },
      },
      orderBy: { ordre: 'asc' },
    }),
  ])

  return {
    indicateur: { nom: details.nom, unite: details.unite },
    cibles: {
      individus: individus.map((individu) => ({
        id: individu.publicId,
        nom: individu.nom,
        referentiel: individu.referentiel.publicId,
      })),
      axes: declarations.map(({ axe }) => ({
        id: axe.publicId,
        nom: axe.nom,
        modalites: axe.modalites.map((modalite) => ({ id: modalite.publicId, nom: modalite.nom })),
      })),
    },
  }
}

export const getImportContext = ({
  indicateurPublicId,
}: {
  indicateurPublicId: string
}): ResultAsync<ImportContext, never> =>
  ResultAsync.fromSafePromise(loadImportContext({ indicateurPublicId }))
