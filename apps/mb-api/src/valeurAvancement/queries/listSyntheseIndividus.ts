import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { unique } from '@/framework/array'
import { db } from '@/framework/persistence/dbStore'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { groupMedianesByKey } from '@/valeurAvancement/computeMediane'
import { computeVariation } from '@/valeurAvancement/computeVariation'

const fetchLatestValeursIndividus = ({
  indicateurId,
  individuPublicIds,
}: {
  indicateurId: string
  individuPublicIds: ReadonlyArray<string>
}) =>
  db().individu.findMany({
    where: { publicId: { in: [...individuPublicIds] } },
    orderBy: { publicId: 'asc' },
    include: {
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 2,
      },
    },
  })

const fetchLatestValeursParReferentiel = ({
  indicateurId,
  referentielIds,
}: {
  indicateurId: string
  referentielIds: ReadonlyArray<string>
}) =>
  db().individu.findMany({
    where: {
      referentielId: { in: [...referentielIds] },
      valeurs: { some: { indicateurId } },
    },
    include: {
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
      },
    },
  })

const buildSynthese = async (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): Promise<SyntheseIndividusListApiModel> => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: indicateurPublicId },
    select: { id: true },
  })
  const itemsRows = await fetchLatestValeursIndividus({
    indicateurId: indicateur.id,
    individuPublicIds: params.individus,
  })
  const referentielIds = unique(itemsRows.map((row) => row.referentielId))
  const populationRows = referentielIds.length
    ? await fetchLatestValeursParReferentiel({ indicateurId: indicateur.id, referentielIds })
    : []
  const valeursParRef = populationRows.flatMap((row) =>
    row.valeurs.map((v) => ({ referentielId: row.referentielId, valeur: v.valeur })),
  )
  const medianeParRef = groupMedianesByKey(
    valeursParRef,
    (row) => row.referentielId,
    (row) => row.valeur,
  )

  return {
    items: itemsRows.map((row) => ({
      individu: row.publicId,
      variation: computeVariation(row.valeurs),
      ecartMediane: computeEcartMediane(
        row.valeurs[0]?.valeur,
        medianeParRef.get(row.referentielId) ?? null,
      ),
    })),
  }
}

export const listSyntheseIndividus = (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): ResultAsync<SyntheseIndividusListApiModel, never> =>
  ResultAsync.fromSafePromise(buildSynthese(indicateurPublicId, params))
