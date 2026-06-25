import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'

export type IndividuPourImport = { publicId: string; nom: string; referentielPublicId: string }

export const listIndividusForIndicateur = (
  indicateurPublicId: string,
): ResultAsync<IndividuPourImport[], never> =>
  ResultAsync.fromSafePromise(
    db().individu.findMany({
      where: { referentiel: { indicateurs: { some: { indicateur: { publicId: indicateurPublicId } } } } },
      include: { referentiel: true },
      orderBy: { publicId: 'asc' },
    }),
  ).map((rows) =>
    rows.map((individu) => ({
      publicId: individu.publicId,
      nom: individu.nom,
      referentielPublicId: individu.referentiel.publicId,
    })),
  )
