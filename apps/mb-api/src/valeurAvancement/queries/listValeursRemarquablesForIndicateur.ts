import {
  type ListValeursRemarquablesForIndicateurQuery,
  type ValeursRemarquablesListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { computeMax } from '@/valeurAvancement/computeMax'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeMin } from '@/valeurAvancement/computeMin'

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

const fetchItemsPourVariation = (indicateurId: string, individus: ReadonlyArray<string>) =>
  db().individu.findMany({
    where: { publicId: { in: [...individus] } },
    orderBy: { publicId: 'asc' },
    include: {
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 2,
      },
    },
  })

const fetchValeursRecentesPopulation = (indicateurId: string) =>
  db().individu.findMany({
    where: { valeurs: { some: { indicateurId } } },
    include: {
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
      },
    },
  })

export const listValeursRemarquablesForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): ResultAsync<ValeursRemarquablesListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.findUniqueOrThrow({
      where: { publicId: indicateurPublicId },
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      Promise.all([
        fetchItemsPourVariation(indicateur.id, params.individus),
        fetchValeursRecentesPopulation(indicateur.id),
      ]),
    ).map(([itemsRows, populationRows]) => {
      const dernieresValeurs = populationRows
        .map((row) => row.valeurs[0]?.valeur.toNumber())
        .filter((v): v is number => v !== undefined)

      const mediane = computeMediane(dernieresValeurs)

      return {
        items: itemsRows.map((row) => ({
          individu: row.publicId,
          variation: computeVariation(row.valeurs),
          ecartMediane: computeEcartMediane(row.valeurs[0]?.valeur, mediane),
        })),
        min: computeMin(dernieresValeurs),
        max: computeMax(dernieresValeurs),
        mediane,
      }
    }),
  )
