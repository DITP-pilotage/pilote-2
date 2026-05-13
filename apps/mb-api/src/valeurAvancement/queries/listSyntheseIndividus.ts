import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { unique } from '@/framework/array'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { groupMedianesByKey } from '@/valeurAvancement/computeMediane'

const computeVariation = (valeurs: ReadonlyArray<{ valeur: Prisma.Decimal }>): number | null => {
  if (valeurs.length === 0) return null
  const [recente, precedente] = valeurs
  const precedenteValeur = precedente?.valeur ?? new Prisma.Decimal(0)
  return recente!.valeur.minus(precedenteValeur).toNumber()
}

const computeEcartMediane = (
  derniereValeur: Prisma.Decimal | undefined,
  mediane: number | null,
): number | null => {
  if (derniereValeur === undefined || mediane === null) return null
  return derniereValeur.minus(mediane).toNumber()
}

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
